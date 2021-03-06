const express = require('express');
const {
  myRender,
  grabMiddleware
} = require('forthright48/world');
const loginMiddleware = grabMiddleware('login');
const User = require('mongoose').model('User');
const recaptcha = require('express-recaptcha');

const profileRouter = express.Router(); // '/user/profile'

profileRouter.get('/', get_profile);
profileRouter.get('/change-password', recaptcha.middleware.render, get_changePassword);
profileRouter.post('/change-password', recaptcha.middleware.verify, post_changePassword);

module.exports = {
  addRouter(app) {
    app.use('/user/profile', loginMiddleware, profileRouter);
  }
};

/**
 *Implementation
 */

function get_profile(req, res) {
  return myRender(req, res, 'user/profile');
}

function get_changePassword(req, res) {
  return myRender(req, res, 'user/changePassword.pug', {
    recaptcha: req.recaptcha
  });
}

function post_changePassword(req, res, next) {
  if (req.recaptcha.error) {
    req.flash('error', 'Please complete the captcha');
    return res.redirect('/user/profile/change-password');
  }

  const {
    current,
    newpass,
    repeat
  } = req.body;

  if (newpass !== repeat) {
    req.flash('error', 'New password does not match with retyped password');
    return res.redirect('/user/profile/change-password');
  }

  const email = req.session.email;

  User.findOne({
      email
    })
    .exec(function(err, user) {
      if (err) return next(err);
      if (!user) return next(err); //ULK
      if (!user.comparePassword(current)) {
        req.flash('error', 'Wrong password');
        return res.redirect('/user/profile/change-password');
      }
      user.password = User.createHash(newpass);
      user.save(function(err) {
        if (err) return next(err);
        req.flash('success', 'Password successfully changed');
        return res.redirect('/user/profile');
      });
    });
}
