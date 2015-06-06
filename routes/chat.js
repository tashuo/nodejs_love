var mongoose = require('mongoose');
require('./../models/user.js')();
require('./../models/message.js')();
var User = mongoose.model('User');
var Message = mongoose.model('Message');

/* Chat Page */
exports.socket_io = function(io) {
	return function(req, res){
		//没有登录的话重定向到首页
		if(typeof req.session.username === 'undefined'){
			return res.redirect('/');
		}

		//获取对方登录状态和socket_id
		User.findOne({username: req.session.lovername}, function(err, data){
			if(err){
				// console.log('获取对方信息出错：'+err);
			}else{
				req.session.loverstate = data.state;
				req.session.loversocketid = data.socket_id;
			}
			//渲染模板
			res.render('chat', {'title': 'socket.io', 'lover_name': req.session.lovername, 'lover_state': req.session.loverstate});
		});
		
		//socket监听
		io.on('connection', function(socket){
			console.log(new Date()+' 1111当前登录用户: '+req.session.username);

			socket.emit('connect');
			socket.on('hi', function(data){
				console.log(data);
				console.log(req.session);
				console.log(socket.id);
			});

			//将socket_id存入mongodb
			User.update({username: req.session.username}, {$set: {socket_id: socket.id, state: 1}}, function(err){
				if(err){
					// console.log('存入socket_id出错: '+err);
				}else{
					// console.log('存入socket_id成功');
				}
			});

			//如果对方登录，则向对方发送已登录的信息
			if(req.session.loverstate == 1 && req.session.loversocketid != 0){
				//发送给指定用户: io.to(socket_id).emit()
				io.to(req.session.loversocketid).emit('login', req.session.username+' says: 我登录啦噜噜噜!');
			};

			//对方登录，更新对方状态记录
			socket.on('login_update', function(data){
				req.session.loverstate = 1;
				//获取对方socket_id
				User.findOne({username: req.session.lovername}, function(err, data){
					// console.log(data);
					if(!err && data){
						req.session.loversocketid = data.socket_id;
						console.log('获取到'+req.session.lovername+'的socket_id: '+data.socket_id);
					}
				});
			});

			//对方登出，更新对方状态记录
			socket.on('logout_update', function(data){
				req.session.loverstate = 0;
				req.session.loversocketid = 0;
			})
	
			//断掉socket连接后重置mongoose中存入的socket_id
			socket.on('disconnect',function(){
				User.update({username: req.session.username}, {$set: {socket_id: 0, state: 0}}, function(err){
					if(err){
						console.log('重置socketid失败'+err);
					}else{
						console.log(req.session.username+' 成功退出');
						io.to(req.session.loversocketid).emit('logout', req.session.username+' says: 我退出登录啦噜噜噜!');
					}
				})
			})
			
		})
	}
};

/* Send message */
exports.sendMsg = function(io){
	return function(req, res){
		//是否登录
		if(typeof req.session.username === 'undefined'){
			return res.json({state: -1});
		}

		//查看是否是用户发送的信息
		if(req.body.message != ''){
			// console.log('进入发送信息逻辑');
			var msg = new Message({from_user: req.session.username, to_user: req.session.lovername, to_room: '0', dateline: new Date(), content: req.body.message, state: 1});

			var state = 0;

			msg.save(function(err){
				if(err)
					console.log('存放信息失败: '+err);
				else{
					if(req.session.loversocketid){
						io.to(req.session.loversocketid).emit('msg', req.body.message);
						console.log(req.session.username+'发送信息：'+msg+'to '+req.session.loversocketid);
					}else{
						console.log('对方未登录：'+req.session);
					}
					state = 1;
				}
				return res.json({state: state});
			});

			
		}
	}
}

/* Auth Login */
exports.init = function(){
	return function(req, res){
		if(req.body.name){
			var username = req.body.name;
			//查看该用户是否存在于mongodb
			User.findOne({'username': username}, function(err, data){
				if(err){
					// console.log('查找'+username+'异常');
				}else{
					if(data){
						// console.log('查找结果：'+data);
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
								console.log(new Date()+' 2222当前登录用户: '+req.session.username);
								console.log('cookies: ');
								console.log(req.cookies);
							}
						})
					}else{
						console.log('查找该用户不存在');
						res.send('');
					}
				}
			})
		
		}
	}
};