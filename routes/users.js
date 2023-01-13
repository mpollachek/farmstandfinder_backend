var express = require('express');
const User = require('../models/user');
const passport = require('passport');
const authenticate = require('../authenticate');
const cors = require('./cors');

const userRouter = express.Router();

/* GET users listing. */
userRouter.route('/')
.get(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  User.find()
  .then(users => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(users);
  })
  .catch(err => next(err));
});

userRouter.route('/signup')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.post(cors.corsWithOptions, (req, res) => {
  User.register(
      new User({username: req.body.username}),
      req.body.password,
      (err, user) => {
          if (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.json({err: err});
          } else {
              if (req.body.useremail) {
                user.useremail = req.body.useremail;
            }
              user.save(err => {
                  if (err) {
                      res.statusCode = 500;
                      res.setHeader('Content-Type', 'application/json');
                      res.json({err: err});
                      return;
                  }
                  passport.authenticate('local')(req, res, () => {
                    console.log("req.user: ", req.user)
                      const token = authenticate.getToken({_id: req.user._id});
                      res.statusCode = 200;
                      res.setHeader('Content-Type', 'application/json');
                      res.json({success: true, token: token, userId: req.user._id, userName: req.user.username, status: 'Registration Successful!'});
                  });
              });
          }
      }
  );
});

// userRouter.post('/login', cors.corsWithOptions, passport.authenticate('local', {session: false}), (req, res) => {
//   console.log("1")
//   const token = authenticate.getToken({_id: req.user._id});
//   console.log("1")
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'application/json');
//   res.json({success: true, token: token, status: 'You are successfully logged in!'});
// });

userRouter.route('/login')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.post(cors.corsWithOptions, passport.authenticate('local'), (req, res) => {
  const token = authenticate.getToken({_id: req.user._id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, token: token, userId: req.user._id, userName: req.user.username, status: 'You are successfully logged in!'});
});

userRouter.get('/logout', cors.corsWithOptions, (req, res, next) => {
  if (req.session) {
      req.session.destroy();
      res.clearCookie('session-id');
      res.redirect('/');
  } else {
      const err = new Error('You are not logged in!');
      err.status = 401;
      return next(err);
  }
});

userRouter.get('/facebook/token', passport.authenticate('facebook-token'), (req, res) => {
  if (req.user) {
      const token = authenticate.getToken({_id: req.user._id});
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: true, token: token, status: 'You are successfully logged in!'});
  }
});


userRouter.route('/protected')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  if (req.isAuthenticated()) {
    res.send(req.user)
    console.log("Protected")
} else {
    res.status(401).send({ msg: "Unauthorized" })
}
console.log("session:", req.session)
console.log("user", req.user)
})

// userRouter.route('/test')
// .get(cors.corsWithOptions, authenticate.checkAuthenticated, (req, res, next) => {
//   console.log("success! checkAuthenticated ", res)
//     });

userRouter.route('/test')
.options(cors.corsWithOptions,  (req, res) => res.sendStatus(200))
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  User.find()
  .then(users => {
    console.log('users: ', users)
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(users);
  })
  .catch(err => next(err));
});

module.exports = userRouter;
