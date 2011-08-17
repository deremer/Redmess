Redmess
============

## What's Redmess

Redis Pub/Sub-esque implementation with persistence. A message queue for Redis in Node.js that mimics pub/sub functionality but uses Redis lists to enable persistence. Designed to separate background processing from a web app - just drop a message from the web app to a different node app running elsewhere.

Note that this is currently under development and there are likely to be bugs.


## Setup & see how it works

1. npm install redmess
2. configure 'config' in test/publish.js and test/subscribe.js to reach your redis server
3. node test/subscribe.js
4. node test/publish.js (in separate terminal window)
5. check your console to verify output


## Setup a publisher:

```javascript
var	config = {
		port : 0000,
		host : 'server.redistogo.com',
		pass : 'yourcrazylookingkey'
};

var aPublisher = new redmess.Publisher(config, 'pub_name');

// Send a message to channel1
var obj1 = { 'some': 'object' };
aPublisher.publish('test_pipe', 'channel1', obj1, function (err, res) {
	// This callback is optional	
});

// Send a message to channel2
var obj2 = { 'someother': 'object' };
aPublisher.publish('test_pipe', 'channel2', obj2);

```

## Set up a subscriber...

```javascript
var	config = {
		port : 0000,
		host : 'server.redistogo.com',
		pass : 'yourcrazylookingkey'
};

// To respond to all channels on test_pipe, omit the fourth parameter 'channels'
var aSubscriber = new redmess.Subscriber(config, 'sub_name', 'test_pipe');

aSubscriber.on('default', function (data) {
  
  // Do something interesting with the message
  console.log('Doing the default action for: ' + JSON.stringify(data));
  
  // Listen for next message
  aSubscriber.next();
});

// Start listening
aSubscriber.start();


// To respond to specific channels on test_pipe
var channels = ['channel1', 'channel2'];
var bSubscriber = new redmess.Subscriber(config, 'sub_name', 'test_pipe', channels);

bSubscriber.on('channel1', function (data) {
  
  // Do something interesting with the message
  console.log('channel1: ' + JSON.stringify(data));
  
  // Listen for next message
  bSubscriber.next();
});

bSubscriber.on('channel2', function (data) {
  
  // Do something interesting with the message
  console.log('channel2: ' + JSON.stringify(data));
  
  // Listen for next message
  bSubscriber.next();
});



bSubscriber.on('default', function (data) {
  
  // Do something interesting with the message
  console.log('Doing the default action for: ' + JSON.stringify(data));
  
  // Listen for next message
  bSubscriber.next();
});

// Start listening
bSubscriber.start();
```

## Credits
This is based on and essentially a highly simplified version of node-rqueue (https://github.com/votizen/node-rqueue) by Tim-Smart.

