import express from "express";
import { urlencoded, json, raw } from "body-parser";
import { DataTypes, Sequelize, Model, ModelDefined, Optional } from "sequelize";
import fileUpload from "express-fileupload";
import fs from "fs";
import { exec } from "child_process";
import { lookup } from "dns";

const port = 3000;
const storageRoot = "../storage";
const sequelize = new Sequelize(`sqlite:${storageRoot}/symbolstore.db`)

interface SymbolAttributes {
    id: string;
    filename: string;
    path: string;
    serveCount: number;
}

interface SymbolCreationAttributes extends Optional<SymbolAttributes, 'serveCount'> { };

const Symbol: ModelDefined<SymbolAttributes, SymbolCreationAttributes> = sequelize.define('Symbol',
    {
        id: { type: DataTypes.STRING, primaryKey: true },
        filename: { type: DataTypes.STRING, allowNull: false },
        path: { type: DataTypes.STRING, allowNull: false },
        serveCount: { type: DataTypes.NUMBER, allowNull: false, defaultValue: 0 },
    })


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
                console.error(`SymbolPath error`, [stderr, stdout]);
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

app.post("/symbol", async (req, res) => {
    if (req.files) {
        if (req.files.filename) {
            const f = req.files.filename as fileUpload.UploadedFile;
            const md5: string = f.md5 as string;
            const filename: string = f.name as string;

            const storageDir = storageRoot + "/" + md5.substring(0, 2) + "/";
            await makeDirIfNotExist(storageDir).catch((err) => {
                console.error("Failed to create directory", err);
            })

            const storagePath = storageDir + "/" + md5;
            fs.access(storagePath, fs.constants.F_OK, async (err) => {
                if (err) {
                    // nice it doesn't exist
                    f.mv(storagePath, async (err) => {
                        if (err) {
                            res.statusCode = 400;
                            console.error(`Failed to store upload ${filename}`, err)
                            res.send("Failed to store file");
                            return;
                        }

                        let symbolOk: boolean = false;

                        // retrieve debug symbol
                        await symbolLookup(storagePath).then((symbol: string) => {
                            return Symbol.create({
                                id: symbol,
                                filename: filename,
                                path: storagePath
                            }).then(() => { symbolOk = true; });

                        }).catch(() => { });

                        if (symbolOk) {
                            res.statusCode = 200;
                            res.send("Saved binary");
                        }
                        else {
                            fs.rm(storagePath, (err) => { });
                            res.statusCode = 400;
                            res.send("Invalid symbol file!");
                        }
                        return;
                    })

                }
                else {
                    res.statusCode = 400;
                    res.send("File exists!");
                    return;
                }
            })
        }
    }
    res.statusCode = 400;
    res.send("Did not receive file");
    return;
})

app.get("/symbols", async(req, res) => {
    res.send(await Symbol.findAll());
})

app.put("/link", async (req, res) => {
    if (req.body.filename && req.body.id && req.body.filepath) {
        fs.access(req.body.filepath, fs.constants.F_OK, ((err) => {
            if (err) {
                console.error(err);
                res.statusCode = 404;
                res.send("Could not find file at filepath");
                return;
            }

            // we have everything so add it to the database
            res.statusCode = 500;
            res.send("Failed to add file to db");
            return;

        }));
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
