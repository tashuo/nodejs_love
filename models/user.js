var mongodb = require('./mongodb.js');
var Schema = mongodb.mongoose.Schema;

var userSchema = new Schema({
	username: String,
	lover: String,
	state: String
});

exports.user = mongodb.mongoose.model('user', userSchema);