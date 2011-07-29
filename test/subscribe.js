var redmess = require('../');

// Set config details for redis
var config = {
		port : 0000,
		server : 'server.redistogo.com',
		key : 'yourcrazylookingkey'
};

// Set channels that subscriber knows how to handle
var channels = ['channel1', 'channel2'];

// Create subscriber for 'test_pipe'
// Omitting 'channels' as a parameter will cause the subscriber to respond to all messages on 'default'
var aSubscriber = new redmess.Subscriber(config, 'sub_name', 'test_pipe', channels);

aSubscriber.on('channel1', function (data) {
  
  // Do something interesting with the message
  console.log('__SUBSCRIBER CLIENT: channel1: ' + JSON.stringify(data));
  
  // Listen for next message
  aSubscriber.next();
});

aSubscriber.on('channel2', function (data) {
  
  // Do something interesting with the message
  console.log('__SUBSCRIBER CLIENT: Doing something else with the data:' + new Date(data.timestamp));
  
  // Listen for next message
  aSubscriber.next();
});

aSubscriber.on('default', function (data) {
  
  // Do something interesting with the message
  console.log('__SUBSCRIBER CLIENT: Doing the default action for: ' + JSON.stringify(data));
  
  // Listen for next message
  aSubscriber.next();
});

// Start listening
aSubscriber.start();
