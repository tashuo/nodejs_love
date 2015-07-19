var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('tips/tips', { title: '提示', tips: req.session.tips, y_referer: req.session.y_referer, n_referer: req.session.n_referer });
});


module.exports = router;
