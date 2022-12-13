const express = require('express');
const Farm = require('../models/farmSchema');
// const authenticate = require('../authenticate');
const cors = require('./cors');
const path = require('path');

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './imagesTest')
  },
  filename: (req, file, cb) => {
    console.log(file)
    cb(null, Date.now() + path.extname(file.originalname));
  }
})
const upload = multer({storage: storage})

const farmRouter = express.Router(); 

farmRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Farm.find()
    .populate('comments.author')
    .then(farms => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(farms);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, upload.array('image', 12), (req, res, next) => {
  console.log('req: ' + JSON.stringify(req.body));
  Farm.create({
    farmstandName: req.body.farmstandName,
    location: {
      coordinates: [req.body.longitude, req.body.latitude]
    },
    address: {
      road: req.body.road,
      town: req.body.town,
      state: req.body.state,
      country: req.body.country,
    },
    description: req.body.description,
    products: req.body.products,
    seasons: req.body.seasons
  })
  .then(farm => {
      console.log('Farmstand Created ', farm);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(farm);
  })
  .catch(err => next(err));
})
.put(cors.corsWithOptions, /*authenticate.verifyUser, authenticate.verifyAdmin,*/ (req, res) => {
  res.statusCode = 403;
  res.end('PUT operation not supported on /farms');
})
// .delete(cors.corsWithOptions, authenticate.verifyAdmin, (req, res, next) => {
//   Campsite.deleteMany()
//   .then(response => {
//       res.statusCode = 200;
//       res.setHeader('Content-Type', 'application/json');
//       res.json(response);
//   })
//   .catch(err => next(err));
// });


farmRouter.route('/:farmstandId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
    Farm.findById(req.params.farmstandId)
    .populate('comments.author')
    .then(farmstand => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(farmstand);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, /*authenticate.verifyUser,*/ (req, res) => {
    res.statusCode = 403;
    res.end(`POST operation not supported on /campsites/${req.params.farmstandId}`);
})
.put(cors.corsWithOptions, /*authenticate.verifyUser, authenticate.verifyAdmin,*/ (req, res, next) => {
  console.log("farmstandId: " + req.params.farmstandId)
  Farm.findByIdAndUpdate(req.params.farmstandId, {
    /*need to push into products array rather than set*/
      $set: req.body
  }, { new: true })
  .then(farmstand => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(farmstand);
  })
  .catch(err => next(err));
})
.delete(cors.corsWithOptions, /*authenticate.verifyUser, authenticate.verifyAdmin,*/ (req, res, next) => {
  Farm.findByIdAndDelete(req.params.farmstandId)
  .then(response => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(response);
  })
  .catch(err => next(err));
});





module.exports = farmRouter;