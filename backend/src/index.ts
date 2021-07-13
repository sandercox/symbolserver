import express from "express";
import { urlencoded, json, raw } from "body-parser";
import { DataTypes, Sequelize, Model, Optional } from "sequelize";
import fs from "fs";
import { LoadSymbolModel, Symbol } from "./models/Symbol";
import path from "path";

import apiRoutes from "./api";
import cors from "cors";

const port = process.env.PORT || 4000;
const storageRoot = path.resolve(process.env.STORAGE_ROOT || "../storage");
const sequelize = new Sequelize(process.env.DB_CONN || `sqlite:${storageRoot}/symbolstore.db`);

LoadSymbolModel(sequelize);

const app = express();

app.use(urlencoded({ extended: true }));
app.use(json({}));
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV !== "production") {
  app.use(cors({ origin: "http://localhost:3000" }));
}
app.set("view engine", "ejs");
app.use("/api", apiRoutes);
if (process.env.NODE_ENV === "production") {
  app.use(express.static("public"));
}

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
  });
});

app.get("*", (req, res) => {
  if (process.env.NODE_ENV !== "production") res.redirect("http://localhost:3000/");
  else res.sendFile(path.join(__dirname + "/../public/index.html"));
});

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Connection to db established");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
  app.listen(port, () => {
    console.log("Started server");
  });
};

start();
