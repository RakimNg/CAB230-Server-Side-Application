var express = require("express");
var router = express.Router();
const authorization = require("../middleware/authorization.js");

/* GET home page. */
// router.get("/", function (req, res, next) {
//   res.render("index", { title: "Express" });
// });



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
    .select()
    .where("CountryCode", "=", req.params.CountryCode)
    .then((rows) => {
      res.json({ Error: false, Message: "Success", City: rows });
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Error in MySQL query" });
    });
});


router.get("/movies/data/:imdbID", function (req, res, next) {
  req.db
    .from("basics")
    .select()
    .where("tconst", "=", req.params.imdbID)
    .then((rows) => {
      res.json({ Error: false, Message: "Success", Movie: rows });
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Error in MySQL query" });
    });
});
router.get("/people/", function (req, res, next) {
  req.db
    .from("principals")
    .select()
    .then((rows) => {
      res.json({ Error: false, Message: "Success", Movie: rows });
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Error in MySQL query" });
    });
});
// authorization,
router.get("/people/:ID", authorization, function (req, res, next) {
  req.db
    .from("principals")
    .select()
    .where("nconst", "=", req.params.ID)
    .then((rows) => {
      res.json({ Error: false, Message: "Success", Movies: rows });
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Error in MySQL query" });
    });
});
router.get("/movies/search", function (req, res, next) {

  let name = "";
  let year = "";
  let page = 1; // Current page number, default: 1

  let limit = 100 // Number of records per page, default: 10

  if (req.query.primaryTitle) {
    name = req.query.primaryTitle;

  }
  if (req.query.page) {
    page = parseInt(req.query.page)
  }
  let offset = (page - 1) * limit; // Calculate the offset for pagination
  console.log(page)
  if (req.query.year) {
    year = req.query.year;
    console.log(year);
  }
  console.log(name);
  req.db
    .from("basics")
    .select()
    .where("primaryTitle", "LIKE", `%${name}%`)
    .andWhere("year", "LIKE", `%${year}%`)
    .limit(limit)
    .offset(offset)
    .then((rows) => {
      res.json({ Error: false, Message: "Success", Movie: rows });
      console.log("..."); // Move the console print here
      return;
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Error in MySQL query" });
      return;
    });
});
module.exports = router;