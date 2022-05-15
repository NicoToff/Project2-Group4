"use strict";
const express = require("express");
const router = express.Router();
const db = require("../modules/db");

/* GET History page with Sequence listing. */
router.get("/", function (req, res, next) {
    db.query(`SELECT * FROM Sequence;`, (error, result, field) => {
        if (!error) {
            console.log(result);
            console.log("### Requete terminée");
            res.render("history", { result });
        } else {
            console.log(`${error?.code} : ${error?.sqlMessage}`);
            res.status(500).send();
        }
    });
});

router.get("/:id", function (req, res, next) {
    const selectedId = req.params.id;
    db.query(`SELECT * FROM Measure WHERE Measure.Sequence_id = ?`, [selectedId], (error, result, field) => {
        if (!error) {
            console.log("### Requete terminée");
            res.render("history-measure", { result, selectedId });
        } else {
            console.log(`${error?.code} : ${error?.sqlMessage}`);
            res.status(500).send();
        }
    });
});

module.exports = router;
