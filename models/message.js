var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test',function(err){
	if(err){
		console.log('message mongodb connect failed: '+err);
	}
});

module.exports = function(){
	var messageSchema = new mongoose.Schema({
		from_user: String,
		to_user: String,
		to_room: String,
		dateline: {type: Date,default: Date.now},
		content: String,
		state: String
	});

	mongoose.model('Message', messageSchema);
}

