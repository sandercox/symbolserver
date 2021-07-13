import express from "express";
import fs from "fs";
import { exec } from "child_process";
import fileUpload from "express-fileupload";
import path from "path";

import { Symbol } from "./models/Symbol";

const storageRoot = path.resolve(process.env.STORAGE_ROOT || "../storage");

const symbolLookup = async (filepath: string): Promise<string> => {
  return new Promise((fulfill, reject) => {
    const lookup = exec(`bin/SymbolPath ${filepath}`, (err, stdout, stderr) => {
      if (err) {
        console.error(`SymbolPath error ${filepath}`, [stderr, stdout]);
        reject();
      }
      fulfill(stdout.trim());
    });
  });
};

const makeDirIfNotExist = async (path: string) => {
  return new Promise<void>((fulfill, reject) => {
    fs.access(path, fs.constants.F_OK, (err) => {
      if (err) {
        // not exist create
        fs.mkdir(path, { recursive: true }, (err) => {
          if (err) {
            reject();
            return;
          }
          fulfill();
        });
        return;
      }
      fulfill();
    });
  });
};

const router = express.Router();
router.use(fileUpload());

router.get("/", (req, res) => {
    res.render('index');
});



router.post("/symbol", async (req, res) => {
  if (req.files) {
    if (req.files.filename) {
      const f = req.files.filename as fileUpload.UploadedFile;
      const md5: string = f.md5 as string;
      const filename: string = f.name as string;

      const storageDir = storageRoot + "/" + md5.substring(0, 2);
      await makeDirIfNotExist(storageDir).catch((err) => {
        console.error("Failed to create directory", err);
      });

      const extension = filename.substring(filename.indexOf(".", -1));
      const storagePath = storageDir + "/" + md5 + extension;
      fs.access(storagePath, fs.constants.F_OK, async (err) => {
        if (!err) {
          // file exists - try to find it in the database
          const symbol = await Symbol.findOne({ where: { path: storagePath } });
          if (symbol) {
            res.statusCode = 200;
            res.send("Already exists");
            return;
          }

          // file not found in database continue like it wasn't there in the first place
        }

        // file not found in database or doesn't even exists on disk
        // (overwrite) and analyze
        f.mv(storagePath, async (err) => {
          if (err) {
            // error moving temp file to storage location
            res.statusCode = 400;
            console.error(`Failed to store upload ${filename}`, err);
            res.send("Failed to store file");
            return;
          }

          let symbolOk: boolean = false;

          const symbol = await Symbol.findOne({
            where: { path: storagePath.substring(storageRoot.length + 1) }
          });
          if (symbol) {
            console.error(
              `File is already in the database ${storagePath.substring(storageRoot.length + 1)}`
            );
            res.statusCode = 200;
            res.send("Already present");
            return;
          }

          // retrieve debug symbol info
          await symbolLookup(storagePath)
            .then((symbol: string) => {
              return Symbol.create({
                id: symbol,
                filename: filename,
                path: storagePath.substring(storageRoot.length + 1)
              }).then(() => {
                symbolOk = true;
              });
            })
            .catch(() => {
              console.error("SymbolLookup threw error!");
            });

          if (symbolOk) {
            res.statusCode = 201;
            res.send("Saved binary");
          } else {
            fs.rm(storagePath, (err) => {});
            res.statusCode = 400;
            res.send("Invalid symbol file!");
          }
          return;
        });
      });
      return;
    }
  }
  res.statusCode = 400;
  res.send("Did not receive file");
  return;
});

router.get("/symbols", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(await Symbol.findAll()));
});

router.put("/link", async (req, res) => {
  if (req.body.filename && req.body.id && req.body.filepath) {
    fs.access(storageRoot + "/" + req.body.filepath, fs.constants.F_OK, async (err) => {
      if (err) {
        console.error(err);
        res.statusCode = 404;
        res.send("Could not find file at filepath");
        return;
      }

      // we have everything so add it to the database
      await Symbol.create({
        id: req.body.id,
        filename: req.body.filename,
        path: req.body.filepath
      })
        .then(() => {
          res.statusCode = 201;
          res.send("Record added to the database");
          return;
        })
        .catch(() => {
          res.statusCode = 500;
          res.send("Failed to store entry in database");
        });
    });
  } else {
    res.statusCode = 400;
    res.send("Missing filename/id/filepath?");
    return;
  }
});

export default router;
