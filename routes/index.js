"use strict";
const express = require('express');
const router = express.Router();
const mysql = require("mysql2");
const db = mysql.createConnection({
  host: "db.helhatechniquecharleroi.xyz",
  user: "group4",
  password: "NicolasSajad!",
  database: "group4"
})


//const { SerialPort } = require("serialport"); // See https://serialport.io/docs/guide-usage
//const { ReadlineParser } = require("@serialport/parser-readline"); // See https://serialport.io/docs/api-parser-readline

//const port = new SerialPort({
//    path: "/dev/ttyUSB0",
//    baudRate: 9600,
//});

//const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

//parser.on("data", async data => {
//    console.log(`Data: ${data}`);
//});

let currentSequenceId = null;
let currentColourId = null;
let currentColour = null;
let matchCounter = 0;

dbReachable();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* POST test */
router.post('/api/send-measure', function(req, res, next) {
    if(currentSequenceId != null && currentColour != null){
        console.log(`Measured colour : ${clr(req.body.colour)}`);
        console.log(`currentSequence = ${currentSequenceId}   currentColour = ${clr(currentColour)}`);
        if(req.body.colour === currentColour){
            console.log(`IT'S A MATCH : ${clr(req.body.colour)} == ${clr(currentColour)}`);
            db.query(
                `UPDATE ChosenColour SET colour_count = ?
                 WHERE id = ?`,
                [matchCounter++,currentColourId],
                (err,result) => {
                    if(err) console.error(err);
                    else console.log(result);
                }
            )
        }            
        res.status(200).json(JSON.stringify(`SERVER: Measure sent to Sequence#${currentSequenceId}`));
        
    }
    else {
        res.status(200).send();
    }
});

/* POST Create a sequence */
router.post('/api/new-record', function(req, res, next) {

    const now = new Date(Date.now())
    db.query(
        `INSERT INTO Sequence (start,comment) VALUES (?,?)`,
        [sqlDateFormat(now),req.body.comment],
        (err,result) => {
            if(err) console.error(err);
            else {
                console.log(result);
                currentSequenceId = result.insertId;
                currentColour = req.body.chosen_colour;
                db.query(
                    `INSERT INTO ChosenColour (chosen_colour,Sequence_id) VALUES (?,?)`,
                    [currentColour, currentSequenceId],
                    (err,result) => {
                        if(err) console.error(err);
                        else {                            
                            console.log(result);
                            currentColourId = result.insertId;
                        }
                    }
                )
            }
        })

    res.status(200).send();
  });

/* POST show sequences */
  router.post('/api/show', function(req, res, next) {
        db.query(
            `SELECT * FROM Sequence LIMIT 20;`,
            (error, result, field) => {
                if(!error) {
                    console.log('Requete terminée');
                    console.log(result);
                } else {
                    console.log(`${error?.code} : ${error?.sqlMessage}`);
                }
            });
    res.status(200).send();
  });

function dbReachable() {
    db.ping((err) => {
        if(!err) {
            console.log("Connected to DB");         
        }
        else{
            console.error(err)       
        }
      })
}

function sqlDateFormat(date) {
    const ymd = date.toISOString().split("T")[0];
    const time = date.toISOString().split("T")[1].split(".")[0];
    return `${ymd} ${time}`; // Returns e.g.: 2022-05-13 00:00:00
}

function clr(colour) {
    switch(colour) {
        case 1: case "1": return "white";
        case 2: case "2": return "blue";
        case 3: case "3": return "black";
        case 4: case "4": return "red";
        case 5: case "5": return "green";
        default: return "colour_not_recongnized";
    }
}

module.exports = router;
