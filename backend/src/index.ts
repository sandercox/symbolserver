import express from "express";
import { urlencoded, json, raw } from "body-parser";
import { DataTypes, Sequelize, Model, Optional } from "sequelize";
import fileUpload from "express-fileupload";
import fs from "fs";
import { exec } from "child_process";
import { lookup } from "dns";
import { LoadSymbolModel, Symbol } from "./models/Symbol"
import path from "path"
import { Session } from "inspector";

const port = process.env.PORT || 3000;
const storageRoot = path.resolve(process.env.STORAGE_ROOT || "../storage");
const sequelize = new Sequelize(process.env.DB_CONN || `sqlite:${storageRoot}/symbolstore.db`)

LoadSymbolModel(sequelize);

const app = express();

app.get("/", (req, res) => {
    res.render('index');
});

app.use(urlencoded({ extended: true }));
app.use(json({}));
app.use(fileUpload());
app.set('view engine', 'ejs');

const symbolLookup = async (filepath: string): Promise<string> => {
    return new Promise((fulfill, reject) => {
        const lookup = exec(`bin/SymbolPath ${filepath}`, (err, stdout, stderr) => {
            if (err) {
                console.error(`SymbolPath error ${filepath}`, [stderr, stdout]);
                reject();
            }
            fulfill(stdout.trim())
        })

    });
}

const makeDirIfNotExist = async (path: string) => {
    return new Promise<void>((fulfill, reject) => {
        fs.access(path, fs.constants.F_OK, (err) => {
            if (err) {
                // not exist create
                fs.mkdir(path, { recursive: true }, (err) => {
                    if (err) {
                        reject();
                        return
                    }
                    fulfill();
                })
                return;
            }
            fulfill();
        })
    });
};

// Retrieve symbol from store
app.get("/:file/:id/:file", async (req, res) => {
    const symbol = await Symbol.findOne({ where: { id: req.params.id, filename: req.params.file } });
    if (!symbol) {
        res.statusCode = 404;
        res.send("Could not find symbol in database");
        return;
    }
    console.log(storageRoot + "/" + symbol.path);
    fs.access(storageRoot + "/" + symbol.path, fs.constants.F_OK, (err) => {
        if (err) {
            res.statusCode = 404;
            res.send("Could not find symbol in storage location");
            return;
        }
        symbol.serveCount++;
        symbol.save();
        res.sendFile(storageRoot + "/" + symbol.path);
    })
})

app.post("/symbol", async (req, res) => {
    if (req.files) {
        if (req.files.filename) {
            const f = req.files.filename as fileUpload.UploadedFile;
            const md5: string = f.md5 as string;
            const filename: string = f.name as string;

            const storageDir = storageRoot + "/" + md5.substring(0, 2);
            await makeDirIfNotExist(storageDir).catch((err) => {
                console.error("Failed to create directory", err);
            })

            const extension = filename.substring(filename.indexOf('.', -1));
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
                        console.error(`Failed to store upload ${filename}`, err)
                        res.send("Failed to store file");
                        return;
                    }

                    let symbolOk: boolean = false;

                    // retrieve debug symbol info
                    await symbolLookup(storagePath).then((symbol: string) => {
                        return Symbol.create({
                            id: symbol,
                            filename: filename,
                            path: storagePath.substring(storageRoot.length + 1)
                        }).then(() => { symbolOk = true; });

                    }).catch(() => { console.error("SymbolLookup threw error!") });

                    if (symbolOk) {
                        res.statusCode = 201;
                        res.send("Saved binary");
                    }
                    else {
                        fs.rm(storagePath, (err) => { });
                        res.statusCode = 400;
                        res.send("Invalid symbol file!");
                    }
                    return;
                })
            })
            return;
        }
    }
    res.statusCode = 400;
    res.send("Did not receive file");
    return;
})

app.get("/symbols", async (req, res) => {
    res.send(await Symbol.findAll());
})

app.put("/link", async (req, res) => {
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
            }).then(() => {
                res.statusCode = 201;
                res.send("Record added to the database");
                return;
            }).catch(() => {
                res.statusCode = 500;
                res.send("Failed to store entry in database")
            });

        });
    }
    else {
        res.statusCode = 400;
        res.send("Missing filename/id/filepath?")
        return;
    }
})

const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        console.log("Connection to db established");
    }
    catch (error) {
        console.error("Unable to connect to the database:", error);
    }
    app.listen(port, () => {
        console.log("Started server")
    });
};

start()
