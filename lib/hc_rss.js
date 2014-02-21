"use strict";
var util = require('util');

var FeedParser = require('feedparser');
var request = require('request');
//handle UNABLE_TO_VERIFY_LEAF_SIGNATURE errors for https connnections
//http://stackoverflow.com/questions/18461979/node-js-error-with-ssl-unable-to-verify-leaf-signature
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var HardCandy = require('./hardcandy.js');

function HardCandyRss(config) {
    if (this.configure(config)) {
        this.log('new HardCandyRss');
    }
}

util.inherits(HardCandyRss, HardCandy);

HardCandyRss.prototype.getAndParse = function (url, cb) {
	var self = this;
	self.log('getAndParse', url);
	var count = 0;
	var items = [];

	var errorDetected = false;  // this feels hacky, there must be a proper way to do this
	var req = _requestSetup(url);
	req.on('error', function(err) {
		if (!errorDetected) { // handle only one error per request
			errorDetected = true;
			return self.parserErr(err, url, cb);
		}
	});

	if (!errorDetected) {
		req.pipe(new FeedParser())
		.on('error', function(err) {
//			if (err != 'SAXError') {  // just a bad parse
//			}
			if (!errorDetected) { // handle only one error per request
				errorDetected = true;
				return self.parserErr(err, url, cb);
			}
		})
		.on('readable', function() {
			count++;
			var stream = this, item;
			while ((item = stream.read()) !== null) {
				if (!errorDetected && count < self._config.max_items) {
//					self.log('Got article: %s', item.title || item.description, url);
					items.push(item);
				}
			}
		})
		.on('end', function() {
			if (!errorDetected) {
//				self.log('_getAndParseRSS end', url, items.length);
				return cb(null, items);
			}
		});
	}
};

function _requestSetup (url) {
	var req = request(url, {timeout: 10000, pool: false});
	// set some headers
	// https://github.com/kof/node-feedparser/commit/180e634bea2be5bd2df4a5f6e621cf31b76fefd2
	req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
	req.setHeader('accept', 'text/html,application/xhtml+xml');
	req.setMaxListeners(50);

	return req;
}

module.exports = HardCandyRss;