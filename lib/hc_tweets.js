"use strict";
var util = require('util');
var Twitter = require('ntwitter');

var HardCandy = require('./hardcandy.js');

function HardCandyTweets(config) { 
//    console.log(config);
    if (this.configure(config)) {
        this.twit = new Twitter(config.ntwitter);
        this.log('new HardCandyTweets');
    }
}
util.inherits(HardCandyTweets, HardCandy);

HardCandyTweets.prototype.getAndParse = function(sn, cb) {

	var self = this;
	var twit = this.twit;
	self.log('getAndParse', sn);
	var getError = false;
	twit.verifyCredentials(function(err, data) {
		if (err) {
			getError = true;
			self.log(err)
			return self.parserErr(err, sn, cb);
		}
//		console.log(err, data);
	}).getUserTimeline({screen_name: sn, count: self._config.max_items}, function(err, data) {
		// see https://dev.twitter.com/docs/api/1.1/get/statuses/user_timeline
		if (err) {
			return self.parserErr(err, sn, cb);
		} else {
			return cb(err, data);
		}
	});
};

module.exports = HardCandyTweets;