var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('generated-express-app');

var routes = require('./routes/index');
var users = require('./routes/users');
var chat = require('./routes/chat');

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
app.use(session({ secret: 'ta_shuo_session',
                  key: 'ta_shuo' ,
                  cookie: { maxAge: 600000},
                  resave: true,
                  saveUninitialized: true
                }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

//测试socket重复执行
app.use('/users', users.test(io));

//此处不使用express的路由，而作为函数传参将socket模拟传入控制器,将routes/chat只作为socket聊天一个逻辑来用
app.get('/chat/start', chat.socket_io(io));
//用户登录验证接口
app.post('/chat/init', chat.init());
//聊天接口
app.post('/chat/message', chat.sendMsg(io));

// catch 404 and forward to error handler
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