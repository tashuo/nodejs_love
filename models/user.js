var mongoose = require('mongoose');
var userSchema = new mongoose.Schema({
		username: String,
		lover: String,
		state: String,
		socket_id: String
	});

module.exports = mongoose.model('User', userSchema);


