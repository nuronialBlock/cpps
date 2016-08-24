const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const secret = require('../secret.js').secret;
const mongoose = require('mongoose');

module.exports = {
  addSession(app) {
    app.use(session({
      secret,
      resave: false,
      saveUninitialized: false,
      store: new MongoStore({
        mongooseConnection: mongoose.connection,
        ttl: 24 * 60 * 60,
        touchAfter: 24 * 3600
      })
    }));
  }
};