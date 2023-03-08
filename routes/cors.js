const cors = require("cors");
const config = require("../config.js")

if (config.environment === 'development') {
const whitelist = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:7080",
  "http://localhost:8080",
  "https://www.allfarmstands.com",
  "allfarmstands.com",
  "https://allfarmstands.com"
];
} else {
  const whitelist = [
    "https://www.allfarmstands.com",
    "allfarmstands.com",
    "http://www.allfarmstands.com",
    "https://allfarmstands.com"
  ];
}
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
