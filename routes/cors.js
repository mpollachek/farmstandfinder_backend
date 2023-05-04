const cors = require("cors");
const config = require("../config.js")

let whitelist = []

if (config.environment === 'development') {
  whitelist = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:7080",
  "http://localhost:8080",
  "https://www.allfarmstands.com",
  "allfarmstands.com",
  "https://allfarmstands.com",
  config.devMobileUrl
];
} else {
  whitelist = [
    "https://www.allfarmstands.com",
    "allfarmstands.com",
    "http://www.allfarmstands.com",
    "https://allfarmstands.com",
    config.devMobileUrl
    
  ];
}
//console.log("config.environment", config.environment)
//console.log("whitelist", whitelist)
const corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  console.log(req.header("Origin"));
  if (whitelist.indexOf(req.header("Origin")) !== -1) {
    corsOptions = { credentials: true, origin: true, exposedHeaders: ["Set-cookie"] };
  } else {
    corsOptions = { credentials: true,  origin: false, exposedHeaders: ["Set-cookie"] };
  }
  callback(null, corsOptions);
};

exports.cors = cors();
exports.corsWithOptions = cors(corsOptionsDelegate);
