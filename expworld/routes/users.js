var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const authorization = require("../middleware/authorization.js");
const logout = require("../middleware/logout.js")
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});


router.post("/refresh", authorization, function (req, res, next) {
  // const jwt = authorization.jwt


});
router.post("/logout", logout, function (req, res, next) {
  // const jwt = authorization.jwt


});
router.post("/register", function (req, res, next) {
  const email = req.body.email;
  const password = req.body.password;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const dob = req.body.dob;
  const address = req.body.address;

  const saltRounds = 10;

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

    const hash = bcrypt.hashSync(password, saltRounds);
    console.log("hash:" + hash);
    return req.db.from("users").insert({ email, hash, firstName, lastName, dob, address });
  })
    .then(() => {
      console.log("Successfully inserted user");
      res.status(201).json({ success: true, message: "User inserted successfully" });
    })
    .catch(e => {
      console.log(e.message)
      const hash = bcrypt.hashSync(password, saltRounds);
      console.log(typeof hash);
      console.log("hash:" + hash);
      console.log("user register with: email: " + email + "password" + password)

      res.status(500).json({ success: false, message: e.message });
    });
});


router.post("/login", function (req, res, next) {
  const email = req.body.email;
  const password = req.body.password;

  // Verify body
  if (!email || !password) {
    return res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed"
    });
  }

  const queryUsers = req.db.from("users").select("*").where("email", "=", email);

  queryUsers
    .then(users => {
      if (users.length === 0) {
        res.status(401).json({
          error: true,
          message: "user does not exist"
        });
      } else {
        const user = users[0];
        console.log(email)
        console.log(password)
        console.log(typeof user)
        console.log(users.length)
        return bcrypt.compare(password, user.hash)
          .then((passwordMatch) => {
            if (passwordMatch) {
              const expires_in_1 = 600;
              const expires_in_2 = 86400;
              const exp = Math.floor(Date.now() / 1000) + expires_in_1;
              const exp_ = Math.floor(Date.now() / 1000) + expires_in_2;
              const token = jwt.sign({ exp, email }, JWT_SECRET);
              const token_1 = jwt.sign({ exp_, email }, JWT_SECRET);

              if (!expires_in_1 || !token) {
                return res.status(400).json({ message: `Error updating population` });
              } else {
                return res.status(200).json({
                  bearerToken: {
                    token,
                    token_type: "Bearer",
                    expires_in: expires_in_1
                  },
                  refreshToken:
                  {
                    token_1,
                    token_type: "Refresh",
                    expires_in: expires_in_2
                  }
                });
              }
            } else {
              return res.status(401).json({
                error: true,
                message: "Incorrect password"
              });
            }
          })
          .catch(error => {
            // Handle any potential errors
            console.error(error);
            return res.status(500).json({
              error: true,
              message: "Internal Server Error"
            });
          });
      }
    })
    .catch(error => {
      // Handle any potential errors
      console.error(error);
      return res.status(500).json({
        error: true,
        message: "Internal Server Error"
      });
    });
});
module.exports = router;
