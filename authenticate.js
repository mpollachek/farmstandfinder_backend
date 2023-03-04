const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const FacebookTokenStrategy = require('passport-facebook-token');
var GoogleStrategy = require( 'passport-google-oauth20' ).Strategy;
const fs = require('fs');

const config = require('./config.js');
jwtSecret = fs.readFileSync('./jwtSecret.pem');
jwtPublic = fs.readFileSync('./jwtPublic.pem')

exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// exports.getToken = function(user) {
//   return jwt.sign(user, config.secretKey, {expiresIn: 3600});
// };

exports.getToken = function(user) {
  return jwt.sign(user, config.secretKey, {});
};

// exports.getToken = function(user) {
//   return jwt.sign(user, jwtSecret, {algorithm: 'RS256'});
// };

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;
//opts.secretOrKey = jwtSecret


exports.jwtPassport = passport.use(
  new JwtStrategy(
      opts,
      (jwt_payload, done) => {
          console.log('JWT payload:', jwt_payload);
          User.findOne({_id: jwt_payload._id}, (err, user) => {
              if (err) {
                  return done(err, false);
              } else if (user) {
                  return done(null, user);
              } else {
                  return done(null, false);
              }
          });
      }
  )
);

exports.showLogs = (req, res, next) => {
  console.log("req.query: ", req.query);
    console.log("req.body", req.body)
    console.log("req.header", req.headers)
    next()
}

// exports.verifyUser = (req, res) => {
//   const authType = req.headers.authtype;
//   console.log("req.headers.authtype", req.headers.authtype)
//   console.log("authType: ", authType)
//   if (authType === 'jwt'){
//   passport.authenticate(['jwt'], { session: false});
//   console.log("jwt")
//   next()
//   } else if (authType === 'google') {
//     user = req.headers.userId
//     console.log("google")
//     next()
//   } else if (authType === 'facebook') {
//     user = req.headers.userId
//     console.log("facebook")
//     next()
//   } else {next()}
// } 

exports.verifyUser = passport.authenticate(['jwt'], { session: false});


// passport.authenticate(['google', 'facebook']);

//exports.verifyUser = passport.authenticate(['google']);

// exports.checkAuthenticated = (req, res, next) => {
//   if (req.isAuthenticated()) { return next() }
//   console.log("res-isAuthenticated: ", res)
// }

exports.verifyAdmin = (req, res, next) => {
  if (req.user.admin) {
    return next();
  } else {
    const error = new Error("You are not authorized to perform this operation")
    error.status=403
    return next(error)
  }
};

passport.use(new GoogleStrategy({
  clientID:     config.google.GOOGLE_CLIENT_ID,
  clientSecret: config.google.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:8080/api/users/login/google/auth",
  passReqToCallback: true,
  scope: ['profile', 'email'],
},
function(req, accessToken, refreshToken, profile, done) {
  // User.findOrCreate({ googleId: profile.id }, function (err, user) {
  //   return done(err, user);
  // });
  User.findOne({googleId: profile.id}, (err, user) => {
    if (err) {
        return done(err, false);
    }
    if (!err && user) {
      //console.log("request", request)
      req._user = user;
      console.log("user exists, accesstoken", accessToken)
      console.log("user exists, refreshtoken", refreshToken)
        return done(null, user);
    } else {
        user = new User({ username: profile.displayName });
        user.googleId = profile.id;
        user.googleRefreshToken = refreshToken;
        user.useremail = email
        user.save((err, user) => {
            if (err) {
                return done(err, false);
            } else {
                //console.log("request", request)
                console.log("new user, accesstoken", accessToken)
                console.log("new user, refreshtoken", refreshToken)
                req._user = user
                return done(null, user);
            }
        });
    }
});
}
));

passport.use(new FacebookTokenStrategy({
  clientID: config.facebook.clientId,
  clientSecret: config.facebook.clientSecret,
  fbGraphVersion: 'v3.0'
}, function(accessToken, refreshToken, profile, done) {
  User.findOrCreate({facebookId: profile.id}, function (error, user) {
    return done(error, user);
  });
}
));

// exports.facebookPassport = passport.use(
//   new FacebookTokenStrategy(
//       {
//           clientID: config.facebook.clientId,
//           clientSecret: config.facebook.clientSecret
//       }, 
//       (accessToken, refreshToken, profile, done) => {
//           User.findOne({facebookId: profile.id}, (err, user) => {
//               if (err) {
//                   return done(err, false);
//               }
//               if (!err && user) {
//                   return done(null, user);
//               } else {
//                   user = new User({ username: profile.displayName });
//                   user.facebookId = profile.id;
//                   user.save((err, user) => {
//                       if (err) {
//                           return done(err, false);
//                       } else {
//                           return done(null, user);
//                       }
//                   });
//               }
//           });
//       }
//   )
// );

// passport.serializeUser((user, done) => {
//   done(null, user);
// });

// passport.deserializeUser((obj, done) => {
//   done(null, obj);
// });



