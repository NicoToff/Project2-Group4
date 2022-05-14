"use strict";
const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const db = mysql.createConnection({
    host: "db.helhatechniquecharleroi.xyz",
    user: "group4",
    password: "NicolasSajad!",
    database: "group4",
});

const [WHITE, BLUE, BLACK, RED, GREEN, ANOMALY] = [0, 1, 2, 3, 4, 5];

/*const { SerialPort } = require("serialport"); // See https://serialport.io/docs/guide-usage
const { ReadlineParser } = require("@serialport/parser-readline"); // See https://serialport.io/docs/api-parser-readline

const port = new SerialPort({
    path: "/dev/ttyUSB0",
    baudRate: 9600,
    endOnClose: true,
    parity: "none",
}); 

const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

parser.on("data", async data => {
    console.log(`Data: ${data}`);
});*/

let currentSequenceId = null;
let currentColourId = null;
let currentColour = null;
let colourCounters = [0, 0, 0, 0, 0, 0]; // x,white,blue,black,red,green,anomalies
let matchCounter = 0;
let lastMeasure;
let recording = false;

dbReachable();

/* GET home page. */
router.get("/", function (req, res, next) {
    res.render("index", { title: "Express" });
});

router.post("/api/fetch-data", (req, res) => {
    res.status(200).json({ colourCounters, recording });
});

/* POST catching a measurement */
setInterval(() => {
    if (currentSequenceId != null && currentColour != null) {
        recording = true;
        const measuredColour = Number(rndCol());
        lastMeasure = measuredColour;
        console.log(`### Measured colour : ${clr(measuredColour)}`);
        //console.log(`currentSequence = ${currentSequenceId}   currentColour = ${clr(currentColour)}`);

        const now = new Date();

        db.query(
            `INSERT INTO Measure (timestamp,colour,Sequence_id) VALUES (?,?,?)`,
            [sqlDateFormat(now), measuredColour, currentSequenceId],
            (err, result) => {
                if (err) console.error(err);
            }
        );
        // prettier-ignore
        switch(measuredColour){
            case WHITE:   db.query(`UPDATE Sequence SET w_count = ? WHERE id = ?`,  [colourCounters[WHITE]++,currentSequenceId]);break;
            case BLUE:    db.query(`UPDATE Sequence SET u_count = ? WHERE id = ?`,  [colourCounters[BLUE]++,currentSequenceId]);break;
            case BLACK:   db.query(`UPDATE Sequence SET b_count = ? WHERE id = ?`,  [colourCounters[BLACK]++,currentSequenceId]);break;
            case RED:     db.query(`UPDATE Sequence SET r_count = ? WHERE id = ?`,  [colourCounters[RED]++,currentSequenceId]);break;
            case GREEN:   db.query(`UPDATE Sequence SET g_count = ? WHERE id = ?`,  [colourCounters[GREEN]++,currentSequenceId]);break;
            default:      db.query(`UPDATE Sequence SET anomalies = ? WHERE id = ?`,[colourCounters[ANOMALY]++,currentSequenceId]);break;
        }

        if (measuredColour === currentColour) {
            console.log(`### IT'S A MATCH : ${clr(measuredColour)} == ${clr(currentColour)}`);
            db.query(
                `UPDATE ChosenColour SET colour_count = ?
                 WHERE id = ?`,
                [matchCounter++, currentColourId],
                (err, result) => {
                    if (err) console.error(err);
                    else console.log(`### ${result.info}`);
                }
            );
        }
    }
}, 1000);

/* POST ending a sequence */
router.post("/api/end-sequence", function (req, res, next) {
    if (recording) {
        const now = new Date();
        recording = false;

        db.query(`UPDATE Sequence SET end = ? WHERE id = ?`, [sqlDateFormat(now), currentSequenceId]);

        console.log(`### End of Sequence id=${currentSequenceId} at ${sqlDateFormat(now)}`);

        // Global variable reset
        currentSequenceId = null;
        currentColourId = null;
        currentColour = null;
        lastMeasure = null;
        colourCounters.fill(0);
        matchCounter = 0;
    }

    res.status(200).send();
});

/* POST Create a Sequence and ChosenColour entry */
router.post("/api/new-sequence", function (req, res, next) {
    const now = new Date();
    db.query(
        `INSERT INTO Sequence (start,comment) VALUES (?,?)`,
        [sqlDateFormat(now), req.body.comment],
        (err, result) => {
            if (err) console.error(err);
            else {
                console.log(`### New Sequence created: id#${result.insertId}`);
                currentSequenceId = result.insertId;
                currentColour = Number(req.body.chosen_colour);
                db.query(
                    `INSERT INTO ChosenColour (chosen_colour,Sequence_id) VALUES (?,?)`,
                    [currentColour, currentSequenceId],
                    (err, result) => {
                        if (err) console.error(err);
                        else {
                            console.log(`### New ChosenColour created: id#${result.insertId}`);
                            console.log(`##### Chosen colour == ${clr(currentColour)}`);
                            currentColourId = result.insertId;
                        }
                    }
                );
            }
        }
    );

    res.status(200).send();
});

/* POST show sequences */
router.post("/api/show", function (req, res, next) {
    db.query(`SELECT * FROM Sequence LIMIT 20;`, (error, result, field) => {
        if (!error) {
            console.log("### Requete terminée");
            console.log(result);
        } else {
            console.log(`${error?.code} : ${error?.sqlMessage}`);
        }
    });
    res.status(200).send();
});

function dbReachable() {
    db.ping(err => {
        if (!err) {
            console.log("### Connected to DB");
        } else {
            console.error(err);
        }
    });
}

function sqlDateFormat(date) {
    const splitDate = date.toISOString().split("T");
    const ymd = splitDate[0];
    const time = splitDate[1].split(".")[0];
    return `${ymd} ${time}`; // Returns e.g.: 2022-05-13 00:00:00
}
// prettier-ignore
function clr(colour) {
    switch(colour) {
        case WHITE:  return "white";
        case BLUE:   return "blue";
        case BLACK:  return "black";
        case RED:    return "red";
        case GREEN:  return "green";
        default:     return "colour_not_recongnized";
    }
}

function rndCol() {
    return Math.floor(Math.random() * 5 + (Math.random() > 0.8 ? 1 : 0)).toString();
}

module.exports = router;
