var mongodb = require('./mongodb.js');
var Schema = mongodb.mongoose.Schema;

var messageSchema = new Schema({
	from_user: String,
	to_user: String,
	to_room: String,
	dateline: {type: Date,default: Date.now},
	content: String
});

var message = mongodb.mongoose.model('message', messageSchema);
var messageDAO = function(){};
module.exports = new messageDAO();