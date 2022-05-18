"use strict";
const express = require("express");
const router = express.Router();
const db = require("../modules/db");

/* GET History page with Sequence listing. */
router.get("/", function (req, res, next) {
    db.query(`SELECT * FROM Sequence;`, (error, result, field) => {
        if (!error) {
            console.log("### SELECT query has completed correctly");
            res.render("history", { result });
        } else {
            console.log(`${error?.code} : ${error?.sqlMessage}`);
            res.status(500).send();
        }
    });
});

/* GET history-measure-chosen page with chosen colour total. */
router.get("/chosen/:id", function (req, res, next) {
    const selectedId = req.params.id;
    db.query(
        `SELECT * FROM ChosenColour WHERE ChosenColour.Sequence_id = ?`,
        [selectedId],
        (error, result, field) => {
            if (!error) {
                console.log("### SELECT query has completed correctly");
                result = result[0];
                res.render("history-measure-chosen", { result, selectedId });
            } else {
                console.log(`${error?.code} : ${error?.sqlMessage}`);
                res.status(500).send();
            }
        }
    );
});

/* GET history-measure page containing all Measures for a given Sequence. */
router.get("/:id", function (req, res, next) {
    const selectedId = req.params.id;
    db.query(`SELECT * FROM Measure WHERE Measure.Sequence_id = ?`, [selectedId], (error, result, field) => {
        if (!error) {
            console.log("### SELECT query has completed correctly");
            res.render("history-measure", { result, selectedId });
        } else {
            console.log(`${error?.code} : ${error?.sqlMessage}`);
            res.status(500).send();
        }
    });
});

module.exports = router;
