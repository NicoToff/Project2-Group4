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

let dbReachable = false;

db.ping((err) => {
  if(!err) {
    dbReachable = true;
    console.log("Connected to DB");
  }
  else{
    dbReachable = false;
    console.error(err)
  }
})

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* POST test */
router.post('/', function(req, res, next) {
  console.log(req.body.test);
  res.status(200).json(JSON.stringify({hello:"Hi, I'm the server, please stop..."}));
});


module.exports = router;
