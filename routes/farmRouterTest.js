const express = require("express");
const Farm = require("../models/farmSchema");
const Comment = require("../models/commentSchema");
const OwnerComment = require("../models/ownerCommentSchema");
const Values = require("../models/valuesSchema");
const User = require("../models/user");
const authenticate = require("../authenticate");
const cors = require("./cors");
const path = require("path");
const fs = require("fs");
const config = require("../config.js")

const dir = "./public/images";
const tempPath = `${dir}/temp`;
// console.log("path.join dir + temp: " + path.normalize(dir, "temp"));
// console.log(
//  "'./' + path.join dir + temp: " + "./" + path.normalize(dir, "temp")
// );

const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(dir, { recursive: true });
    cb(null, tempPath);
  },
  filename: (req, file, cb) => {
    // console.log(file);
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 3145728 }
});

const farmRouter = express.Router();

const productValuesId = config.productValuesId
console.log("productValuesId", productValuesId)

/* All Farmstands */
farmRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    // console.log("req.body: ", req.body)
    // console.log("long: ", req.query.longitude);
    // console.log("lat: ", req.query.latitude);
    // console.log("distance: ", req.query.distance);
    // console.log("products: ", req.query.products);
    // console.log("farmstandTypes: ", req.query.farmstandType)
    // console.log("seasons: ", req.query.seasons);
    // console.log("typeof seasons: ", typeof req.query.seasons);
    // console.log("req.query.productSearchType: ", req.query.productSearchType)
    const longitude = req.query.longitude;
    const latitude = req.query.latitude;
    const distance = req.query.distance;
    const products = req.query.products;
    const postedTypes = req.query.farmstandType;
    const productSearchType = req.query.productSearchType
    //const seasons = req.query.seasons;
    let seasons = [];
    if (req.query.seasons === "harvest") {
      seasons.push("harvest");
    } else {
      seasons.push("yearRoundQuery");
    }
    // console.log("seasons array: ", seasons);
    let types = [];
    if (postedTypes) {
      for (const i of postedTypes) {
        types.push(i)
      }
    } else {
      types.push("produce", "meat", "dairy", "eggs", "farmersMarket", "gardenCenter", "playArea", "therapy", [])
    }
    // console.log("types: ", types)

    if (products && productSearchType === "all" ) {
      // console.log("search with all")
      Farm.find({
        $and: [
          {
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [longitude, latitude],
                },
                $minDistance: 0,
                $maxDistance: distance,
              },
            },
          },
          { farmstandType: { $in: types }},
          { products: { $all: products } },
          { seasons: { $all: seasons } },
        ],
      })
      .populate({
        path: "comments",
        select: "rating"
      })
        .then((farms) => {
          //console.log("farms response: ", farms);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(farms);
        })
        .catch((err) => next(err));
    } else if (products && productSearchType === "or" ) {
      console.log("search with or")
      Farm.find({
        $and: [
          {
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [longitude, latitude],
                },
                $minDistance: 0,
                $maxDistance: distance,
              },
            },
          },
          { farmstandType: { $in: types }},
          { products: { $in: products } },
          { seasons: { $all: seasons } },
        ],
      })
      .populate({
        path: "comments",
        select: "rating"
      })
        .then((farms) => {
          //console.log("farms response: ", farms);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(farms);
        })
        .catch((err) => next(err));
    } else {
      Farm.find({
        $and: [
          {
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [longitude, latitude],
                },
                $minDistance: 0,
                $maxDistance: distance,
              },
            },
          },
          //{seasons: seasons}
          { farmstandType: { $in: types }},
          { seasons: { $all: seasons } },
        ],
      })
        .populate({
          path: "comments",
          select: "rating"
        })
        .then((farms) => {
          //console.log("farms response: ", farms);
          //console.log("comments: ", farms[0].comments)
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(farms);
        })
        .catch((err) => next(err));
    }
  })

  .post(cors.corsWithOptions, upload.array("image", 12), (req, res, next) => {
    // const seasonsArray = [];
    // if (req.body.seasons === 'harvest'){
    //   seasons.push('harvest', 'yearRoundQuery')
    // } else {
    //   seasons.push('yearRound', 'yearRoundQuery')
    // }
    // console.log('seasons array: ', seasons)
    console.log("files: " + JSON.stringify(req.files));
    console.log("req.body: ", req.body);
    console.log("JSON Parse req.body.hours: ", JSON.parse(req.body.hours))
    console.log("req.body.hours", req.body.hours)
    const postedHrs = JSON.parse(req.body.hours);
    console.log("posted Hrs: ", postedHrs)
    console.log("postedHrs.hours.open.sun.hour.sunOpenHr", postedHrs.hours.open.sun.hour.sunOpenHr)
    console.log("JSON parse useHours", JSON.parse(req.body.useHours))
    const imagePaths = [];
    const imageNames = [];
    if (req.files) {
      for (file of req.files) {
        // console.log("1 file: " + JSON.stringify(file));
        imagePaths.push(file.path);
        imageNames.push(file.filename);
      }
      // console.log("imagePaths: " + imagePaths);
      // console.log("imageNames: " + imageNames);
    }
    const seasonsArray = [];
    if (req.body.seasons === "harvest") {
      seasonsArray.push("harvest", "yearRoundQuery");
    } else {
      seasonsArray.push("yearRound", "yearRoundQuery");
    }
    const productsArray = JSON.parse(req.body.products)
    const index = productsArray.indexOf("");
    if (index !== -1) {
      productsArray.splice(index, 1);
    }
    // console.log('productsArray: ', productsArray)
    const typeArray = JSON.parse(req.body.farmstandType)
    const indexType = typeArray.indexOf("");
    if (indexType !== -1) {
      typeArray.splice(indexType, 1);
    }

    //add products to values collection productvalues document
    const addProdValuesArray = [];
    if (productsArray) {
      // add each product value to values collection
      Values.findById(productValuesId)
      .then((productValues) => {
        // console.log("productValues.values: ", productValues.values)
        for (i of productsArray) {
          // console.log("i", i)
          if (i) {
            if (productValues.values.includes(i)) {
              continue;
            } else {
            addProdValuesArray.push(i)
          }
      }}})
      .then(() => {      
      // console.log("addProdValuesArray: ", addProdValuesArray)
      Values.findByIdAndUpdate(productValuesId, {
        $push: {values: addProdValuesArray}
      }, { upsert: true })
      .then((valuesCollection) => {
        // console.log("valuesCollection", valuesCollection)
      })
    })
    }
    //end add products to values collection productvalues document
    console.log("postedHrs.hours.close.sun.min.sunCloseMin", postedHrs.hours.close.sun.ampm.sunCloseAmPm)
    Farm.create({
      farmstandName: req.body.farmstandName,
      location: {
        coordinates: [req.body.longitude, req.body.latitude],
      },
      address: {
        road: req.body.road,
        town: req.body.town,
        state: req.body.state,
        country: req.body.country,
      },
      description: req.body.description,
      products: productsArray,
      farmstandType: typeArray,
      seasons: seasonsArray,
      images: imageNames,
      useHours: JSON.parse(req.body.useHours),
      hours: {
        open: {
          sun: {
            isOpen: JSON.parse(postedHrs.hours.open.sun.isOpen.isOpenSun), hour: postedHrs.hours.open.sun.hour.sunOpenHr, 
            min: postedHrs.hours.open.sun.min.sunOpenMin, 
            ampm: postedHrs.hours.open.sun.ampm.sunOpenAmPm 
          },        
          mon: {
            isOpen: JSON.parse(postedHrs.hours.open.mon.isOpen.isOpenMon), 
            hour: postedHrs.hours.open.mon.hour.monOpenHr, 
            min: postedHrs.hours.open.mon.min.monOpenMin, 
            ampm: postedHrs.hours.open.mon.ampm.monOpenAmPm 
          },
         tue: {
          isOpen: JSON.parse(postedHrs.hours.open.tue.isOpen.isOpenTues), 
          hour: postedHrs.hours.open.tue.hour.tuesOpenHr, 
          min: postedHrs.hours.open.tue.min.tuesOpenMin, 
          ampm: postedHrs.hours.open.tue.ampm.tuesOpenAmPm 
        },        
         wed: {
          isOpen: JSON.parse(postedHrs.hours.open.wed.isOpen.isOpenWed), 
          hour: postedHrs.hours.open.wed.hour.wedOpenHr, 
          min: postedHrs.hours.open.wed.min.wedOpenMin, 
          ampm: postedHrs.hours.open.wed.ampm.wedOpenAmPm 
        },
         thur: {
          isOpen: JSON.parse(postedHrs.hours.open.thur.isOpen.isOpenThur), 
          hour: postedHrs.hours.open.thur.hour.thurOpenHr, 
          min: postedHrs.hours.open.thur.min.thurOpenMin, 
          ampm: postedHrs.hours.open.thur.ampm.thurOpenAmPm 
        },        
          fri: {
            isOpen: JSON.parse(postedHrs.hours.open.fri.isOpen.isOpenFri), 
            hour: postedHrs.hours.open.fri.hour.friOpenHr, 
            min: postedHrs.hours.open.fri.min.friOpenMin, 
            ampm: postedHrs.hours.open.fri.ampm.friOpenAmPm 
          },
          sat: {
            isOpen: JSON.parse(postedHrs.hours.open.sat.isOpen.isOpenSat), 
            hour: postedHrs.hours.open.sat.hour.satOpenHr, 
            min: postedHrs.hours.open.sat.min.satOpenMin, 
            ampm: postedHrs.hours.open.sat.ampm.satOpenAmPm 
          },        
         },
        close: {
          sun: {hour: postedHrs.hours.close.sun.hour.sunCloseHr, min: postedHrs.hours.close.sun.min.sunCloseMin, ampm: postedHrs.hours.close.sun.ampm.sunCloseAmPm },        
          mon: {hour: postedHrs.hours.close.mon.hour.monCloseHr, min: postedHrs.hours.close.mon.min.monCloseMin, ampm: postedHrs.hours.close.mon.ampm.monCloseAmPm },
          tue: {hour: postedHrs.hours.close.tue.hour.tuesCloseHr, min: postedHrs.hours.close.tue.min.tuesCloseMin, ampm: postedHrs.hours.close.tue.ampm.tuesCloseAmPm },        
          wed: {hour: postedHrs.hours.close.wed.hour.wedCloseHr, min: postedHrs.hours.close.wed.min.wedCloseMin, ampm: postedHrs.hours.close.wed.ampm.wedCloseAmPm },
          thur: {hour: postedHrs.hours.close.thur.hour.thurCloseHr, min: postedHrs.hours.close.thur.min.thurCloseMin, ampm: postedHrs.hours.close.thur.ampm.thurCloseAmPm },        
          fri: {hour: postedHrs.hours.close.fri.hour.friCloseHr, min: postedHrs.hours.close.fri.min.friCloseMin, ampm: postedHrs.hours.close.fri.ampm.friCloseAmPm },
          sat: {hour: postedHrs.hours.close.sat.hour.satCloseHr, min: postedHrs.hours.close.sat.min.satCloseMin, ampm: postedHrs.hours.close.sat.ampm.satCloseAmPm },
          },
        },
    })
      .then(async (farm) => {
        console.log("Farmstand Created ", farm);
        const farmId = farm._id;
        const farmPath = `${dir}/${farmId}`;
        //console.log("farmId: ", farmId);
        //console.log("farmPath: ", farmPath);
        //   {_id: farmId},

        //   {
        //   $set: {image: {
        //     'directory': farmPath,
        //   }}
        // });
        // console.log('farm image directory: ', farm.image.directory);
        // console.log('Farmstand Created ', farm);
        //const imageDir = path.normalize(dir, farmId);
        //console.log("farm.images: " + farm.images);
        if (!fs.existsSync(farmPath)) {
          fs.mkdirSync(farmPath);
        }
        for (item of farm.images) {
          //console.log("item " + item);
          fs.rename(
            `${tempPath}/${item}`,
            `${farmPath}/${item}`,
            function (err) {
              if (err) {
                console.log("file move error: " + err);
              }
            }
          );
        }

        console.log("move complete");
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(farm);
      })
      .catch((err) => next(err));
  })
  .put(
    cors.corsWithOptions,
    /*authenticate.verifyUser, authenticate.verifyAdmin,*/ (req, res) => {
      res.statusCode = 403;
      res.end("PUT operation not supported on /farms");
    }
  );
// .delete(cors.corsWithOptions, authenticate.verifyAdmin, (req, res, next) => {
//   Farm.deleteMany()
//   .then(response => {
//       res.statusCode = 200;
//       res.setHeader('Content-Type', 'application/json');
//       res.json(response);
//   })
//   .catch(err => next(err));
// });

/* End All Farmstands */

/* Not in use */

farmRouter
  .route("/cardImage")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    // console.log("req.query: ", req.query);
    // console.log("req id array: ", req.query.id);
    Farm.find({
      _id: req.query.id,
    })
      .then((cardImage) => {
        // console.log("cardImage: ", cardImage[0].images[0]);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(cardImage[0].images[0]);
      })
      .catch((err) => next(err));
  });

farmRouter
  .route("/images")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    const idImages = {};
    // console.log("req.query: ", req.query);
    // console.log("req id array: ", req.query.id);
    for (const id of req.query.id) {
      // console.log("each id: ", id);
      tempArray = [];
      let filenames = fs.readdirSync(`${dir}/${id}`);
      // console.log("filenames: ", filenames);
      if (filenames.length) {
        filenames.forEach((file) => {
          // console.log("file: ", file);
          tempArray.push(file);
          // console.log("tempArray: ", tempArray);
        });
        idImages[`${id}`] = tempArray;
        // console.log("id array: ", idImages);
      }
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(idImages).catch((err) => next(err));
  });

// farmRouter.route('/images')
// .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
// .get(cors.cors, (req, res, next) => {
//   const idImages = {}
//   console.log('req.query: ', req.query)
//   console.log('req id array: ', req.query.id);
//   for (const id of req.query.id) {
//     console.log("each id: ", id);
//     tempArray = [];
//     fs.readdir(`${dir}/${id}`, (err, filenames) => {
//       if (err) {
//       console.log(err);
//       } else {
//         console.log("filenames: ", filenames)
//         filenames.forEach((file) => {
//           console.log('file: ', file);
//           tempArray.push(file);
//           console.log("tempArray: ", tempArray)
//         })
//         idImages[`${id}`] = tempArray;
//         console.log("id array: ", idImages);
//       }
//     });
//     }
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'application/json')
//     res.json(idImages)
//   .catch(err => next(err));
// })

farmRouter
  .route("test")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    // console.log("req.query: ", req.query);
    // console.log("req id array: ", req.query.id);
    fs.readdir(`${dir}/${id}`, (err, filenames) => {
      if (err) {
        // console.log(err);
      } else {
        // console.log("filenames: ", filenames);
      }
    });
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(idImages).catch((err) => next(err));
  });

  /* Get all products for filtering farmstands */
farmRouter
.route("/getallproducts")
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
  // console.log("test allproducts get")
  // console.log("req.body: ", req.body);
  console.log("productValuesId", productValuesId)
  Values.findById(productValuesId) 
    .then( (productValues) => {
      // console.log("product values: ", productValues);
      const allProductValues = productValues.values
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(allProductValues);
    })
    .catch((err) => console.log(err));
});
/* Get all products for filtering farmstands */

/* Each Farmstand by ID */
farmRouter
  .route("/:farmstandId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, async (req, res, next) => {
    // console.log("test /farmstandId")
    const farm = Farm.findById(req.params.farmstandId)
    const populatedArray = await farm.populate([{
      path: "comments",
      populate: { path: "author", select: "username" }
    }, {path: "ownercomments"}])
    // const populatedArray = await farm.populate(["comments", "ownercomments", "owner"])      
        //console.log("populated: ", populatedArray)
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(populatedArray);    
     })
    // .catch((err) => next(err))
  .post(
    cors.corsWithOptions,
    /*authenticate.verifyUser,*/ (req, res) => {
      res.statusCode = 403;
      res.end(
        `POST operation not supported on /farmstands/${req.params.farmstandId}`
      );
    }
  )
  .put(
    cors.corsWithOptions,
    /*authenticate.verifyUser, authenticate.verifyAdmin,*/ (req, res, next) => {
      console.log("farmstandId: " + req.params.farmstandId);
      Farm.findByIdAndUpdate(
        req.params.farmstandId,
        {
          /*need to push into products array rather than set*/
          $set: req.body,
        },
        { new: true }
      )
        .then((farmstand) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(farmstand);
        })
        .catch((err) => next(err));
    }
  )
  .delete(
    cors.corsWithOptions,
    /*authenticate.verifyUser, authenticate.verifyAdmin,*/ (req, res, next) => {
      Farm.findByIdAndDelete(req.params.farmstandId)
        .then((response) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(response);
        })
        .catch((err) => next(err));
    }
  );
/* End Each Farmstand by ID */

/* Allow Owner to edit name, description, type, season */
farmRouter
.route("/:farmstandId/editdescription")
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.put( cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  const farmstandId = req.params.farmstandId
  const userId = req.user._id
  console.log("req: ", req.body)
  //console.log("req.body.values.useHours", req.body.values.useHours)
  //console.log("req.body.hours", req.body.hours)
  //console.log("req.body.values.hours", req.body.values.hours)
  const postedHrs = req.body.hours;
  console.log("postedHrs: ", postedHrs)
  console.log("postedHrs.close.mon.min", postedHrs.close.mon.min)
  const seasonsArray = [];
    if (req.body.values.seasons === "harvest") {
      seasonsArray.push("harvest", "yearRoundQuery");
    } else {
      seasonsArray.push("yearRound", "yearRoundQuery");
    }
  
  Farm.findByIdAndUpdate(farmstandId, {
    $set: { 
      farmstandName: req.body.farmstandName,
      description:  req.body.description,
      seasons: seasonsArray,
      farmstandType: req.body.values.farmstandType,
      useHours: req.body.useHours,
      hours: {
        open: {
          sun: {
            isOpen: postedHrs.open.sun.isOpen, 
            hour: postedHrs.open.sun.hour, 
            min: postedHrs.open.sun.min, 
            ampm: postedHrs.open.sun.ampm 
          },        
          mon: {
            isOpen: postedHrs.open.mon.isOpen, 
            hour: postedHrs.open.mon.hour, 
            min: postedHrs.open.mon.min, 
            ampm: postedHrs.open.mon.ampm
          },
         tue: {
          isOpen: postedHrs.open.tue.isOpen, 
          hour: postedHrs.open.tue.hour, 
          min: postedHrs.open.tue.min, 
          ampm: postedHrs.open.tue.ampm 
        },        
         wed: {
          isOpen: postedHrs.open.wed.isOpen, 
          hour: postedHrs.open.wed.hour, 
          min: postedHrs.open.wed.min, 
          ampm: postedHrs.open.wed.ampm 
        },
         thur: {
          isOpen: postedHrs.open.thur.isOpen, 
          hour: postedHrs.open.thur.hour, 
          min: postedHrs.open.thur.min, 
          ampm: postedHrs.open.thur.ampm 
        },        
          fri: {
            isOpen: postedHrs.open.fri.isOpen, 
            hour: postedHrs.open.fri.hour, 
            min: postedHrs.open.fri.min, 
            ampm: postedHrs.open.fri.ampm 
          },
          sat: {
            isOpen: postedHrs.open.sat.isOpen, 
            hour: postedHrs.open.sat.hour, 
            min: postedHrs.open.sat.min, 
            ampm: postedHrs.open.sat.ampm 
          },        
         },
        close: {
          sun: {
            hour: postedHrs.close.sun.hour, 
            min: postedHrs.close.sun.min, 
            ampm: postedHrs.close.sun.ampm 
          },        
          mon: {
            hour: postedHrs.close.mon.hour, 
            min: postedHrs.close.mon.min, 
            ampm: postedHrs.close.mon.ampm 
          },
          tue: {
            hour: postedHrs.close.tue.hour, 
            min: postedHrs.close.tue.min, 
            ampm: postedHrs.close.tue.ampm 
          },        
          wed: {
            hour: postedHrs.close.wed.hour, 
            min: postedHrs.close.wed.min, 
            ampm: postedHrs.close.wed.ampm 
          },
          thur: {
            hour: postedHrs.close.thur.hour, 
            min: postedHrs.close.thur.min, 
            ampm: postedHrs.close.thur.ampm 
          },        
          fri: {
            hour: postedHrs.close.fri.hour, 
            min: postedHrs.close.fri.min, 
            ampm: postedHrs.close.fri.ampm 
          },
          sat: {
            hour: postedHrs.close.sat.hour, 
            min: postedHrs.close.sat.min, 
            ampm: postedHrs.close.sat.ampm },
          },
        },
    }
  })
  .then((response) => {
    console.log("response of edit description: ", response)
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(response);
  })
  .catch((err) => next(err));
})
/* End Allow Owner to edit name, description, type, season */

/* Allow anyone to add more images to farmstand */
farmRouter
  .route("/:farmstandId/images")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .put(
    cors.corsWithOptions, upload.array("image", 12),
    /*authenticate.verifyUser, authenticate.verifyAdmin,*/ (req, res, next) => {
      console.log("config.environment", config.environment)
      console.log("farmstandId: " + req.params.farmstandId);
      console.log('req.body: ', req.body)
      console.log("files: " + JSON.stringify(req.files));
      const farmId = req.params.farmstandId;
      const imageNames = [];
      if (req.files) {
        for (file of req.files) {
          // console.log("filename: ", file.filename)
        imageNames.push(file.filename);
      }}
      // console.log("imageNames", imageNames)
      Farm.findByIdAndUpdate(
        req.params.farmstandId,
        {
          /*need to push into products array rather than set*/
          $push: { images:imageNames, }
        },
        { upsert: true }
      )
        .then(async (farm) => {
          const farmPath = `${dir}/${farmId}`;
          // console.log("farm.images: " + farm.images);
          // console.log("image Names 2: ", imageNames)
        if (!fs.existsSync(farmPath)) {
          await fs.mkdirSync(farmPath);
        }
        for (item of imageNames) {
          // console.log("item " + item);
          // console.log("temp path: ", `${tempPath}/${item}`)
          // console.log("farm path: ", `${farmPath}/${item}`)
          if (fs.existsSync(`${tempPath}/${item}`)) {
          await fs.rename(
            `${tempPath}/${item}`,
            `${farmPath}/${item}`,
            function (err) {
              if (err) {
                // console.log("file move error: " + err);
              }
            }
          );
          }}
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(farm);
        })
        .catch((err) => next(err));
    }
  )
  /* End Allow anyone to add more images to farmstand */

  /* End Allow anyone to add products to farmstand */
farmRouter
  .route("/:farmstandId/addproducts")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .put( cors.corsWithOptions, (req, res, next) => {
    // console.log("req: ", req.body)
    const productNames = [];
      if (req.body.products) {
        for (product of req.body.products) {
          if (product) {
          productNames.push(product)
          }
        }
      }
      // console.log("productNames after for loop push: ", productNames)

     //add products to values collection productvalues document
     const addProdValuesArray = [];
     if (productNames) {
       // add each product value to values collection
       Values.findById(productValuesId)
       .then( (productValues) => {
         // console.log("productValues.values: ", productValues.values)
         for (i of productNames) {
           // console.log("i", i)
           if (productValues.values.includes(i)) {
             continue;
           } else {
            addProdValuesArray.push(i)
           }
       }})
       .then(() => {     
       // console.log("addProdValuesArray: ", addProdValuesArray)
       Values.findByIdAndUpdate(productValuesId, {
         $push: {values: addProdValuesArray}
       }, { upsert: true })
       .then((valuesCollection) => {
         // console.log("valuesCollection", valuesCollection)
       })
     })
     }
     //end add products to values collection productvalues document

    Farm.findByIdAndUpdate(req.params.farmstandId, {
      $push: { products: { $each: productNames } }
      //$push: {products: productNames}
    })
    .then((response) => {
      // console.log("response of products: ", response.products)
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(response);
    })
    .catch((err) => next(err));
  })
  /* End Allow anyone to add products to farmstand */

  /* Allow owner to edit products to farmstand */
farmRouter
.route("/:farmstandId/editproducts")
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.put( cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  // console.log("req: ", req.body)
  const farmstandId = req.params.farmstandId
  const userId = req.user._id
  const products = req.body.products;
  const newProducts = req.body.newProducts;
  for (newProduct of newProducts) {
    if (newProduct && !products.includes(newProduct)) {
    products.push(newProduct)
    //console.log("products ", products)
    }
  }
  const productNames = [];
      if (products) {
        for (product of products) {
          if (product && !productNames.includes(product)) {
          productNames.push(product)
          //console.log("productNames ", productNames)
          }
        }
      }

  const addProdValuesArray = [];
    if (productNames) {
      // add each product value to values collection
      // Do not remove value from values collection
      console.log("productValuesId", productValuesId)
      Values.findById(productValuesId)
      .then( (productValues) => {
        //console.log("productValues.values: ", productValues.values)
        for (i of productNames) {
          //console.log("i", i)
          if (productValues.values.includes(i)) {
            continue;
          } else {
           addProdValuesArray.push(i)
          }
      }})
      .then(() => {     
      // console.log("addProdValuesArray: ", addProdValuesArray)
      Values.findByIdAndUpdate(productValuesId, {
        $push: {values: addProdValuesArray}
      }, { upsert: true })
      .then((valuesCollection) => {
        // console.log("valuesCollection", valuesCollection)
      })
    })
    }
    //end add products to values collection productvalues document
  
  Farm.findByIdAndUpdate(farmstandId, {
    $set: { products: productNames }

    // $cond: [owner.includes(userId), {$set: { products: req.body.products }}, res.end("failed to update products")]

  //   $cond: { if: owner.includes(userId), then: {
  //   $set: { products: req.body.products }
  // }, else: res.end("failed to update products") } 
  })
  .then((response) => {
    // console.log("response of products: ", response.products)
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(response);
  })
  .catch((err) => next(err));
})
/* End Allow owner to edit products to farmstand */

/* Allow owner to set cover image */
farmRouter
.route("/:farmstandId/coverimage")
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.put( cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
  // console.log("req: ", req.body)
  const farmstandId = req.params.farmstandId
  const image = req.body.image
  const allImages = req.body.images
  const index = allImages.indexOf(image)
  if (index !== -1) {
    allImages.splice(index, 1);
  }
  allImages.splice(0, 0, image)
  const selectCoverImage = await Farm.findByIdAndUpdate(farmstandId, {
    $set: { images: allImages }
  }, { new: true })
  .then((response) => {
    // console.log("response of remove image: ", response.images)
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(response);
  })
  .catch((err) => next(err));
})
/* Allow owner to set cover image */

/* Allow owner to remove image */
farmRouter
.route("/:farmstandId/removeimage")
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.put( cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
  // console.log("req: ", req.body)
  const farmstandId = req.params.farmstandId
  const userId = req.user._id
  const image = req.body.image
  const imagePath = `${dir}/${farmstandId}/${image}`
  // console.log("imagePath: ", imagePath)
  try {
    fs.unlinkSync(`${imagePath}`)
    // console.log(`image ${image} removed from ${imagePath}`)
  } catch(err) {
    console.error(err)
  }  
  const removeFarmImage = await Farm.findByIdAndUpdate(farmstandId, {
    $pull: { images: image }
  }, { new: true })
  .then((response) => {
    // console.log("response of remove image: ", response.images)
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(response);
  })
  .catch((err) => next(err));
})
/* Allow owner to remove image */


/* Comments by farmstand ID */
farmRouter
  .route("/:farmstandId/comments")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    const farmId = req.params.farmstandId;
    //console.log("get comments ", farmId)
    // console.log("find by id: ", Farm.findById(farmId))
    Farm.findById(farmId)
      //console.log("farm: ", farm)
      .populate({
        path: "comments",
        populate: {
          path: "author",
        },
      })
      .then((farmstand) => {
        //console.log("comments res ", farmstand.comments)
        if (farmstand) {
          let commentsArray = farmstand.comments.map((comment) => {
            return {
              commentId: comment._id,
              rating: comment.rating,
              text: comment.text,
              author: comment.author.username,
              authorId: comment.author._id,
              farmstandId: comment.farmstandId,
              date: comment.createdAt,
              updated: comment.updatedAt,
            };
          });
          //console.log("commentsArray ", commentsArray)
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(commentsArray);
        } else {
          err = new Error(`farmstand ${farmId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    async (req, res, next) => {
      // Farm.findById(req.params.farmstandId)
      const farmId = req.params.farmstandId;
      const userId = req.body.author;
      // console.log("req: ", req.body);
      // console.log("farmstandId: ", `${req.params.farmstandId}`);
      // Comment.create({
      //   text: req.body.text,
      //   author: req.body.author,
      //   rating: req.body.rating,
      //   farmstandId: id
      // })
      const comment = new Comment({
        text: req.body.text,
        author: userId,
        rating: Number(req.body.rating),
        farmstandId: farmId,
      });
      // console.log("comment: ", comment);
      await comment.save(function (err) {
        if (err) {
          console.log("error: ", err);
        }
      });
      const farmRelated = await Farm.findById(farmId);
      // console.log("farmRelated: ", farmRelated);
      farmRelated.comments.splice(0, 0, comment);
      await farmRelated.save(function (err) {
        if (err) {
          console.log("error: ", err);
        }
      });
      const userRelated = await User.findById(userId);
      userRelated.comments.splice(0, 0, comment);
      await userRelated.save(function (err) {
        if (err) {
          console.log("error: ", err);
        }
      });
      res.end("new comment submitted")
    }
  )

  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /farmstands/${req.params.farmstandId}/comments`
    );
  })
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Farm.findById(req.params.farmstandId)
        .then((farmstand) => {
          if (farmstand) {
            for (let i = farmstand.comments.length - 1; i >= 0; i--) {
              farmstand.comments.id(campsifarmstandte.comments[i]._id).remove();
            }
            farmstand
              .save()
              .then((farmstand) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(farmstand);
              })
              .catch((err) => next(err));
          } else {
            err = new Error(`farmstand ${req.params.farmstandId} not found`);
            err.status = 404;
            return next(err);
          }
        })
        .catch((err) => next(err));
    }
  );
/* End Comments by farmstand ID */

/* comments by comment ID for editing and deleting */
farmRouter
  .route("/:farmstandId/comments/:commentId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Farm.findById(req.params.farmstandId)
      .populate("comments.author")
      .then((farmstand) => {
        if (farmstand && farmstand.comments.id(req.params.commentId)) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(farmstand.comments.id(req.params.commentId));
        } else if (!farmstand) {
          err = new Error(`Farm ${req.params.farmstandId} not found`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `POST operation not supported on /farmstands/${req.params.farmstandId}/comments/${req.params.commentId}`
    );
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    // console.log("req.body: ", req.body)
    const farmstandId = req.params.farmstandId
    const commentId = req.params.commentId
    Comment.findByIdAndUpdate(commentId, {
        $set: req.body
      })
      .then( async (comment) => {
        const farmRelated = await Farm.findById(farmstandId);
        const farmCommentsArray = farmRelated.comments
        const index = farmCommentsArray.indexOf(commentId)
        farmCommentsArray.splice(index, 1);
        farmCommentsArray.splice(0, 0, commentId)
        await farmRelated.save(function (err) {
          if (err) {
            console.log("error: ", err);
          }
        })
      })
      .then((response) => {
        // console.log("response of owner comment put: ", response)
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(response);
      })
      .catch((err) => console.log(err));
    })

    .delete(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
      const farmstandId = req.params.farmstandId
      const commentId = req.params.commentId
      const userId = req.user._id
      // console.log("req.body: ", req.body)
  
          const removeFarm = await Farm.findByIdAndUpdate(farmstandId, {
            $pull: {comments: commentId}
          }, { new: true })
          // console.log("removeFarm: ", removeFarm.comments)
          const removeUser = await User.findByIdAndUpdate(userId, {
            $pull: {comments: commentId}
          }, { new: true })
          // console.log("removeUser: ", removeUser.comments)
          const removeComment = await Comment.findByIdAndDelete(commentId)
          // console.log("removeComment: ", removeComment)
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(removeComment);
                })


/* End comments by comment ID for editing and deleting */

/* Owner Comments by farmstand Id */
farmRouter
  .route("/:farmstandId/ownercomments")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    const farmId = req.params.farmstandId;
    //console.log("get comments ", farmId)
    // console.log("find by id: ", Farm.findById(farmId))
    Farm.findById(farmId)
      //console.log("farm: ", farm)
      .populate({
        path: "ownercomments",
        populate: {
          path: "author",
        },
      })
      .then((farmstand) => {
        // console.log("comments res ", farmstand.ownercomments)
        if (farmstand) {
          let commentsArray = farmstand.ownercomments.map((comment) => {
            return {
              commentId: comment._id,
              text: comment.text,
              author: comment.author.username,
              authorId: comment.author._id,
              farmstandId: comment.farmstandId,
              date: comment.createdAt,
              updated: comment.updatedAt,
            };
          });
          // console.log("commentsArray ", commentsArray)
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(commentsArray);
        } else {
          err = new Error(`farmstand ${farmId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    async (req, res, next) => {
      const farmId = req.params.farmstandId;
      const userId = req.body.author;
      //console.log("req: ", req.body);
      // console.log("farmstandId: ", `${req.params.farmstandId}`);
      // user populate owner ids must include farmId
      const comment = new OwnerComment({
        text: req.body.text,
        author: userId,
        farmstandId: farmId,
      });
      // console.log("comment: ", comment);
      await comment.save(function (err) {
        if (err) {
          console.log("error: ", err);
        }
      });
      const farmRelated = await Farm.findById(farmId);
      //console.log("farmRelated: ", farmRelated);
      farmRelated.ownercomments.splice(0, 0, comment);
      await farmRelated.save(function (err) {
        if (err) {
          console.log("error: ", err);
        }
      });
      const userRelated = await User.findById(userId);
      userRelated.ownercomments.splice(0, 0, comment);
      await userRelated.save(function (err) {
        if (err) {
          console.log("error: ", err);
        }
      });
      res.end("new comment submitted")
    }
  )
/* End Owner Comments by farmstand Id */

/* owner comments by comment ID for editing and deleting */
farmRouter
  .route("/:farmstandId/ownercomments/:commentId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    Farm.findById(req.params.farmstandId)
      .populate("comments.author")
      .then((farmstand) => {
        if (farmstand && farmstand.ownercomments.id(req.params.commentId)) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(farmstand.ownercomments.id(req.params.commentId));
        } else if (!farmstand) {
          err = new Error(`Farm ${req.params.farmstandId} not found`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `POST operation not supported on /farmstands/${req.params.farmstandId}/comments/${req.params.commentId}`
    );
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    // console.log("req.body: ", req.body)
    const farmstandId = req.params.farmstandId
    const commentId = req.params.commentId
    OwnerComment.findByIdAndUpdate(commentId, {
        $set: req.body
      })
      .then( async (comment) => {
        const farmRelated = await Farm.findById(farmstandId);
        const farmCommentsArray = farmRelated.ownercomments
        const index = farmCommentsArray.indexOf(commentId)
        farmCommentsArray.splice(index, 1);
        farmCommentsArray.splice(0, 0, commentId)
        await farmRelated.save(function (err) {
          if (err) {
            console.log("error: ", err);
          }
        })
      })
      //console.log("farmRelated: ", farmRelated);
      .then((response) => {
        // console.log("response of owner comment put: ", response)
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(response);
      })
      .catch((err) => console.log(err));
    })

  .delete(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    const farmstandId = req.params.farmstandId
    const commentId = req.params.commentId
    const userId = req.user._id
    // console.log("req.body: ", req.body)

        const removeFarm = await Farm.findByIdAndUpdate(farmstandId, {
          $pull: {ownercomments: commentId}
        }, { new: true })
        // console.log("removeFarm: ", removeFarm.ownercomments)
        const removeUser = await User.findByIdAndUpdate(userId, {
          $pull: {ownercomments: commentId}
        }, { new: true })
        // console.log("removeUser: ", removeUser.ownercomments)
        const removeComment = await OwnerComment.findByIdAndDelete(commentId)
        // console.log("removeComment: ", removeComment)
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(removeComment);
              })

/* End owner comments by comment ID for editing and deleting */

module.exports = farmRouter;
