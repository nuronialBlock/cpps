const express = require('express');
const myRender = require('forthright48/world').myRender;

const router = express.Router();

router.get('/', get_index);
router.get('/bugsandhugs', get_bugsandhugs);
router.get('/faq', get_faq);

module.exports = {
  addRouter(app) {
    app.use('/', router);
  }
};

/**
 *Implementation
 */
function get_index(req, res) {
  myRender(req, res, 'index/index');
}

function get_bugsandhugs(req, res) {
  myRender(req, res, 'index/bugsandhugs');
}

function get_faq(req, res) {
  myRender(req, res, 'index/faq');
}
