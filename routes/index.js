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

dbReachable();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* POST test */
router.post('/', function(req, res, next) {
  console.log(req.body.test);
  res.status(200).json(JSON.stringify({hello:"Hi, I'm the server, please stop..."}));
});

/* POST Create a sequence */
router.post('/api/insert', function(req, res, next) {

    const now = new Date(Date.now())
    db.query(
        `INSERT INTO Sequence (start,comment) VALUES (?,?)`, [sqlDate(now),"First test"],
        (err,result) => {
            if(err) console.log(err);
            else console.log(result);
        }
    )
    // 2022-05-13 00:00:00
    res.status(200).send();
  });

  router.post('/api/show', function(req, res, next) {

        db.query(
            `SELECT * FROM Sequence LIMIT 20;`,
            (error, result, field) => {
                if(!error) {
                    console.log('Requete terminée');
                    console.log(result);
                }else {
                    console.log(`${error?.code} : ${error?.sqlMessage}`);
                }
            }
        )
    res.status(200).send();
  });

function dbReachable() {
    db.ping((err) => {
        if(!err) {
            console.log("Connected to DB");
            return true;          
        }
        else{
            console.error(err)
            return false;          
        }
      })
}

function sqlDate(date) {
    const ymd = date.toISOString().split("T")[0];
    const time = date.toISOString().split("T")[1].split(".")[0];
    return `${ymd} ${time}`;
}

module.exports = router;
