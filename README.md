Redmess 0.1.1
============

## What's Redmess

Redis Pub/Sub-esque implementation with persistence. A message queue for Redis in Node.js that mimics pub/sub functionality but uses Redis lists to enable persistence. Designed to support multiple node processes that can listen to each other to perform different tasks. This is essentially a highly simplified version of node-rqueue (https://github.com/votizen/node-rqueue) by Tim-Smart.


## Setup & see how it works

1. npm install redmess
2. configure 'config' in test/publish.js and test/subscribe.js
3. node test/subscribe.js
4. node test/publish.js (in separate terminal window)


## Setup a publisher:

```javascript
var	config = {
		port : 0000,
		server : 'server.redistogo.com',
		key : 'yourcrazylookingkey'
};

var aPublisher = new redmess.Publisher('pub_name', config);

// Send a message to channel1
var obj1 = { 'some': 'object' };
aPublisher.publish('test_pipe', 'channel1', obj1, function (err, res) {
	// This callback is optional	
});

// Send a message to channel2
var obj2 = { 'someother': 'object' };
aPublisher.publish('test_pipe', 'channel2', obj2, function (err, res) {
	// This callback is optional	
});

```

## Set up a subscriber...

```javascript
var	config = {
		port : 0000,
		server : 'server.redistogo.com',
		key : 'yourcrazylookingkey'
};

// To respond to all channels on test_pipe, omit the fourth parameter 'channels'
var aSubscriber = new redmess.Subscriber('sub_name', 'test_pipe', config);

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
var bSubscriber = new redmess.Subscriber('sub_name', 'test_pipe', config, channels);

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

