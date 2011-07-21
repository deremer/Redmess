/**********************************************************
 *
 * REDMESS
 * Redis Pub/Sub-esque implementation with Persistence
 *   A message queue for Redis in Node.js
 *   Mimics pub/sub but uses lists to allow persistence
 *
 * 2011 Grande Labs, Inc.
 * Authors: David DeRemer
 * https://github.com/deremer
 *   
 * Inspired by Tim-Smart's:
 * https://github.com/votizen/node-rqueue
 *
 **********************************************************/
 
 
/**********************************************************
 * Module dependencies.
 **********************************************************/
 
var assert = require("assert"),
		redis = require("redis"),
		filter = require("filter"),
		util   = require('util');
		
   
/**********************************************************
 * Publisher.
 *
 * @Param {String} name: the name of the publisher
 * @Param {Object} config: config details for redis
 *	e.g., config = { port : XXXX, server : '', key : ''}
 *
 **********************************************************/

var Publisher = function (name, config) {
	var self = this;
	this.id = "Publisher:" + name;
	this.pubClient = redis.createClient(config.port, config.server);
	
	// If authorization is required    
	this.pubClient.auth(config.key, function (err, res) {
	  if (err) { assert.fail(err, self.id);}
	  assert.strictEqual("OK", res.toString(), "auth");
	});
	
	console.log('Started ' + this.id);
	
	this.pubClient.on('error', function (error) {
    self.emit('error', error);
  });
};

// Inherits from filter
util.inherits(Publisher, filter);

// Publishes a new message to a channel
Publisher.prototype.publish = function(channel, msg, callback) {

	var tStamp = Date.now();
	var message = JSON.stringify({
		'msg': msg,
		'timestamp': tStamp
	});

	// Execute rpush to redis
	this.pubClient.rpush(channel, message, function(err, res) {
		if (err) {
			if (callback) { callback(err); }
			else { aError(err); }
		} else {
			if (callback) { callback(null, res); }
			else { aSuccess(res); }
		}
	});
	
	return this.id + ':' + channel + ':' + tStamp;
};


/**********************************************************
 * Subscriber.
 *
 * @Param {String} name: the name of the subscriber
 * @Param {Object} config: config details for redis
 *	e.g., config = { port : XXXX, server : '', key : ''}
 *
 **********************************************************/
 
var Subscriber = function (name, channel, config) {
	var self = this;
	this.id = "Subscriber:" + name;
	this.channel = channel;
	this.subClient =  redis.createClient(config.port, config.server);
	
	// If authorization is required    
	this.subClient.auth(config.key, function (err, res) {
	  if (err) { assert.fail(err, self.id);}
	  assert.strictEqual("OK", res.toString(), "auth");
	});
	
	console.log('Started - ' + this.id);
	
	this._onError = function (error) {
    if (error) {
      self.emit('error', error);
    }
  }
  
  this.subClient.on('error', this._onError);
  
	// Main listening function to blpop and emit data from red is
	this._onPop = function (error, data) {
    if (error) {
      return self.emit('error', error);
    }

		// Parse the message to JSON and emit
    try {
      data = JSON.parse(data[1]);
      self.emit('message', data);
    } catch (json_error) { self._onError(json_error); }

    if (!self.subClient.quitting) {
      // Listen for more jobs.
      self.subClient.blpop(self.channel, 0, self._onPop);
    }
  };
  
};

// Inherits from filter
util.inherits(Subscriber, filter);

Subscriber.prototype.start = function () {
	// Prints the number of messages in the queue, then starts loop
	this.subClient.llen(this.channel, redis.print);
	this.next();
};

Subscriber.prototype.next = function () {
	this.subClient.blpop(this.channel, 0, this._onPop);
};

Subscriber.prototype.stop = function () {
  this.subClient.destroy();
};


/**********************************************************
 * Exports.
 **********************************************************/

exports.Publisher = Publisher;
exports.Subscriber = Subscriber;


/**********************************************************
 * Support functions.
 **********************************************************/

var aError = function (err, callback) {
	if (err) {
		//console.log('An error occured: ' + err);
		if (callback) { callback(err); }
		else { throw err; }
	}
}

var aSuccess = function (msg, callback) {
	if (msg) {
		//console.log('Success: ' + msg);
		if (callback) { callback(msg); }
		else { console.log('Success: ' + msg); }
	}
}



