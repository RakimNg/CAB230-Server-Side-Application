require("dotenv").config();
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./docs/openapi.json');
var createError = require("http-errors");
var express = require("express");
var cors = require('cors')
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
logger.token('res', (req, res) => {
  const headers = {}
  res.getHeaderNames().map(h => headers[h] = res.getHeader(h))
  return JSON.stringify(headers)
})
const options = require("./knexfile.js");
const knex = require("knex")(options);
var app = express();
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

const peopleRouter = require("./routes/people.js");


app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  req.db = knex;
  next();
});

app.use("/movies", indexRouter);

app.use("/user", usersRouter);
app.use("/people", peopleRouter);
app.get("/knex", function (req, res, next) {
  req.db.raw("SELECT VERSION()")
    .then((version) => console.log(version[0][0]))
    .catch((err) => {
      console.log(err);
      throw err;
    });

  res.send("Version Logged successfully");
});
app.use("/", swaggerUI.serve);
app.get("/", swaggerUI.setup(swaggerDocument));

app.use(function (req, res, next) {
  next(createError(404));
});



app.use(function (err, req, res, next) {


  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};


  res.status(err.status || 500);
  res.render("error");
});


module.exports = app;