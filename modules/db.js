"use strict";
const mysql = require("mysql2");
let db;
try {
    db = mysql.createConnection({
        host: "db.helhatechniquecharleroi.xyz",
        user: "group4",
        password: "NicolasSajad!",
        database: "group4",
        timezone: "Z", // Z = "UTC"
    });
} catch (err) {
    console.error("Connexion to database FAILED");
}

module.exports = db;
