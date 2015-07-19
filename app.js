var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var Session = require('express-session');
var MemoryStore = Session.MemoryStore;
var sessionStore = new MemoryStore();
var cookieParser = require('cookie-parser');
var cookie = require('cookie');
var bodyParser = require('body-parser');
var debug = require('debug')('generated-express-app');
var moment = require('moment');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test',function(err){
  if(err){
    console.log('message mongodb connect failed: '+err);
  }
});

//引入User表,Message表
var User = require('./models/user.js');
var Message = require('./models/message.js');

var routes = require('./routes/index'); //登录注册
var users = require('./routes/users'); //个人中心
var chat = require('./routes/chat'); //聊天界面
var tips = require('./routes/tips'); //提示界面
//var home = require('./routes/home'); //爱的小屋
//var square = require('./routes/square'); //广场

//直接在app.js中建立http服务器,去除./bin/www中的代码
var app = express();
app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
    debug('Express server listening on port ' + server.address().port);
    console.log('Express server listening on port ' + server.address().port);
});

//建立socket服务,此处的server必须是已经监听端口的http server
var io = require('socket.io')(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//引入session
app.use(cookieParser());
app.use(Session({ secret: 'ta_shuo_session',
                  key: 'express.sid' ,
                  cookie: { maxAge: 60000},
                  store: sessionStore,
                  resave: true,
                  saveUninitialized: true
                }));

app.use(express.static(path.join(__dirname, 'public')));


//路由
app.use('/', routes);
app.use('/chat', chat);
app.use('/users', users);
app.use('/tips', tips);

//建立socket服务,此处的server必须是已经监听端口的http server
var io = require('socket.io')(server);
io = io.listen(server);

//利用cookie将socket与session验证结合起来,用户登录才可以建立socket连接
io.set('authorization', function (handshakeData, accept) {
  if(handshakeData.headers.cookie){
    handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
    if(typeof handshakeData.cookie['express.sid'] !== 'undefined'){
      //解密出session_id
      handshakeData.sessionID = cookieParser.signedCookie(handshakeData.cookie['express.sid'], 'ta_shuo_session');
      //判断解密出的session_id
      sessionStore.get(handshakeData.sessionID, function(err, session){
        //从mc中获取的session
        console.log('认证时mc中的session_id: '+handshakeData.sessionID+'， 和session：');
        console.log(session);
        //如果用户处于登录状态，则允许其建立socket连接
        if(!err && typeof session !== 'undefined' && typeof session.username !== 'undefined'){
          //将当前session存入该连接,但是之后的连接怎么接收到这里设置的session?
          // handshakeData.session = session;
          // console.log(handshakeData);
          accept(null, true);
        }
      });
    }
  } 

  accept(null, false);
});


io.on('connection', function(socket){
    var cookie_t = cookie.parse(socket.handshake.headers.cookie);
    var session_id = cookieParser.signedCookie(cookie_t['express.sid'], 'ta_shuo_session');
    //获取登录用户名，更新mongo数据（此处只有将message事件放到函数内才不会出错，放到函数的外面则会出现根据session_id获取不到session的情况,为什么?）
    sessionStore.get(session_id, function(err, session){
      //将socket_id存入mongodb
      User.update({username: session.username}, {$set: {socket_id: socket.id, state: 1}}, function(err){
        if(err){
          console.log('存入socket_id出错: '+err);
        }else{
          console.log('存入socket_id成功：'+socket.id);
        }
      });

      socket.emit('connect');

      //由于还不知道怎么在socket中修改session值，故现在只能先从mongodb获取对方socket_id
      socket.on('message', function(message){
        User.findOne({username: session.lovername}, function(err, data){
          if(typeof data !== 'undefined'){
            //如果对方登录状态，则直接发送socket消息,否则存入mongodb
            var msg_state = 0;
            if(data.state == 1 && data.socket_id != 0){
              msg_state = 1;
              io.to(data.socket_id).emit('message', message);
            }
            //将聊天信息存入mongodb
            var msg = new Message({from_user: session.username, to_user: session.lovername, to_room: '0', dateline: Math.floor(Date.now()/1000), content: message, state: msg_state});
            msg.save(function(err){
              if(err){
                console.log('存入信息失败: '+err);
              }else{
                console.log('存入信息成功: '+message+' 时间: '+Date.now())
              }
            });
          }else{
            console.log('获取对方信息失败');
          }
        });
      });

      //怎么修改mc中存储的session值?
      socket.on('login_update', function(data){
        // console.log(data);
        //some codes
      });

      //修改对方实时状态,如果用户登录则实时更新状态
      socket.on('state', function(state){
        if(typeof session.loverstate === 'undefined' || session.loverstate != 1 || session.loversocketid == 0){
          User.findOne({username: session.lovername}, function(err, data){
            if(typeof data !== 'undefined'){
              console.log('state-对方信息: ');
              console.log(data);
              data.socket_id == 0 || io.to(data.socket_id).emit('state', state);
            }else{
              console.log('获取对方信息失败');
            }
          });
        }else{
          console.log('state-session: ');
          console.log(session);
          io.to(session.loversocketid).emit('state', state);
        }
      });

      //如果对方登录，则向对方发送已登录的信息
      if(typeof session.loverstate !== 'undefined' && session.loverstate == 1 && session.loversocketid != 0){
        console.log('login-session: ');
        console.log(session);
        io.to(session.loversocketid).emit('login', session.username+' 登录啦噜噜噜222');
      };

      //断掉socket连接一系列操作
      socket.on('disconnect', function(){
        console.log(session.username+' 关闭连接');
        User.findOne({username: session.lovername}, function(err, data){
          console.log('获取到的用户信息：');
          if(typeof data !== 'undefined'){
            console.log(data);
            io.to(data.socket_id).emit('logout', '对方退出登录');
          }else{
            console.log('获取失败');
          }
        });
        //更新用户信息
        User.update({username: session.username}, {$set: {socket_id: 0, state: 0}}, function(err){
          if(err){
            console.log('断开socket连接后更新mongodb失败：'+err);
          }else{
            console.log('断开socket连接后更新mongodb成功');
          }
        });
      });
    });
  });

//catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers


// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;