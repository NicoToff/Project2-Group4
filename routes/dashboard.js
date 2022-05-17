"use strict";
const express = require("express");
const router = express.Router();
const db = require("../modules/db");
const mqtt = require("mqtt").connect("mqtt://helhatechniquecharleroi.xyz:1883", {
    username: "multi4",
    password: "multi4",

    // reconnectPeriod: 1000,
    // connectTimeout: 60000,
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
let matchCounter = 0;
let lastMeasure = null;

let colourCounters = [0, 0, 0, 0, 0, 0]; // white,blue,black,red,green,anomalies
let lastSequence = [];
let recording = false;

dbReachable();

mqtt.subscribe(["/multi4/lu", "/multi4/colour", "/multi4/cpt", "/multi4/sequence"]);
mqtt.on("message", (topic, message) => {
    console.log(`READING ${topic} : ${message}`);
});
/* GET home page. */
router.get("/", function (req, res, next) {
    res.status(200).render("dashboard");
});
/* Post current state (state management) */
router.post("/", function (req, res, next) {
    res.status(200).json({ currentSequenceId, currentColour, matchCounter });
});

// #region Client AJAX request
/* Client requesting all the colours counts + recording status 
   Happens every second. */
router.post("/api/fetch-data", (req, res) => {
    res.status(200).json({ colourCounters, recording });
});
// #endregion

// #region FakeMeasurements
/* POST pretending to take a measurement every second */
/* THIS WILL LATER BE PUT IN parser.on("data", ... ) */
setInterval(() => {
    if (currentSequenceId != null && currentColour != null && recording === true) {
        const measuredColour = Number(rndCol());
        lastMeasure = measuredColour;
        console.log(`### Measured colour : ${colourCodeToString(measuredColour)}`);

        const now = new Date(Date.now());

        db.query(
            `INSERT INTO Measure (timestamp,colour,Sequence_id) VALUES (?,?,?)`,
            [sqlDateFormat(now), measuredColour, currentSequenceId],
            (err, result) => {
                if (err) console.error(err);
            }
        );

        mqtt.publish("/multi4/lu", colourCodeToString(lastMeasure), () => {
            console.log(`${colourCodeToString(lastMeasure)} SENT TO MQTT`);
        });

        lastSequence.push(colourCodeToString(measuredColour));

        // prettier-ignore
        switch(measuredColour){
            case WHITE:   db.query(`UPDATE Sequence SET w_count = ? WHERE id = ?`,  [++colourCounters[WHITE],currentSequenceId]);break;
            case BLUE:    db.query(`UPDATE Sequence SET u_count = ? WHERE id = ?`,  [++colourCounters[BLUE],currentSequenceId]);break;
            case BLACK:   db.query(`UPDATE Sequence SET b_count = ? WHERE id = ?`,  [++colourCounters[BLACK],currentSequenceId]);break;
            case RED:     db.query(`UPDATE Sequence SET r_count = ? WHERE id = ?`,  [++colourCounters[RED],currentSequenceId]);break;
            case GREEN:   db.query(`UPDATE Sequence SET g_count = ? WHERE id = ?`,  [++colourCounters[GREEN],currentSequenceId]);break;
            default:      db.query(`UPDATE Sequence SET anomalies = ? WHERE id = ?`,[++colourCounters[ANOMALY],currentSequenceId]);break;
        }

        mqtt.publish("/multi4/colourcounters", JSON.stringify(colourCounters));

        if (measuredColour === currentColour) {
            console.log(
                `### IT'S A MATCH : ${colourCodeToString(measuredColour)} == ${colourCodeToString(
                    currentColour
                )}`
            );
            db.query(
                `UPDATE ChosenColour SET colour_count = ?
                 WHERE id = ?`,
                [++matchCounter, currentColourId],
                (err, result) => {
                    if (err) console.error(err);
                    else console.log(`### ${result.info}`);
                }
            );
            mqtt.publish("/multi4/cpt", matchCounter.toString(), () => {
                console.log(`${matchCounter} SENT TO MQTT`);
            });
        }
    }
}, 1000);
// #endregion

// #region Create Sequence + ChosenColour in DB
router.post("/api/new-sequence", function (req, res, next) {
    if (!recording) {
        // #region Global variable reset
        currentSequenceId = null;
        currentColourId = null;
        currentColour = null;
        lastMeasure = null;
        colourCounters.fill(0);
        matchCounter = 0;
        lastSequence = [];
        // #endregion

        recording = true;
        mqtt.publish("/multi4/status", "on");
        const now = new Date(Date.now());

        db.query(
            `INSERT INTO Sequence (start,comment) VALUES (?,?)`,
            [sqlDateFormat(now), req.body.comment],
            (err, result) => {
                if (err) {
                    console.error(err);
                    res.status(503).send(); // 503 Service Unavailable
                } else {
                    console.log(`########## New Sequence created: id#${result.insertId} ##########`);
                    currentSequenceId = result.insertId;
                    currentColour = Number(req.body.chosen_colour);
                    mqtt.publish("/multi4/colour", colourCodeToString(currentColour), () => {
                        console.log(`${colourCodeToString(currentColour)} SENT TO MQTT`);
                    });
                    db.query(
                        `INSERT INTO ChosenColour (chosen_colour,Sequence_id) VALUES (?,?)`,
                        [currentColour, currentSequenceId],
                        (err, result) => {
                            if (err) {
                                console.error(err);
                                res.status(503).send(); // 503 Service Unavailable
                            } else {
                                console.log(`### New ChosenColour created: id#${result.insertId}`);
                                console.log(`##### Chosen colour == ${colourCodeToString(currentColour)}`);
                                currentColourId = result.insertId;
                                res.status(200).json({ currentSequenceId, currentColour });
                            }
                        }
                    );
                }
            }
        );
    } else {
        res.status(204).send(); // 204 No Content
    }
});
// #endregion

// #region Ending The Sequence
router.post("/api/end-sequence", function (req, res, next) {
    if (recording) {
        const now = new Date(Date.now());
        recording = false;
        mqtt.publish("/multi4/status", "off");
        console.table(lastSequence);

        db.query(`UPDATE Sequence SET end = ? WHERE id = ?`, [sqlDateFormat(now), currentSequenceId]);

        mqtt.publish("/multi4/sequence", JSON.stringify(lastSequence), () => {
            console.log(`${JSON.stringify(lastSequence)} SENT TO MQTT`);
        });

        console.log(`########## End of Sequence id=${currentSequenceId} at ${sqlDateFormat(now)} ##########`);

        res.status(200).send();
    } else {
        res.status(204).send(); // 204 No Content
    }
});
// #endregion
db.ping();
// #region Custom functions
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
    return `${ymd} ${time}`; // Returns e.g.: 2022-05-13 12:25:12
}
// prettier-ignore
function colourCodeToString(colour) {
    switch(colour) {
        case WHITE:  return "white";
        case BLUE:   return "blue";
        case BLACK:  return "black";
        case RED:    return "red";
        case GREEN:  return "green";
        default:     return "colour_not_recognized";
    }
}

const rndCol = () => Math.floor(Math.random() * 5 + (Math.random() > 0.95 ? 1 : 0)).toString();
// #endregion

module.exports = router;
