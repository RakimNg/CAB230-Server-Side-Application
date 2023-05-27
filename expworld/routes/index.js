var express = require("express");
var router = express.Router();
const authorization = require("../middleware/authorization.js");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});


router.get("/api/city", function (req, res, next) {
  req.db
    .from("city")
    .select("name", "district")
    .then((rows) => {
      res.json({ Error: false, Message: "Success", City: rows });
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Error in MySQL query" });
    });
});

router.get("/api/movie", function (req, res, next) {
  req.db
    .from("basics")
    .select("primaryTitle", "year")
    .then((rows) => {
      res.json({ Error: false, Message: "Success", City: rows });
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Error in MySQL query" });
    });
});

router.post("/api/city/update", authorization, function (req, res, next) {
  // const jwt = authorization.jwt
  if (!req.body.Name || !req.body.CountryCode || !req.body.Population) {
    res.status(400).json({ message: `Error updating population` });
    console.log(`Error on request body:`, JSON.stringify(req.body));

  }
  else {
    const filter = {
      "Name": req.body.Name,
      "CountryCode": req.body.CountryCode
    };
    const pop = {
      "Population": req.body.Population
    };
    req.db('city').where(filter).update(pop)
      .then(_ => {
        res.status(201).json({ message: `Successful update ${req.body.Name}` });
        console.log(`successful population update:`, JSON.stringify(filter));
      }).catch(error => {
        res.status(500).json({ message: 'Database error - not updated' });
      });

  }

});



router.get("/api/city/:CountryCode", function (req, res, next) {
  req.db
    .from("city")
    .select("*")
    .where("CountryCode", "=", req.params.CountryCode)
    .then((rows) => {
      res.json({ Error: false, Message: "Success", City: rows });
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Error in MySQL query" });
    });
});

router.get("/api/movie/:CountryCode", function (req, res, next) {
  req.db
    .from("basics")
    .select("*")
    .where("country", "=", req.params.CountryCode)
    .then((rows) => {
      res.json({ Error: false, Message: "Success", City: rows });
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Error in MySQL query" });
    });
});

module.exports = router;