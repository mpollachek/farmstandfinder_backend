const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const FacebookStrategy = require("passport-facebook")
var GoogleStrategy = require( 'passport-google-oauth20' ).Strategy;
const fs = require('fs');

const config = require('./config.js');

const jwtPublicLocation = config.jwtPublicLocation;
const jwtSecretLocation = config.jwtSecretLocation;
console.log("jwtSecretLocation", jwtSecretLocation)
jwtSecret = fs.readFileSync(`${jwtSecretLocation}`);
jwtPublic = fs.readFileSync(`${jwtPublicLocation}`)

const backendUrl = config.backendUrl

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

//below doesn't work - 500 and crashes
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

//note: callbackURL for local host version: `localhost:8080/api/users/login/google/auth`
passport.use(new GoogleStrategy({
  clientID:     config.google.GOOGLE_CLIENT_ID,
  clientSecret: config.google.GOOGLE_CLIENT_SECRET,
  callbackURL: `/${backendUrl}/api/users/login/google/auth`,
  passReqToCallback: true,
  scope: ['profile', 'email'],
},
function(req, accessToken, refreshToken, profile, done) {
  // User.findOrCreate({ googleId: profile.id }, function (err, user) {
  //   return done(err, user);
  // });
  User.findOne({googleId: profile.id}, async (err, user) => {
    if (err) {
        return done(err, false);
    }
    if (!err && user) {
      // console.log("req !err && user", req)
      req._user = user;
      console.log("user", user)
      console.log("user exists, accesstoken", accessToken)
      console.log("user exists, refreshtoken", refreshToken)
        return done(null, user);
    } else {
        console.log("profile", profile)
        user = new User({ username: profile.displayName });
        console.log("google user", user)
        user.googleId = profile.id;
        user.googleRefreshToken = refreshToken;
        user.useremail = profile._json.email;
        await user.save((err, user) => {
            if (err) {
                return done(err, false);
            } else {
                console.log("req else else", req)
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

// passport.use(new FacebookTokenStrategy({
//   clientID: config.facebook.clientId,
//   clientSecret: config.facebook.clientSecret,
//   fbGraphVersion: 'v3.0'
// }, function(accessToken, refreshToken, profile, done) {
//   User.findOrCreate({facebookId: profile.id}, function (error, user) {
//     return done(error, user);
//   });
// }
// ));

//switch to passport facebook https://github.com/jaredhanson/passport-facebook

exports.facebookPassport = passport.use(
  new FacebookStrategy(
      {
          clientID: config.facebook.clientId,
          clientSecret: config.facebook.clientSecret,
          callbackURL: `${backendUrl}/api/users/login/facebook/auth`,
          profileFields: ['id', 'displayName', 'emails']
      }, 
      (req, accessToken, refreshToken, profile, done) => {
          User.findOne({facebookId: profile.id}, (err, user) => {
              if (err) {
                  return done(err, false);
              }
              if (!err && user) {
                req._user = user;
                console.log("user", user)
                  return done(null, user);
              } else {
                  console.log("profile", profile)
                  console.log("profile._json", profile._json)
                  console.log("profile.emails", profile.emails)
                  user = new User({ username: profile.displayName });
                  user.facebookId = profile.id;
                  user.facebookRefreshToken = refreshToken;
                  if (profile._json.email) {
                  user.useremail = profile._json.email
                  }
                  console.log("user", user)
                  user.save((err, user) => {
                      if (err) {
                          return done(err, false);
                      } else {
                        console.log("new user, accesstoken", accessToken)
                        console.log("new user, refreshtoken", refreshToken)
                        req._user = user
                          return done(null, user);
                    
              }});
              }
          });
      }
  )
);

// passport.serializeUser((user, done) => {
//   done(null, user);
// });

// passport.deserializeUser((obj, done) => {
//   done(null, obj);
// });



