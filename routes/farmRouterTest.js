const express = require("express");
const Farm = require("../models/farmSchema");
const Comment = require("../models/commentSchema");
const OwnerComment = require("../models/ownerCommentSchema");
const User = require("../models/user");
const authenticate = require("../authenticate");
const cors = require("./cors");
const path = require("path");
const fs = require("fs");

//to do: set image save folder to mongodb id (one folder per farmstand)
// save file path to mongodb

const dir = "./public/images";
const tempPath = `${dir}/temp`;
console.log("path.join dir + temp: " + path.normalize(dir, "temp"));
console.log(
  "'./' + path.join dir + temp: " + "./" + path.normalize(dir, "temp")
);

const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(dir, { recursive: true });
    cb(null, tempPath);
  },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

const farmRouter = express.Router();

/* All Farmstands */
farmRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    console.log("long: ", req.query.longitude);
    console.log("lat: ", req.query.latitude);
    console.log("distance: ", req.query.distance);
    console.log("products: ", req.query.products);
    console.log("seasons: ", req.query.seasons);
    console.log("typeof seasons: ", typeof req.query.seasons);
    const longitude = req.query.longitude;
    const latitude = req.query.latitude;
    const distance = req.query.distance;
    const products = req.query.products;
    //const seasons = req.query.seasons;
    let seasons = [];
    if (req.query.seasons === "harvest") {
      seasons.push("harvest");
    } else {
      seasons.push("yearRoundQuery");
    }
    console.log("seasons array: ", seasons);

    if (products) {
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
    const imagePaths = [];
    const imageNames = [];
    if (req.files) {
      for (file of req.files) {
        console.log("1 file: " + JSON.stringify(file));
        imagePaths.push(file.path);
        imageNames.push(file.filename);
      }
      console.log("imagePaths: " + imagePaths);
      console.log("imageNames: " + imageNames);
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
    console.log('productsArray: ', productsArray)
    const typeArray = JSON.parse(req.body.farmstandType)
    const indexType = typeArray.indexOf("");
    if (indexType !== -1) {
      typeArray.splice(indexType, 1);
    }
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
    })
      .then(async (farm) => {
        console.log("Farmstand Created ", farm);
        const farmId = farm._id;
        const farmPath = `${dir}/${farmId}`;
        console.log("farmId: ", farmId);
        console.log("farmPath: ", farmPath);
        //   {_id: farmId},

        //   {
        //   $set: {image: {
        //     'directory': farmPath,
        //   }}
        // });
        // console.log('farm image directory: ', farm.image.directory);
        // console.log('Farmstand Created ', farm);
        //const imageDir = path.normalize(dir, farmId);
        console.log("farm.images: " + farm.images);
        if (!fs.existsSync(farmPath)) {
          fs.mkdirSync(farmPath);
        }
        for (item of farm.images) {
          console.log("item " + item);
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
    console.log("req.query: ", req.query);
    console.log("req id array: ", req.query.id);
    Farm.find({
      _id: req.query.id,
    })
      .then((cardImage) => {
        console.log("cardImage: ", cardImage[0].images[0]);
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
    console.log("req.query: ", req.query);
    console.log("req id array: ", req.query.id);
    for (const id of req.query.id) {
      console.log("each id: ", id);
      tempArray = [];
      let filenames = fs.readdirSync(`${dir}/${id}`);
      console.log("filenames: ", filenames);
      if (filenames.length) {
        filenames.forEach((file) => {
          console.log("file: ", file);
          tempArray.push(file);
          console.log("tempArray: ", tempArray);
        });
        idImages[`${id}`] = tempArray;
        console.log("id array: ", idImages);
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
    console.log("req.query: ", req.query);
    console.log("req id array: ", req.query.id);
    fs.readdir(`${dir}/${id}`, (err, filenames) => {
      if (err) {
        console.log(err);
      } else {
        console.log("filenames: ", filenames);
      }
    });
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(idImages).catch((err) => next(err));
  });

/* Each Farmstand by ID */
farmRouter
  .route("/:farmstandId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, async (req, res, next) => {
    const farm = Farm.findById(req.params.farmstandId)
    const populatedArray = await farm.populate([{
      path: "comments",
      select: "rating"
    }, {path: "ownercomments"}])
    // const populatedArray = await farm.populate(["comments", "ownercomments", "owner"])      
        console.log("populated: ", populatedArray)
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

/* Allow anyone to add more images to farmstand */
farmRouter
  .route("/:farmstandId/images")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .put(
    cors.corsWithOptions, upload.array("image", 12),
    /*authenticate.verifyUser, authenticate.verifyAdmin,*/ (req, res, next) => {
      console.log("farmstandId: " + req.params.farmstandId);
      console.log('req.body: ', req.body)
      console.log("files: " + JSON.stringify(req.files));
      const farmId = req.params.farmstandId;
      const imageNames = [];
      if (req.files) {
        for (file of req.files) {
          console.log("filename: ", file.filename)
        imageNames.push(file.filename);
      }}
      console.log("imageNames", imageNames)
      Farm.findByIdAndUpdate(
        req.params.farmstandId,
        {
          /*need to push into products array rather than set*/
          $push: { images:imageNames, }
        },
        { upsert: true }
      )
        .then((farm) => {
          const farmPath = `${dir}/${farmId}`;
          console.log("farm.images: " + farm.images);
        if (!fs.existsSync(farmPath)) {
          fs.mkdirSync(farmPath);
        }
        for (item of farm.images) {
          console.log("item " + item);
          if (fs.existsSync(`${tempPath}/${item}`)) {
          fs.rename(
            `${tempPath}/${item}`,
            `${farmPath}/${item}`,
            function (err) {
              if (err) {
                console.log("file move error: " + err);
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
farmRouter
  .route("/:farmstandId/addproducts")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .put( cors.corsWithOptions, (req, res, next) => {
    console.log("req: ", req.body)
    const productNames = [];
      if (req.body.products) {
        for (product of req.body.products) {
          if (product) {
          productNames.push(product)
          }
        }
      }
      console.log("productNames after for loop push: ", productNames)
    Farm.findByIdAndUpdate(req.params.farmstandId, {
      $push: { products: { $each: productNames } }
      //$push: {products: productNames}
    })
    .then((response) => {
      console.log("response of products: ", response.products)
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(response);
    })
    .catch((err) => next(err));
  })

  /* End Allow anyone to add products to farmstand */


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
      console.log("req: ", req.body);
      console.log("farmstandId: ", `${req.params.farmstandId}`);
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
      console.log("comment: ", comment);
      await comment.save(function (err) {
        if (err) {
          console.log("error: ", err);
        }
      });
      const farmRelated = await Farm.findById(farmId);
      console.log("farmRelated: ", farmRelated);
      farmRelated.comments.push(comment);
      await farmRelated.save(function (err) {
        if (err) {
          console.log("error: ", err);
        }
      });
      const userRelated = await User.findById(userId);
      userRelated.comments.push(comment);
      await userRelated.save(function (err) {
        if (err) {
          console.log("error: ", err);
        }
      });
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
    console.log("req.body: ", req.body)
    const farmstandId = req.params.farmstandId
    const commentId = req.params.commentId
    Comment.findByIdAndUpdate(commentId, {
        $set: req.body
      })
      .then((response) => {
        console.log("response of owner comment put: ", response)
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
      console.log("req.body: ", req.body)
  
          const removeFarm = await Farm.findByIdAndUpdate(farmstandId, {
            $pull: {comments: commentId}
          }, { new: true })
          console.log("removeFarm: ", removeFarm.comments)
          const removeUser = await User.findByIdAndUpdate(userId, {
            $pull: {comments: commentId}
          }, { new: true })
          console.log("removeUser: ", removeUser.comments)
          const removeComment = await Comment.findByIdAndDelete(commentId)
          console.log("removeComment: ", removeComment)
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
        path: "comments",
        populate: {
          path: "author",
          select: "username",
        },
      })
      .then((farmstand) => {
        //console.log("comments res ", farmstand.comments)
        if (farmstand) {
          let commentsArray = farmstand.comments.map((comment) => {
            return {
              commentId: comment._id,
              text: comment.text,
              author: comment.author.username,
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
      const farmId = req.params.farmstandId;
      const userId = req.body.author;
      //console.log("req: ", req.body);
      console.log("farmstandId: ", `${req.params.farmstandId}`);
      // user populate owner ids must include farmId
      const comment = new OwnerComment({
        text: req.body.text,
        author: userId,
        farmstandId: farmId,
      });
      console.log("comment: ", comment);
      await comment.save(function (err) {
        if (err) {
          console.log("error: ", err);
        }
      });
      const farmRelated = await Farm.findById(farmId);
      //console.log("farmRelated: ", farmRelated);
      farmRelated.ownercomments.push(comment);
      await farmRelated.save(function (err) {
        if (err) {
          console.log("error: ", err);
        }
      });
      const userRelated = await User.findById(userId);
      userRelated.ownercomments.push(comment);
      await userRelated.save(function (err) {
        if (err) {
          console.log("error: ", err);
        }
      });
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
    console.log("req.body: ", req.body)
    const farmstandId = req.params.farmstandId
    const commentId = req.params.commentId
    OwnerComment.findByIdAndUpdate(commentId, {
        $set: req.body
      })
      .then((response) => {
        console.log("response of owner comment put: ", response)
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
    console.log("req.body: ", req.body)

        const removeFarm = await Farm.findByIdAndUpdate(farmstandId, {
          $pull: {ownercomments: commentId}
        }, { new: true })
        console.log("removeFarm: ", removeFarm.ownercomments)
        const removeUser = await User.findByIdAndUpdate(userId, {
          $pull: {ownercomments: commentId}
        }, { new: true })
        console.log("removeUser: ", removeUser.ownercomments)
        const removeComment = await OwnerComment.findByIdAndDelete(commentId)
        console.log("removeComment: ", removeComment)
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(removeComment);
              })

/* End owner comments by comment ID for editing and deleting */

module.exports = farmRouter;
