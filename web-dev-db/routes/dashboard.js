"use strict";
const express = require("express");
const router = express.Router();
const db = require("../modules/db");

const mqtt = require("mqtt").connect("mqtt://helhatechniquecharleroi.xyz:1883", {
    username: "multi4",
    password: "multi4",
});

const { SerialPort } = require("serialport"); // See https://serialport.io/docs/guide-usage
const { ReadlineParser } = require("@serialport/parser-readline"); // See https://serialport.io/docs/api-parser-readline

const port = new SerialPort({
    path: "/dev/ttyUSB0",
    baudRate: 9600,
    endOnClose: true,
    parity: "none",
});
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

// Useful constants
const [WHITE, BLUE, BLACK, RED, GREEN, ANOMALY] = [0, 1, 2, 3, 4, 5];
const COLOUR_CHOICE_CODE = 3;
const STATE_CHANGE_CODE = 4;

// Variable sent to DB and client
let currentSequenceId = null;
let currentColourId = null;

let currentColour = null;
let matchCounter = 0;
let lastMeasure = null; // Never actually read, but could be useful in the global scope later

let colourCounters = [0, 0, 0, 0, 0, 0]; // white,blue,black,red,green,anomalies
let lastSequence = [];
let recording = false;
let arduinoReady = false;
let dbPingOK = false;

// Checking once if DB is reachable...
dbReachable();
// ... then every 10 sec
setInterval(() => {
    dbPingOK = false;
    dbReachable();
}, 10000);

/* GET home page route. */
router.get("/", function (req, res, next) {
    res.status(200).render("dashboard");
});
/* If any, post current Sequence id (state management) */
router.post("/", function (req, res, next) {
    res.status(200).json({ currentSequenceId });
});

/* Every time data is received from the Arduino Mega, the function triggers.
   The data received is of type "string" */
parser.on("data", data => {
    // If the data is the colour choice, then...
    if (data.length === COLOUR_CHOICE_CODE) {
        currentColour = Number(parseArduinoData(data));
        arduinoReady = true;
        // ... otherwise, if it's the reset signal, then...
    } else if (data.length >= STATE_CHANGE_CODE) {
        arduinoReady = false;
        // ... finally, if the data is a measure, and the DB is ready to write the date, then :
    } else if (currentSequenceId != null && currentColour != null && recording && arduinoReady) {
        const measuredColour = Number(data);
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

        mqtt.publish("/multi4/lu", colourCodeToString(measuredColour));

        lastSequence.push(colourCodeToString(measuredColour));
        mqtt.publish("/multi4/sequence", JSON.stringify(lastSequence));

        // prettier-ignore
        switch(measuredColour){
            case WHITE: db.query(`UPDATE Sequence SET w_count = ? WHERE id = ?`,  [++colourCounters[WHITE],currentSequenceId]);  break;
            case BLUE:  db.query(`UPDATE Sequence SET u_count = ? WHERE id = ?`,  [++colourCounters[BLUE],currentSequenceId]);   break;
            case BLACK: db.query(`UPDATE Sequence SET b_count = ? WHERE id = ?`,  [++colourCounters[BLACK],currentSequenceId]);  break;
            case RED:   db.query(`UPDATE Sequence SET r_count = ? WHERE id = ?`,  [++colourCounters[RED],currentSequenceId]);    break;
            case GREEN: db.query(`UPDATE Sequence SET g_count = ? WHERE id = ?`,  [++colourCounters[GREEN],currentSequenceId]);  break;
            default:    db.query(`UPDATE Sequence SET anomalies = ? WHERE id = ?`,[++colourCounters[ANOMALY],currentSequenceId]);break;
        }

        if (measuredColour === currentColour) {
            // prettier-ignore
            console.log(`### MATCH : ${colourCodeToString(measuredColour)} == ${colourCodeToString(currentColour)}`);
            db.query(
                `UPDATE ChosenColour SET colour_count = ?
                WHERE id = ?`,
                [++matchCounter, currentColourId],
                (err, result) => {
                    if (err) console.error(err);
                    else console.log(`### ${result.info}`);
                }
            );
            mqtt.publish("/multi4/cpt", matchCounter.toString());
        }
    }
});

// #region Create Sequence + ChosenColour in DB
/* Doesn't do anything if already recording data OR if Arduino isn't ready */
router.post("/api/new-sequence", function (req, res, next) {
    if (!recording && arduinoReady) {
        recording = true;

        // #region Global variable reset
        currentSequenceId = null;
        currentColourId = null;
        // currentColour = null; // DO NOT reset this one! It's taken care of by the Arduino.
        lastMeasure = null;
        colourCounters.fill(0);
        matchCounter = 0;
        lastSequence = [];
        mqtt.publish("/multi4/cpt", "0");
        mqtt.publish("/multi4/lu", "");
        // #endregion

        const now = new Date(Date.now());

        // Creating a new Sequence entry in the DB
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
                    if (req.body.clientChosenColour != -1) {
                        // If a colour choice was made client-side, we overwrite the one made on the Arduino.
                        currentColour = Number(req.body.clientChosenColour);
                    }
                    mqtt.publish("/multi4/couleur", colourCodeToString(currentColour));

                    // Creating a new ChosenColour entry in the DB
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
                                res.status(200).json({ currentSequenceId });
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
/* Doesn't do anything if not recording */
router.post("/api/end-sequence", function (req, res, next) {
    if (recording) {
        recording = false;
        arduinoReady = false;
        const now = new Date(Date.now());

        db.query(`UPDATE Sequence SET end = ? WHERE id = ?`, [sqlDateFormat(now), currentSequenceId]);

        console.log(`########## End of Sequence id=${currentSequenceId} at ${sqlDateFormat(now)} ##########`);

        res.status(200).send();
    } else {
        res.status(204).send(); // 204 No Content
    }
});
// #endregion

// #region Client AJAX request
/* Client requesting all useful data to update UI. Happens every second. */
router.post("/api/fetch-data", (req, res) => {
    res.status(200).json({ colourCounters, recording, dbPingOK, arduinoReady, currentColour });
});
// #endregion

// #region Custom functions
/**
 * Simple DB ping with global variable modification.
 */
function dbReachable() {
    db.ping(err => {
        if (!err) {
            dbPingOK = true;
            console.log("### Connected to DB");
        } else {
            dbPingOK = false;
            console.error("### ERROR with DB");
            console.error(err);
        }
    });
}

/**
 * Given a date, returns a string that can be sent in an SQL query
 * @param {Date} date A valid Date object
 * @returns A formatted string valid for SQL
 */
function sqlDateFormat(date) {
    const splitDate = date?.toISOString().split("T"); // toISOString() returns: 2022/05/12T15:28:46.493Z
    const ymd = splitDate[0];
    const time = splitDate[1].split(".")[0];
    return `${ymd} ${time}`; // Returns e.g.: 2022-05-13 12:25:12
}

/**
 * Convert a colour code into a user-readable string.
 * @param {number} colour 0 to 5
 * @returns As a string: "white", "blue", "black"...
 */
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

/**
 * Removes the "$" sign from the signals and returns the useful part.
 * @param {string} data e.g. : "$ 4", "$ 99" ...
 * @returns The useful part of the data, as a string
 */
function parseArduinoData(data) {
    return data.split(" ")[1];
}
// #endregion

module.exports = router;
