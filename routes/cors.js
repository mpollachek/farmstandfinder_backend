const cors = require("cors");

const whitelist = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://192.168.56.1",
  "http://localhost:7080",
  "http://localhost:8080",
  "https://www.allfarmstands.com",
  "allfarmstands.com",
  "http://66.135.5.166:3000",
  "https://accounts.google.com",
];
const corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  console.log(req.header("Origin"));
  if (whitelist.indexOf(req.header("Origin")) !== -1) {
    corsOptions = { origin: true };
  } else {
    corsOptions = { origin: false };
  }
  callback(null, corsOptions);
};

exports.cors = cors();
exports.corsWithOptions = cors(corsOptionsDelegate);
