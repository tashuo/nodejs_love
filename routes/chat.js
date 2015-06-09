var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
//引入User表
var User = require('./../models/user.js');

router.get('/', function(req, res, next){
	//没有登录的话重定向到首页
	if(typeof req.session.username === 'undefined'){
		return res.redirect('/');
	}
	//获取对方登录状态和socket_id
	User.findOne({username: req.session.lovername}, function(err, data){
		if(err){
			console.log('获取对方信息出错：'+err);
		}else{
			req.session.loverstate = data.state;
			req.session.loversocketid = data.socket_id;
		}
		//渲染模板
		res.render('chat', {'title': 'socket.io', 'lover_name': req.session.lovername, 'lover_state': req.session.loverstate});
	});
});

router.post('/login', function(req, res, next){
	if(req.body.name){
		var username = req.body.name;
		console.log(username);
		//查看该用户是否存在于mongodb
		User.findOne({'username': username}, function(err, data){
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

module.exports = router;