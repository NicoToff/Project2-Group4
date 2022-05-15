"use strict";
const mysql = require("mysql2");
const db = mysql.createConnection({
    host: "db.helhatechniquecharleroi.xyz",
    user: "group4",
    password: "NicolasSajad!",
    database: "group4",
    timezone: "Z", // Z = "UTC"
});

module.exports = db;
