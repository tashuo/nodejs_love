var express = require('express');
var router = express.Router();

/* 登录状态注册提示页面 */
router.get('/register_tips', function(req, res, next) {
	var tips = '繁华如三千东流水';
	var y_referer = '/users/register';
	var n_referer = '/';
	if(req.session.invited_tips){
		tips = req.session.register_tips;
	}
	if(req.session.y_referer){
		y_referer = req.session.y_referer;
	}
	if(req.session.n_referer){
		y_referer = req.session.n_referer;
	}
  	res.render('tips/register_tips', { title: '注册提示', tips: tips, y_referer: y_referer, n_referer: n_referer });
});

/* 邀请链接失效提示 */
router.get('/invited_tips', function(req, res, next){
	var tips = '繁华如三千东流水';
	if(req.session.invited_tips){
		tips = req.session.invited_tips;
	}
	res.render('tips/invited_tips', {title: '邀请提示', tips: tips});
})

module.exports = router;
