var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test',function(err){
	if(err){
		console.log('user mongodb connect failed: '+err);
	}
});

module.exports = function(){
	var userSchema = new mongoose.Schema({
		username: String,
		lover: String,
		state: String,
		socket_id: String
	});

	mongoose.model('User', userSchema);
}

