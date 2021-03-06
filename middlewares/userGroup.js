/* Middle ware to maintain User Hierarchy
 *
 * 0. root
 * 1. admin
 */

module.exports = {
  isRoot(req, res, next) {
    const sess = req.session || {};
    if (sess.status === 'root') return next();
    else {
      req.flash('info', 'You must be root to proceed');
      return res.redirect('/');
    }
  },
  isAdmin(req, res, next) {
    const sess = req.session || {};
    if (sess.status === 'root' || sess.status === 'admin') return next();
    else {
      req.flash('info', 'You must be at least "admin" to proceed');
      return res.redirect('/');
    }
  }
};
