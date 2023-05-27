var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const authorization = require("../middleware/authorization.js");
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.post("/register", function (req, res, next) {

  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed"
    });
    return;
  }
  const queryUsers = req.db.from("users").select("*").where("email", "=", email);
  queryUsers.then(users => {
    if (users.length > 0) {
      throw new Error("User already exists");
    }

    // Insert user into DB
    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds);
    return req.db.from("users").insert({ email, hash });
  })
    .then(() => {
      console.log("Successfully inserted user");
    })
    .catch(e => {
      res.status(500).json({ success: false, message: e.message });
    })


});

router.post("/login", function (req, res, next) {
  const email = req.body.email;
  const password = req.body.password;

  // Verify body
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed"
    });
    return;
  }
  const queryUsers = req.db.from("users").select("*").where("email", "=", email);
  queryUsers
    .then(users => {
      if (users.length === 0) {
        throw new Error("User does not exist");
      }

      // Compare password hashes
      const user = users[0];
      return bcrypt.compare(password, user.hash);
    })
    .then(match => {
      if (!match) {
        throw new Error("Passwords do not match");
      }
      console.log("Passwords match");
    });

  const expires_in = 60 * 60 * 24;
  const exp = Math.floor(Date.now() / 1000) + expires_in;
  const token = jwt.sign({ exp, email }, JWT_SECRET);
  if (!expires_in || !token) {
    res.status(400).json({ message: `Error updating population` });
    console.log(`Error on request body:`, JSON.stringify(req.body));

  }
  else {
    res.status(200).json({
      token,
      token_type: "Bearer",
      expires_in
    });

  }

});
module.exports = router;
