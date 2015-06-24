var mongoose = require('mongoose');
var messageSchema = new mongoose.Schema({
		from_user: String,
		to_user: String,
		to_room: String,
		dateline: String,
		content: String,
		state: String
	});

module.exports = mongoose.model('Message', messageSchema);

