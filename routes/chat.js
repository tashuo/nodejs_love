var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
//引入User表和Message表
var User = require('./../models/user.js');
var Message = require('./../models/message.js');

//聊天页面
router.get('/', function(req, res, next){
	//没有登录的话重定向到首页
	if(typeof req.session.username === 'undefined'){
		return res.redirect('/');
	};
	//获取对方登录状态和socket_id
	User.findOne({username: req.session.lovername}, function(err, data){
		if(err){
			console.log('获取对方信息出错：'+err);
		}else{
			console.log('对方信息: ');
			console.log(data);
			req.session.loverstate = data.state;
			req.session.loversocketid = data.socket_id;
		}
		//渲染模板
		res.render('chat', {'title': 'socket.io', 'lover_name': req.session.lovername, 'lover_state': req.session.loverstate});
	});
});

//获取历史聊天消息页面
router.get('/getMessage', function(req, res, next){
	var eachNums = 15;
	var page = 1;
	//express获取get参数 -- req.query
	if(typeof req.query.page !== 'undefined'){
		page = req.query.page;
	}

	var skip = (page - 1)*15;

	//没有登录的话重定向到首页
	if(typeof req.session.username === 'undefined'){
		return res.send(-1);
	};

	//查找之后直接对数据集进行update影响性能吗？异步？
	Message.count({state: {$eq: 0}, to_user: {$eq: req.session.username}}, function(err, data){
		if(!err && data < eachNums){
			Message.find({$or: [{to_user: req.session.username}, {from_user: req.session.username}]}, {_id: 1, content: 1, from_user: 1, state: 1, dateline: 1}).sort({dateline: 1}).limit(eachNums).skip(skip).exec(function(err, data){
				if(err){
					console.log('获取message出错');
					return res.send(0);
				}
				var flag = new Array();
				//遍历处理,修改state,标记flag供前端js处理使用,为什么这里不能修改find返回的data值??
				for(i = 0; i < data.length; i++){
					if(data[i]['state'] == 0){
						Message.update({_id: data[i]['_id']},{$set: {state: 1}}, function(err, data){
							if(err)
								console.log('更新message状态出现问题');
						})
					}
					
					if(data[i]['from_user'] == req.session.username){
						flag[i] = 1;
					}else{
						flag[i] = 0;
					}
				}
				return res.json(data.concat(flag));
			});
		}else{
			Message.find({state: {$eq: 0}, to_user: {$eq: req.session.username}}, {_id: 1, content: 1}, function(err, data){
				if(!err){
					Message.update({_id: data[i]['_id']},{$set: {state: 1}}, function(err, data){
						if(err)
							console.log('更新message状态出现问题');
					})
					return res.json(data);
				}
			})
		}
	});

	//findAndModify函数不能用?
	// Message.findAndModify({state: 0}, {state: 1},{}, function(err, data){});
});

//登录验证页面
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