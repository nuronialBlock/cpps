const express = require('express');
const world = require('forthright48/world');
const path = require('path');
const bodyParser = require('body-parser');
const recaptcha = require('express-recaptcha');
const app = express();
const server = require('http').createServer(app);
const rootPath = world.rootPath;
const secret = require('./secret.js');

app.set('port', 8002);
app.set('view engine', 'pug');
app.set('views', path.join(rootPath, './views'));

app.use('/public', express.static(path.join(rootPath, '/public')));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
})); // support encoded bodies


/**
 *Configuration
 */
require('./configuration/database');
require('./configuration/session').addSession(app);
app.use(require('connect-flash')());
recaptcha.init(secret.recaptcha.site, secret.recaptcha.secret);
/*End Configuration*/

/**
 *Add Models
 */
require('./models/user/userModel.js');
/*End Add Models*/

/**
 *Add Middleware
 */
app.use(require('./middlewares/flash.js'));
app.use(require('./middlewares/verification.js'));
/*End Add Middleware*/

/**
 * Add Routers
 */
require('./controllers/index/indexController.js').addRouter(app);
require('./controllers/user/loginController.js').addRouter(app);
require('./controllers/user/verificationController.js').addRouter(app);

/*End Add Routers*/

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.get('*', function(req, res) {
  return res.status(404).send('Page not found\n');
});


if (require.main === module) {
  server.listen(app.get('port'), function() {
    console.log(`Server running at port ${app.get('port')}`);
  });
} else {
  module.exports = {
    server,
    app
  };
}
