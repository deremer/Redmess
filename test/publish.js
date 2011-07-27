var redmess = require('../');

// Set config details for redis
var	config = {
		port : 0000,
		server : 'server.redistogo.com',
		key : 'yourcrazylookingkey'
};

// Create publisher
var aPublisher = new redmess.Publisher(config, 'pub_name');


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
		if (res) {
			// Do something else with the result
			var theResult = "The result is: " + res;
			console.log(theResult); 
		}
	});
	
	// Publish message to 'test_pipe' on 'unknownChannel' with no callback
	var obj3 = { 'something': Date.now() * Math.random() };
	aPublisher.publish('test_pipe', 'unknownChannel', obj3);
};
  
setTimeout(setInterval(haveFun, 1000), 20000);
