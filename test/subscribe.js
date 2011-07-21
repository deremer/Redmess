var redmess = require('../');

// Set config details for redis
var	config = {
		port : 0000,
		server : 'server.redistogo.com',
		key : 'mycrazylookingkey'
};

// Create subscriber for channel 'test'
var aSubscriber = new redmess.Subscriber('sub_name', 'test', config);

aSubscriber.on('message', function (data) {
  // Process message
  console.log(data);
  // Do something more interesting here…
  // ......
  
  
  // Listen for next message
  aSubscriber.next();
});

// Start listening
aSubscriber.start();
