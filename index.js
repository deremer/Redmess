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
 * (this is a simplified version)
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
 *	(e.g., var config = { port : XXXX, server : 'server', key : 'key'})
 *
 **********************************************************/

var Publisher = function (name, config) {
	var self = this;
	this.id = "Publisher:" + name; // Identifier of the publisher
	this.pubClient = redis.createClient(config.port, config.server); // Publisher redis client
	
	// If authorization is required    
	this.pubClient.auth(config.key, function (err, res) {
	  if (err) { assert.fail(err, self.id);}
	  assert.strictEqual("OK", res.toString(), "auth");
	});
	
	// Print to console that publisher started
	console.log('Started ' + this.id); 
	
	// Emit an error if there is a problem
	this.pubClient.on('error', function (error) {
    self.emit('error', error);
  });
};

// Inherits from filter
util.inherits(Publisher, filter);

/*
 * @Param {String} pipe: the name of the pipe
 * @Param {String} channel: the name of the channel being published to
 * @Param {Object} msg: the message payload being sent to the channel
 */

Publisher.prototype.publish = function(pipe, channel, msg, callback) {
// Publishes a new message to a pipe, which can contain multiple channels
// The channel is a unique identifier to allow subscribers to handle messages differently

	if (pipe && channel && msg) {
	
		// Prepare message payload
		var tStamp = Date.now();
		var message = JSON.stringify({
			'channel' : channel,
			'msg': msg,
			'timestamp': tStamp
		});
	
		// Execute rpush to redis for the pipe
		this.pubClient.rpush(pipe, message, function(err, res) {
			if (err) {
				if (callback) { callback(err); }
				else { aError(err); }
			} else {
				if (callback) { callback(null, res); }
				else { aSuccess(res); }
			}
		});
		
		return this.id + ':' + channel + ':' + tStamp;
	
	} else {
		aError('missing required parameters - message not published');
		return false;
	}
};


/**********************************************************
 * Subscriber.
 *
 * @Param {String} name: the name of the subscriber
 * @Param {String} pipe: the name of the pipe being subscribed to
 * @Param {Object} config: config details for redis
 * @Param {Array}  channels: (optional) array of channels the subscriber handles uniquely
 *	(e.g., var config = { port : XXXX, server : 'server', key : 'key'})
 *
 **********************************************************/
 
var Subscriber = function (name, pipe, config, channels) {

	if (name && pipe && config) {
		var self = this;
		this.id = "Subscriber:" + name; // Identifier of the subscriber
		this.pipe = pipe;
		
		// If channels is not set, an empty array will cause all messages to be sent to 'default' channel
		if (channels) {
			if (channels instanceof Array && channels.length != 0) { this.channels = channels; }
			else { aError("'channels' is not properly set"); }
		} else {
			this.channels = [];
		}
	
		this.subClient =  redis.createClient(config.port, config.server); // Subscriber redis client
		
		// If authorization is required    
		this.subClient.auth(config.key, function (err, res) {
		  if (err) { assert.fail(err, self.id);}
		  assert.strictEqual("OK", res.toString(), "auth");
		});
		
		this._onError = function (error) {
	    if (error) {
	      self.emit('error', error);
	    }
	  }
	  
	  this.subClient.on('error', this._onError);
	  
		// Main listening function to blpop and emit data from redis
		this._onPop = function (error, data) {
	    if (error) {
	      return self.emit('error', error);
	    }
	
			// Parse the message to JSON and emit
	    try {
				// data[0] is the name of the pipe
				// data[1] is the pipe's payload
	      data = JSON.parse(data[1]);
	      
	      // if channel is handled by subscriber emit with channel's label
	      // otherwise emit it as the default channel
	      if (self.channels.indexOf(data.channel) != -1) {
	      	self.emit(data.channel, data);
	      } else {
	      	self.emit('default', data);
	      }
	    } catch (json_error) { self._onError(json_error); }
	
			// Listen for more messages
	    if (!self.subClient.quitting) {
	      self.subClient.blpop(self.pipe, 0, self._onPop);
	    }
	  };
	  
  } else {
		aError('missing required parameters - subscriber not started');
		return false;
	}
};

// Inherits from filter
util.inherits(Subscriber, filter);

Subscriber.prototype.start = function () {
	// Print to console that subscriber started
	console.log('Started - ' + this.id);
	// Prints the number of messages in the queue, then starts loop
	this.subClient.llen(this.pipe, redis.print);
	this.next();
};

Subscriber.prototype.next = function () {
	this.subClient.blpop(this.pipe, 0, this._onPop);
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



