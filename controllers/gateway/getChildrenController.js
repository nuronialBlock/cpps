const express = require('express');
const {
  myRender
} = require('forthright48/world');
const Gate = require('mongoose').model('Gate');
const async = require('async');

const router = express.Router();

router.get('/get-children/:parentId', get_getChildren_ParentId);

module.exports = {
  addRouter(app) {
    app.use('/gateway', router);
  }
};

/**
 *Implementation
 */

function get_getChildren_ParentId(req, res, next) {
  const parentId = req.params.parentId;

  ///Need to send the item with id parentId, so that we can use it's title and other info
  ///Also need all items whose parent is parentId.
  ///Both requires async calls

  async.parallel({
    ///Grab the root item
    root(cb) {
      Gate.findOne({
          _id: parentId
        })
        .exec(function(err, root) {
          if (err) return cb(err);
          if (!root) return cb(new Error('No such document found'));

          getItemStats(req, root, cb);
        });
    },
    ///Grab children under root
    items(cb) {
      Gate.find({
          parentId
        })
        .sort({
          ind: 1
        })
        .exec(function(err, items) {
          if (err) return cb(err);

          async.forEach(items, function(item, itemCB) {
            getItemStats(req, item, itemCB);
          }, function(err) {
            if (err) return cb(err);
            return cb(null, items);
          });
        });
    },
    doneList(cb) {
      ///Get done list from user
      if (req.session.login) {
        const userId = req.session.userId;
        Gate
          .find({
            parentId,
            doneList: userId
          })
          .select('_id')
          .exec(function(err, arr) {
            if (err) return cb(err);

            const brr = arr.map(function(val) {
              return val._id.toString();
            });

            return cb(null, brr);
          });
      } else {
        return cb(null, []);
      }
    }
  }, function(err, result) {
    if (err) return next(err);
    return myRender(req, res, 'gateway/getChildren', {
      root: result.root,
      items: result.items,
      doneList: result.doneList
    });
  });
}

///Responsible for getting total number of items under it's folder and how many user has solved
function getItemStats(req, item, cb) {
  async.parallel({
    totalCount(pcb) {
      if (item.type.toString() !== 'folder') {
        ///Nothing to do here
        return pcb(null);
      }
      Gate.count({
          ancestor: item._id,
          type: {
            $in: ['problem', 'text']
          }
        })
        .exec(function(err, total) {
          if (err) return pcb(err);
          item.totalCount = total;
          return pcb(null);
        });
    },
    userCount(pcb) {
      if (item.type.toString() !== 'folder') {
        ///Nothing to do here
        return pcb(null);
      }
      const sess = req.session || {};
      ///Usercount is '--' if user is not logged in
      if (!sess.login) {
        item.userCount = '--';
        return pcb(null);
      }
      const id = sess.userId;
      Gate.count({
          ancestor: item._id,
          type: {
            $in: ['problem', 'text']
          },
          doneList: id
        })
        .exec(function(err, total) {
          if (err) return pcb(err);
          item.userCount = total;
          return pcb(null);
        });
    },
    totalSolved(pcb) {
      if (item.type.toString() === 'folder') {
        ///Nothing to do here
        return pcb(null);
      }
      Gate
        .aggregate([{
          $match: {
            _id: item._id
          }
        }, {
          $project: {
            userSolved: {
              $size: '$doneList'
            }
          }
        }])
        .exec(function(err, result) {
          if (err) return pcb(err);
          item.userSolved = result[0].userSolved;
          return pcb(null);
        });
    }
  }, function(err) {
    if (err) return cb(err);
    return cb(null, item);
  });
}
