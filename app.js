var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const passport = require("passport");
const config = require("./config.js")
//const session = require('express-session');

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const farmRouter = require("./routes/farmRouterTest");

const mongoose = require("mongoose");

const url = config.mongoUrl;
console.log("mongoUrl", url)
const connect = mongoose.connect(url);

connect.then(
  () => console.log(`Connected correctly to server - booyah`),
  (err) => console.log(err)
);

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(passport.initialize());
//app.use(passport.session());

app.use("/api/", indexRouter);
app.use("/api/users", usersRouter);

app.use("/api/farms", farmRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
