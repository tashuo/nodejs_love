var mongoose = require('./../models/mongodb.js');
var Message = require('./../models/message.js');
var user = require('./../models/user.js').user;
var express = require('express');
var io = require('socket.io')(4000)
	, router = express.Router();

router.get('/', function(req, res, next){
	//如果没有输入用户名则重定向至首页
	if(!req.session.username){
		res.writeHead(302, {'Location': '/'});
		res.end();
	}
	console.log(user);
	// user.insert({'username': 'test', 'lover': 'john', 'state': '1'}, function(err, data){
	// 	console.log('insert data'+data);
	// });

	// user.find({'username': 'ta_shuo'}, function(err, data){
	// 	console.log(err);
	// 	console.log(data);
	// })

	//建立socket.io连接
	res.render('chat', {'title': 'socket聊天室'});
	//socket监听
	io.on('connection', function(socket){
		//该用户登录,将登录状态存入mongodb
		console.log(req.session.username+' connected!');
		updateLoginState(1);

		//怎样将socket id关联到该session

		socket.emit('connect_test', 'Your are connected!');
		
		socket.on('hi', function(data){
			console.log(data);
		})
	})
})

router.post('/init', function(req, res, next){
	if(req.body.name){
		//将用户名存入session
		req.session.username = req.body.name;	
		res.send('1');
	}
})

function updateLoginState(state){

}

function sendMgs(user, content){
	//codes
}

function getLover(){
	//codes
}

module.exports = router;