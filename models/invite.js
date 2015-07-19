var mongoose = require('mongoose');
var inviteSchema = new mongoose.Schema({
		username: String,
		type: String,
		time: String,
		state: String,
		hash: String
	});

module.exports = mongoose.model('Invite', inviteSchema);