/**
  URL Path: /admin
  Dashboard for admins
*/

const express = require('express');
const {
  myRender,
  grabMiddleware
} = require('forthright48/world');
const User = require('mongoose').model('User');
const userGroup = grabMiddleware('userGroup');
const mailer = require('forthright48/mailer').mailer;

const router = express.Router();

router.get('/dashboard', get_dashboard);
router.get('/invite-user', get_invite);
router.post('/invite-user', post_invite);

router.get('/user/list', get_user_list);
router.get('/user/change-status/:userMail/:status', userGroup.isRoot, get_user_changeStatus);

module.exports = {
  addRouter(app) {
    app.use('/admin', userGroup.isAdmin, router);
  }
};

/**
 *Implementation
 */
function get_dashboard(req, res) {
  return myRender(req, res, 'admin/dashboard');
}

function get_invite(req, res) {
  return myRender(req, res, 'admin/invite');
}

function post_invite(req, res) {
  const email = User.normalizeEmail(req.body.email);
  const password = User.createHash(req.body.password);

  const user = new User({
    email,
    password,
    verificationValue: User.createSalt()
  });

  user.save(function(err) {
    if (err) {
      if (err.code === 11000) {
        req.flash('error', 'Email address already exists');
      } else {
        req.flash('error', `An error occured. Error code: ${err.code}`);
      }
      return res.redirect('/admin/invite-user');
    }
    req.flash('success', 'Successfully registered');

    //Send activation email
    const emailMail = {
      to: [email],
      from: 'CPPS BACS <no-reply@bacsbd.org>',
      subject: 'You are invited to join CPPS-BACS Gateway',
      text: `Welcome to CPPS Gateway (cpps.bacsbd.org). Your password is ${req.body.password}. Please make sure that you change it. Here is your verification code: ${user.verificationValue}`,
      html: `Welcome to CPPS Gateway (<a href="http://cpps.bacsbd.org/">cpps.bacsbd.org</a>).
      Your password is <b>${req.body.password}</b>. Please make sure that you change it. Here is your verification code: <b>${user.verificationValue}</b>`
    };

    mailer.sendMail(emailMail, function(err) {
      if (err) {
        req.flash('error', 'There was some error while sending verification code. Try again.');
      } else {
        req.flash('success', 'Verification Code sent to User');
      }
      return res.redirect('/admin/invite-user');
    });
  });
}

function get_user_list(req, res) {
  User.paginate({}, {
    select: 'createdAt email status verified',
    sort: '-createdAt',
    limit: 100
  }, function(err, users) {
    return myRender(req, res, 'admin/userList', {
      users: users.docs
    });
  });
}

function get_user_changeStatus(req, res, next){
  const { userMail, status } = req.params;

  User.update({email: userMail}, {
    $set: {
      status
    }
  }).exec( function(err) {
    if ( err ) return next (err);
    return res.redirect('/admin/user/list');
  });
}
