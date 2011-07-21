var redmess = require('../');

// Set config details for redis
var	config = {
		port : 0000,
		server : 'server.redistogo.com',
		key : 'mycrazylookingkey'
};

// Create publisher
var aPublisher = new redmess.Publisher('pub_name', config);

// Run a simple publishing function
var haveFun = function() {
	var obj = { 'time': Date.now() };
	
	// Publish message to channel 'test'
	aPublisher.publish('test', obj, function (err, res) {
		if (err) { console.log(err); }
		if (res) { console.log(res); }
	});
};

setTimeout(setInterval(haveFun, 1000), 20000);
