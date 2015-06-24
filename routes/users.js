var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
		//渲染模板
		res.render('user', {'title': '导航栏测试'});
});


module.exports = router;
