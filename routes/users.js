var express = require("express");
const User = require("../models/user");
const Farm = require("../models/farmSchema");
const Comment = require("../models/commentSchema");
const passport = require("passport");
const authenticate = require("../authenticate");
const cors = require("./cors");
const config = require('../config.js');
const nodemailer = require('nodemailer')

const userRouter = express.Router();

const baseUrl = config.baseUrl;

const resetEmail = async (userEmail, userId) => {

  // let transporter = nodemailer.createTransport({
  //   host: config.smtp,
  //   port: 465,
  //   secure: true,
  //   auth: { 
  //     type: 'OAuth2',
  //     user: config.supportEmailUser,
  //     serviceClient: config.GServiceClientId,
  //     privateKey: config.GServicePrivateKey
  //   }
  // })

  // let transporter = nodemailer.createTransport({
  //   host: config.smtp,
  //   port: 465,
  //   secure: true,
  //   auth: { 
  //     type: 'OAuth2',
  //     user: config.supportEmailUser,
  //     pass: config.google_pword,
  //     clientId: config.google.GOOGLE_CLIENT_ID,
  //     clientSecret: config.google.GOOGLE_CLIENT_SECRET,
  //     refreshToken: config.google_refresh_token
  //   }
  // })

  let transporter = nodemailer.createTransport({
    host: config.smtp,
    port: 465,
    secure: true,
    auth: { 
      user: config.zohoUser,
      pass: config.zohoPword,
    }
  })

  try{ 
    await transporter.verify();
    await transporter.sendMail({
    from: '"AllFarmstands Support" <noreply@allfarmstands.com>', // sender address
    to: userEmail, // list of receivers
    subject: "Allfarmstands username/password reset", // Subject line
    html: `You are receiving this because you (or someone else) have requested the reset of the password for your account.
    Please click on the following link, or paste this into your browser to complete the process:
    http://${config.baseUrl}/passwordreset/${userId}
    If you did not request this, please ignore this email and your password will remain unchanged.`, // html body
  });
  console.log(`email sent to ${userEmail}`)
} catch(err) {
  console.log("err", err)
}
}

/* GET users listing. */
userRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(
    cors.corsWithOptions,
    authenticate.verifyUser,
    (req, res, next) => {
      User.find()
        .then((users) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(users);
        })
        .catch((err) => next(err));
    }
  );

userRouter
  .route("/signup")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .post(cors.corsWithOptions, async (req, res) => {
    console.log("register req.body", req.body)
    await User.register(
      new User({ username: req.body.registerusername }),
      req.body.registerpassword,
      async (err, user) => {
        if (err) {
          console.log("err", err)
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.json({ err: err });
        } else {
          console.log("registered")
          if (req.body.useremail) {
            user.useremail = req.body.useremail;
          }
          await user.save((err) => {
            if (err) {
              console.log("err2", err)
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.json({ err: err });
              return;
            } else {
            console.log("user", user)
              const token = authenticate.getToken({ _id: user._id });
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json({
                success: true,
                token: token,
                userId: user._id,
                userName: user.username,
                status: "Registration Successful!",
              });            
        }});
        }
      }
    );
  });

  userRouter
  .route("/signuplogin")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .post(cors.corsWithOptions, passport.authenticate("local"), (req, res) => {
    console.log("req.body", req.body)
    const token = authenticate.getToken({ _id: req.user._id });
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json({
      success: true,
      token: token,
      userId: req.user._id,
      userName: req.user.username,
      status: "You are successfully logged in!",
    });
  });

userRouter
  .route("/login")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .post(cors.corsWithOptions, passport.authenticate("local"), (req, res) => {
    console.log("req.body", req.body)
    const token = authenticate.getToken({ _id: req.user._id });
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json({
      success: true,
      token: token,
      userId: req.user._id,
      userName: req.user.username,
      status: "You are successfully logged in!",
    });
  });

  userRouter.get('/login/google',
  passport.authenticate('google', { scope: ['profile', 'email'], accessType:'offline', prompt:'consent' }), function(req, res) {
    console.log("req", req)
    console.log("res", res)
  });
 
userRouter
.route('/login/google/auth')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.corsWithOptions, passport.authenticate('google', { failureRedirect: `${baseUrl}`, failureMessage: "failed google auth" }),
  function(req, res) {
    //const user = {userId: req._user._id, username: req._user.username}
    console.log("success login req.user", req.user)
    const userId = req.user._id.toString()
    const userName = req.user.userName
    console.log("successful google login")
    console.log("req.body", req.body)
    console.log('req.session', req.session)
    //console.log("user", user)
    console.log("userId", userId)
    const token = authenticate.getToken({ _id: req.user._id });
    console.log("cookie", token, { domain:'allfarmstands.com', maxAge: 900000 })
    console.log("res.redirect", `/redirect`)
    if (userId) {
      res.cookie('userId', userId, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        secure: true,
      })
    }
    if (userName) {
      res.cookie('userName', userName, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        secure: true
      })
    }
    try {
      res.cookie('token', token, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        secure: true
      })
      .redirect(`${baseUrl}/redirect`);
      console.log("redirect success")
    } catch (err) {
      console.log("redirect err", err)
    }
    //res.redirect(`${baseUrl}/redirect`);
  });

  userRouter.get('/login/facebook',
  passport.authenticate('facebook', { scope: ['email'] }), function(req, res) {
    console.log("req", req)
    console.log("res", res)
  });
 
userRouter
.route('/login/facebook/auth')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.corsWithOptions, passport.authenticate('facebook', { failureRedirect: 'http://localhost:3000/redirect', failureMessage: "failed facebook auth" }),
  function(req, res) {
    //const user = {userId: req._user._id, username: req._user.username}
    console.log("req._user", req._user)
    console.log("req.user", req.user)
    const userId = req.user._id.toString()
    console.log("successful facebook login")
    console.log("req.body", req.body)
    //console.log("user", user)
    console.log("userId", userId)
    const token = authenticate.getToken({ _id: req.user._id });
    console.log("cookie", token)
    // Successful authentication, redirect home.
    res.cookie('facebook', token);
    res.cookie('userId', userId, {encode: String})
    res.cookie('userName', req.user.username, {encode: String})
    res.redirect('http://localhost:3000/redirect');
    //res.json({success: true, token: token, status: 'You are successfully logged in!'});
  });

userRouter
.route("/logout")
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.corsWithOptions, (req, res, next) => {
  console.log("logout")
  if (req.session) {
    console.log("req.session", req.session)
    req.session = null
    res.clearCookie("oauth-session", {path: '/'})
    res.status(200).clearCookie("oauth-session.sig", {path: '/'}).json({oauthSession: "cleared"})
    //res.redirect(`${baseUrl}/redirect`);
    
  } else {
    const err = new Error("You are not logged in!");
    err.status = 401;
    return next(err);
  }
});

// app.get('/auth/facebook',
//   passport.authenticate('facebook'));

// userRouter.get(
//   "/facebook/token",
//   passport.authenticate("facebook-token"),
//   (req, res) => {
//     if (req.user) {
//       const token = authenticate.getToken({ _id: req.user._id });
//       res.statusCode = 200;
//       res.setHeader("Content-Type", "application/json");
//       res.json({
//         success: true,
//         token: token,
//         status: "You are successfully logged in!",
//       });
//     }
//   }
// );

userRouter
  .route("/profile")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(
    cors.corsWithOptions,
    authenticate.verifyUser,
    (req, res, next) => {
      if (req.isAuthenticated()) {
      User.findById(req.user.id)
        .then((users) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(users);
        })
        .catch((err) => next(err));
      }
    }
  );

userRouter
  .route("/profile/changeusername")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log("req.body", req.body)
    const newUsername = req.body.newUsername;
    if (req.isAuthenticated()) {
      User.findById(req.user.id)
        .then(async (user) => {
          await user.updateOne({ username: newUsername })
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(`username changed to ${newUsername}`);
        })
        .catch((err) => console.log(err));
    }
  })

userRouter
  .route("/profile/changeuseremail")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log("req.body", req.body)
    const newUseremail = req.body.newUseremail;
    if (req.isAuthenticated()) {
      User.findById(req.user.id)
        .then(async (user) => {
          await user.updateOne({ useremail: newUseremail })
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(`user email changed to ${newUseremail}`);
        })
        .catch((err) => console.log(err));
    }
  })

userRouter
  .route("/profile/changeuserpassword")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log("req.body", req.body)
    if (req.isAuthenticated()) {
      User.findById(req.user.id)
        .then(async (user) => {
          await user.changePassword(req.body.oldUserpassword, req.body.newUserpassword, function (err) {
            if (err) {
              res.send(err);
            } else {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(`password changed`);
            }
          })          
        })
        .catch((err) => console.log(err));
    }
  })

userRouter
  .route("/profile/resetuserpassword")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .post(cors.corsWithOptions, async (req, res, next) => {
    console.log("req.body", req.body)
    const email = req.body.resetemail 
    const user = await User.findOne({ 'useremail': email });
    if (!user) {
      console.log("User does not exist")
    } else {
      console.log("user", user)
    let userId = user._id
    await resetEmail(email, userId)
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(`password reset email has been sent to ${email}`);
    }
  })

  userRouter
  .route("/profile/resetuserpassword/:userId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .put(cors.corsWithOptions, async (req, res, next) => {
    console.log("req.body", req.body)
    const userId = req.params.userId
    User.findById(userId)
      .then( async (user) => {
        await user.setPassword(req.body.resetUserPassword)
        await user.save(() => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(`password has been changed`);
        })        
      })
    
  })


userRouter
  .route("/protected")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    if (req.isAuthenticated()) {
      //console.log("protected req.user", req.user)
      res.send(req.user);
      //console.log("Protected");
    } else {
      res.status(401).send({ msg: "Unauthorized" });
    }
    //console.log("session:", req.session);
    //console.log("user", req.user);
  });

userRouter
  .route("/favorites")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    console.log("req.header", req.headers)
    if (req.isAuthenticated()) {
      console.log("userId: ", req.user.id);
      User.findById(req.user.id)
        .then((user) => {
          //console.log("user: ", user);
          // console.log("favorite array: ", user.favorite);
          Farm.find({
            _id: { $in: user.favorite },
          })
          .populate({
            path: "comments",
            select: "rating"
          })
          .then((farms) => {
            // console.log("farms: ", farms);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(farms);
          });
        })
        .catch((err) => next(err));
    }
  });

  userRouter
  .route("/favoritesIdList")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    console.log("req.query: ", req.query);
    if (req.isAuthenticated()) {
      // console.log("userId: ", req.user.id);
      User.findById(req.user.id)
        .then((user) => {
          //console.log("user: ", user);
          // console.log("favorite array: ", user.favorite);
          res.json(user.favorite);
        })
        .catch((err) => next(err));
    }
  });

userRouter
  .route("/isfavorite/:farmstandId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    console.log("req.query: ", req.query);
    console.log("req.body", req.body)
    console.log("req.header", req.headers)
    const farmstandId = req.params.farmstandId;
    if (req.isAuthenticated()) {
      console.log("userId: ", req.user.id);
      User.findById(req.user.id)
        .then((user) => {
          //console.log("user: ", user);
          // console.log("farmstandId: ", farmstandId);
          if (user.favorite.includes(farmstandId)) {
            let isFavorite = true;
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(isFavorite);
            // console.log("isFavorite: ", isFavorite);
          } else {
            let isFavorite = false;
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(isFavorite);
            // console.log("isFavorite: ", isFavorite);
          }
        })
        .catch((err) => next(err));
    }
  })
  .put(cors.cors, authenticate.showLogs, authenticate.verifyUser, (req, res, next) => {
    console.log("req.query: ", req.query);
    console.log("req.body", req.body)
    console.log("req.header", req.headers)
    const farmstandId = req.params.farmstandId;
    if (req.isAuthenticated()) {
      User.findById(req.user.id)
        .then(async (user) => {
          const favoritesArray = user.favorite;
          if (favoritesArray.includes(farmstandId)) {
            // console.log("user favorites: ", favoritesArray);
            const index = favoritesArray.indexOf(farmstandId);
            // console.log("index: ", index);
            favoritesArray.splice(index, 1);
            // console.log("fav array after splice: ", favoritesArray);
            await user.updateOne({ favorite: favoritesArray });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end("removed from favorites");
          } else {
            favoritesArray.push(farmstandId);
            await user.updateOne({ favorite: favoritesArray });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(`added ${farmstandId} to favorites`);
          }
        })
        .catch((err) => next(err));
    }
  });

  userRouter
  .route("/mycomments")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    // console.log("req.query: ", req.query);
    if (req.isAuthenticated()) {
      // console.log("userId: ", req.user.id);
      User.findById(req.user.id)
        .then((user) => {
          //console.log("user: ", user);
          // console.log("comment array: ", user.comments);
          Comment.find({
            _id: { $in: user.comments },
          })
          .populate({
            path: "farmstandId",
            select: "farmstandName images"
          })
          .then((comments) => {
            // console.log("comments: ", comments);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(comments);
          });
        })
        .catch((err) => next(err));
    }
  });

  userRouter
  .route("/owned")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    // console.log("req.query: ", req.query);
    if (req.isAuthenticated()) {
      // console.log("userId: ", req.user.id);
      User.findById(req.user.id)
        .then((user) => {
          //console.log("user: ", user);
          // console.log("owned array: ", user.owner);
          res.json(user.owner);
        })
        .catch((err) => next(err));
    }
  })

  userRouter.route("/owned/:farmstandId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    const farmstandId = req.params.farmstandId;
    // console.log("farmstandId: ", farmstandId)
    if (req.isAuthenticated()) {
      User.findById(req.user.id)
        .then(async (user) => {
          //console.log("user", user)
          const ownerArray = user.owner;
          const farmOwner = await Farm.findById(farmstandId);
          // console.log("farmOwner: ", farmOwner)
          const farmOwnerArray = farmOwner.owner;
          // console.log("farmOwnerArray: ", farmOwnerArray)
          try {
          if (ownerArray.includes(farmstandId)) {
            // console.log("user owned: ", ownerArray);
            const index = ownerArray.indexOf(farmstandId);
            // console.log("index: ", index);
            ownerArray.splice(index, 1);
            // console.log("owner array after splice: ", ownerArray);
            await user.updateOne({ owner: ownerArray });            
            const indexFarmOwner = farmOwnerArray.indexOf(req.user.id)
            farmOwnerArray.splice(indexFarmOwner, 1);
            await farmOwner.updateOne({ owner: farmOwnerArray })
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end("removed from owned");
          } else {
            // console.log("owner array before push: ", ownerArray)
            // console.log("farmstandId: ", farmstandId)
            // console.log("user.owner: ", user.owner)
            ownerArray.push(farmstandId);
            // console.log("owner array after push: ", ownerArray)
            await user.updateOne({ owner: ownerArray });
            // console.log("user.owner after update: ", user.owner)
            farmOwnerArray.push(req.user.id);
            await farmOwner.updateOne({owner: farmOwnerArray})
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(`added ${farmstandId} to owner`);
          }
        } catch(err) {console.log("error: ", err)};
        })
        .catch((err) => next(err));
    }
  });

userRouter
  .route("/test")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    User.find()
      .then((users) => {
        // console.log("users: ", users);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(users);
      })
      .catch((err) => next(err));
  });

module.exports = userRouter;
