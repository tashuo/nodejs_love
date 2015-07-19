var crypto = require('crypto');
var Url = require('url');
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
//引入User表
var User = require('./../models/user.js');
var Invite = require('./../models/invite.js');

/* Login */
router.post('/login', function(req, res, next){
	if(req.body.name){
		var username = req.body.name;
		console.log(username);
		//查看该用户是否存在于mongodb
		User.findOne({'username': username}, function(err, data){
			console.log(data);
			if(err){
				console.log('查找'+username+'异常');
			}else{
				if(data){
					console.log('查找结果：'+data);
					//更新用户登录状态
					User.update({username: username}, {$set: {state: 1}}, function(err){
						if(err)
							console.log('update state error: '+err);
						else{
							//对方名称
							var lover_name = data.lover;
							//将用户名存入session
							req.session.username = username;
							req.session.lovername = data.lover;
							res.send('1');
						}
					})
				}else{
					console.log('查找该用户不存在');
					res.send('');
				}
			}
		})
	}
});

/* register */
router.get('/register', function(req, res, next){
	//判断是否登录,否则会影响后面的逻辑
	if(req.session.username && (!req.headers.referer || req.headers.referer != 'http://localhost:3000/tips')){
		//此处暂时用session来存储错误提示
		req.session.tips = '您已经登录了<em>'+req.session.username+'</em>的账号，确定退出当前账号注册新账号?';
		req.session.y_referer = '/users/register';
		req.session.n_referer = '/chat';
		return res.redirect('/tips');
	}
	//清除登录session
	req.session.username = req.session.lovername = req.session.state = req.session.tips = req.session.y_referer = req.session.n_referer = null;

	//判断是否是邀请链接
	var params = Url.parse(req.url, true);
	if(params.query.user && params.query.time && params.query.hash && params.query.type == 'invite'){
		Invite.findOne({'username': params.query.user, 'url': params.path, 'state': 1}, function(err, data){
			if(err){
				console.log('查找邀请链接异常: '+params.path);
			}else{
				if(data){
					//更新邀请链接状态
					Invite.update({'_id': data._id},{$set: {state: 0}},function(err){
						console.log('Update invite_url error: '+err);
					})
					res.render('/users/invite');
				}else{
					//邀请链接无效
					
				}
			}
		})
	}
	
	res.render('users/register', {'title': '注册'});
});

/* invite 邀请界面*/
router.get('/invite', function(req, res, next){
	if(!req.session.username || req.session.state != -1){
		return res.redirect('/chat');
	}

	var params = Url.parse(req.url);
	if(params.query.type == 'accept'){

	}

	var timestamp = Math.floor(Date.now()/1000);
	var salt = 'ta_shuo';
	var hash = crypto.createHash('md5').update(req.session.username+timestamp).digest('hex');
	hash = crypto.createHash('md5').update(hash+salt).digest('hex');

	var invite_url = 'http://localhost:3000/users/register?type=invite&user='+req.session.username+'&time='+timestamp+'&hash='+hash;
	var new_invite = new Invite({username: req.session.username, url: invite_url, state: 1});
	new_invite.save(function(err){
		if(err){
			console.log(err);
		}else{
			res.render('users/invite', {'title': '邀请', 'invite_url': invite_url});
		}
	})
});

router.post('/register', function(req, res, next){
	if(req.body.name && req.body.password && req.body.repassword){
		var new_user = new User({username: req.body.name, lover: '', 'state': -1, 'socket_id': 0});
		new_user.save(function(err){
			if(err){

			}else{
				req.session.username = req.body.name;
				req.session.state = -1;
				return res.redirect('/users/invite');
			}
		})

	}else{
		res.json({'error': '非法请求!'});
	}
})

module.exports = router;
