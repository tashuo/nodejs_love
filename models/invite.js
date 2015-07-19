var mongoose = require('mongoose');
var inviteSchema = new mongoose.Schema({
		username: String,
		url: String,
		state: String
	});

module.exports = mongoose.model('Invite', inviteSchema);