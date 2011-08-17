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
 * Based on Tim-Smart's: https://github.com/votizen/node-rqueue
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
 * @Param {Object} config: config details for redis
 *	(e.g., var config = { port : XXXX, host : 'host', pass : 'pass'})
 * @Param {String} name: the name of the publisher
 *
 **********************************************************/

var Publisher = function (config, name) {

	if (config && name) {
		var self = this;
		this.serverInfo = config.host + ':' + config.port;
		this.id = "PUBLISHER:" + name; // Identifier of the publisher
		
		// Create publisher redis client
		this.pubClient = redis.createClient(config.port, config.host);
		
		// If authorization is required    
		this.pubClient.auth(config.pass, function (err, res) {
		  if (err) { aError(err, self.id);}
		  assert.strictEqual("OK", res.toString(), "auth");
		});
		
		// Print to console that publisher started
		console.log('STARTED: ' + this.id + ' SERVER:' + this.serverInfo); 
		
		// Emit an error if there is a problem
		this.pubClient.on('error', function (error) {
			if (error) { self.emit('error', error); }
			else { aError('Received undefined error', self.id); }
	  });
	} else { aError('Missing required parameters — config/name'); }
};

// Inherits from filter
util.inherits(Publisher, filter);


/*
 * @Param {String} pipe: the name of the pipe
 * @Param {String} channel: the name of the channel being published to
 * @Param {Object} msg: the message payload being sent to the channel
 * @Param {Object} callback(err, res): callback function to handle the err/res (Optional)
 */

Publisher.prototype.publish = function(pipe, channel, msg, callback) {
// Publishes a new message to a pipe, which can contain multiple channels
// The channel is a unique identifier to allow subscribers to handle messages differently

	if (pipe && channel && msg) {
		
		var self = this;
		// Prepare message payload
		var tStamp = Date.now();
		var message = {
			'channel' : channel,
			'msg': msg,
			'timestamp': tStamp
		};
	
		// Execute rpush to redis for the pipe
		this.pubClient.rpush(pipe, JSON.stringify(message), function(err, res) {
			if (err) {
				if (callback) { callback(err); }
				else { aError(err, self.id, message); }
			} else if (res) {
				if (callback) { callback(null, res); }
				else { aSuccess(res, self.id, message); }
			} else { aError('No error, but no result from redis', self.id, message); }
		});
		
		return this.id + ':' + channel + ':' + tStamp;
	
	} else {
		aError('Missing required parameters: pipe/channel/msg');
		return false;
	}
};


/**********************************************************
 * Subscriber.
 *
 * @Param {Object} config: config details for redis
 *	(e.g., var config = { port : XXXX, host : 'host', pass : 'pass'})
 * @Param {String} name: the name of the subscriber
 * @Param {String} pipe: the name of the pipe being subscribed to
 * @Param {Array}  channels: (optional) array of channels the subscriber handles uniquely (Optional)
 *
 **********************************************************/
 
var Subscriber = function (config, name, pipe, channels) {

	if (config && name && pipe) {
		
		var self = this;
		this.serverInfo = config.host + ':' + config.port;
		this.id = "SUBSCRIBER:" + name; // Identifier of the subscriber
		this.pipe = pipe;
		
		// Create subscriber redis client
		this.subClient =  redis.createClient(config.port, config.host);
		
		// If authorization is required    
		this.subClient.auth(config.pass, function (err, res) {
		  if (err) { assert.fail(err, self.id);}
		  assert.strictEqual("OK", res.toString(), "auth");
		});
		
		// If channels is not set, an empty array will cause all messages to be sent to 'default' channel
		if (channels) {
			if (channels instanceof Array && channels.length != 0) { this.channels = channels; }
			else { aError("'channels' is not properly set", self.id); }
		} else { this.channels = []; }
	
		this._onError = function (error) {
	    if (error) { self.emit('error', error); }
			else { aError('Received undefined error', self.id); }
	  }
	  
	  this.subClient.on('error', this._onError);
	  
		// Main listening function to blpop and emit data from redis
		this._onPop = function (error, data) {
	    if (error) { return self.emit('error', error); }
	
			// Parse the message to JSON and emit
	    try {
	    
	      data = JSON.parse(data[1]); // data[0] = name of the pipe, data[1] = pipe's payload
	      
	      // if channel is handled by subscriber emit with channel's label
	      if (self.channels.indexOf(data.channel) != -1) {
	      	self.emit(data.channel, data); 
	      	aSuccess('Received Message', self.id, data);
	      }
	      // otherwise emit it as the default channel
	      else {
	      	self.emit('default', data);
	      	aSuccess('Received Message on Default', self.id, data);
	      }
	      
	    } catch (json_error) { self._onError(json_error); }
	
			// Listen for more messages
	    if (!self.subClient.quitting) {
	      self.subClient.blpop(self.pipe, 0, self._onPop);
	    }
	  };
	  
  } else { aError('Missing required parameters: config:' + config + ', name:' + name + ', pipe:' + pipe, self.id); }
};

// Inherits from filter
util.inherits(Subscriber, filter);

Subscriber.prototype.start = function () {

	var self = this;

	// Prints the number of messages in the queue, then starts loop
	this.subClient.llen(this.pipe, function (err, reply) {
    if (err) { aError(err, self.id + " on pipe " + self.pipe); }
    else { console.log('STARTED: ' + self.id + ' SERVER:' + self.serverInfo + ' PIPE:' + self.pipe + " INITIAL_LENGTH:" + reply); }
  });
  // Begin listening for new messages  
	this.next();
};

Subscriber.prototype.next = function () {
	// Blocking List pop — blocks connecting until new list item is added
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

var aError = function (err, id, message) {
	var toPrint = 'FAILURE: ';
	if (id) { toPrint = toPrint + id; }
	if (err) { toPrint = toPrint + 'ERROR:' + err; }
	else { toPrint = toPrint + 'ERROR:Undefined Error'; }
	if (message) { toPrint = toPrint + ' MESSAGE:' + message; }
	console.log(toPrint);
	throw toPrint;
}

var aSuccess = function (res, id, message) {
	var toPrint = 'SUCCESS: ';
	if (id) { toPrint = toPrint + id; }
	if (res) { toPrint = toPrint + ' RESULT:' + res; }
	else { toPrint = toPrint + ' RESULT:Undefined Result'; }
	if (message && message.channel) { toPrint = toPrint + ' CHANNEL:' + message.channel; }
	if (message && message.timestamp) { toPrint = toPrint + ' TIMESTAMP:' + message.timestamp; }
	console.log(toPrint);
}


