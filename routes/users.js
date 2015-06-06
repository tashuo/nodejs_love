exports.test = function(io){
	return function(req, res){
		res.render('user', {'title': 'test'});
		io.on('connection', function(socket){
			socket.emit('hi', 'hehehe');
			socket.on('hehe', function(data){
				console.log(data);
			});

			console.log(new Date()+' test');
		});
	}
}