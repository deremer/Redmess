var redmess = require('../');

// Set config details for redis
var	config = {
			port : 9249,
			server : 'barreleye.redistogo.com',
			key : '8f75b4c33ce0c98f6185ea4791a67815'
		};

// Create publisher
var aPublisher = new redmess.Publisher('pub_name', config);


// Run a simple loop to publish messages to different channels
var haveFun = function() {
		
	// Publish message to 'test_pipe' on 'channel1'
	var obj1 = { 'time': Date.now() };
	aPublisher.publish('test_pipe', 'channel1', obj1, function (err, res) {
		if (err) { console.log(err); }
		if (res) { console.log(res); }
	});
	
	// Publish message to 'test_pipe' on 'channel2'
	var obj2 = { 'random': Math.random() };
	aPublisher.publish('test_pipe', 'channel2', obj2, function (err, res) {
		if (err) { console.log(err); }
		if (res) { console.log(res); }
	});
	
	// Publish message to 'test_pipe' on 'unknownChannel'
	var obj3 = { 'something': Date.now() * Math.random() };
	aPublisher.publish('test_pipe', 'unknownChannel', obj3, function (err, res) {
		if (err) { console.log(err); }
		if (res) { console.log(res); }
	});
};

setTimeout(setInterval(haveFun, 1000), 20000);
