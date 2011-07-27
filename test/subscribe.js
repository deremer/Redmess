var redmess = require('../');

// Set config details for redis
var	config = {
			port : 9249,
			server : 'barreleye.redistogo.com',
			key : '8f75b4c33ce0c98f6185ea4791a67815'
		};

// Set channels that subscriber knows how to handle
var channels = ['channel1', 'channel2'];

// Create subscriber for 'test_pipe'
// Omitting 'channels' as a parameter will cause the subscriber to respond to all messages on 'default'
var aSubscriber = new redmess.Subscriber('sub_name', 'test_pipe', config, channels);

aSubscriber.on('channel1', function (data) {
  
  // Do something interesting with the message
  console.log('channel1: ' + JSON.stringify(data));
  
  // Listen for next message
  aSubscriber.next();
});

aSubscriber.on('channel2', function (data) {
  
  // Do something interesting with the message
  console.log('channel2: ' + JSON.stringify(data));
  
  // Listen for next message
  aSubscriber.next();
});

aSubscriber.on('default', function (data) {
  
  // Do something interesting with the message
  console.log('Doing the default action for: ' + JSON.stringify(data));
  
  // Listen for next message
  aSubscriber.next();
});

// Start listening
aSubscriber.start();
