// var Db = require('mongodb').Db,
//     Connection = require('mongodb').Connection,
//     Server = require('mongodb').Server;
// module.exports = new Db(settings.db, new Server(settings.host, settings.port), {safe: true});

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test',function(err){
	if(err){
		console.log('user mongodb connect failed: '+err);
	}
});
