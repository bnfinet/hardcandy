"use strict";
var fs = require('fs');

function HardCandy(c) {
	this.configure(c);
	this.log('new HardCandy called, did you want to inherit?');
}

module.exports = HardCandy;

var hc = HardCandy.prototype;

hc.configure = function (c) {
    var self = this;
    if (!c) {
        self.log('no config found! returning');
        return false;
    }
    self._storage = {};
	self._config = c;
	self._loadStorageFromFile();
	process.on('SIGINT', function() {
	    self.log("\nGracefully shutting down from SIGINT (Ctrl-C)");
	    self.shutdown(function() {
	        self.log('exiting');
	        process.exit();
	    });
	});
	return true;
};

// this is here mostly to support the testing platform
hc._getStorage = function (cb) {
	cb(this._storage);
};

hc.setGetAndParseFn = function (fn, cb) {
	var self = this;
	if (typeof fn === 'function') {
		self.getAndParse = fn;
	} else {
		throw "fn is not a function! should have signature: fn(err, token, cb)";
	}
    if (typeof cb === 'function') {
        return cb();
    } 
};

hc.parserErr = function (err, t, cb) {
	this.log('parserErr', t, err);
	if (this._storage) {
		if (!this._storage[t]) {
			this._initSource(t);
		}
		this._storage[t].errcount++;
	}
    if (typeof cb === 'function') {
        return cb(err, null);
    } 
};

var _skel = {
	items : [],
	errcount : 0,
	updated : 1
};

hc._initSource = function (t) {
	this._storage[t] = clone(_skel);
};

hc.registerSource = function (t, cb) {
	var self = this;
	if (self._isRegistered(t)) {
		return self.getItems(t, cb);
	}
	try {
		self.log('registering', t);
		self._initSource(t);
		self.getAndParse(t, function (err, items) {
			if (err) {
				self.log('getAndParse Error', err);
				return cb(err);
			} else {
				self._storeItems(t, items, function () {
					return self.getItems(t, cb);
				});
			}
		});
	} catch (e) {
		self.log('register source getAndParse err', e);
	}
};

hc._isRegistered = function (t) {
	var exists = this._storage[t] ? true : false;
	// this.log('_isRegistered', exists);
	return exists;
};

// getItems is used as both a utility function to access storage in the
// registered system
// otherwise
hc.getItems = function (t, cb) {
	var self = this;
	var now = Date.now();
	if (self._isRegistered(t)) {
		self._storage[t].lastrequest = now;
		return cb(null, self._storage[t].items);
	} else {
		self._storage[t].lastrequest = now;
		self.getAndParse(t, function (err, items) {
			return cb(err, items);
		});
	}
};

hc._refreshAllRegistered = function () {
	this.log('refreshing');
	var self = this;
	// async.each(Object.keys(self._storage), function (t, cb) {
	// this.log('hc._refreshAllRegistered _storage', self._storage);
	Object.keys(self._storage).forEach(function (t) {
		if (self._shouldBeDeleted(t)) {
			self.unregisterSource(t);
		} else if (self._shouldBeUpdated(t)) {
			self.log('refresh:', t);
			try {
				self.getAndParse(t, function (err, items) {
					if (!err) {
						self._storeItems(t, items);
					} else {
						self._storage[t].errcount++;
					}
				});
			} catch (e) {
				self._storage[t].errcount++;
			}
		}
	});
};

hc.unregisterSource = function (t, cb) {
	this.log('unregistering', t);
	delete this._storage[t];
    if (typeof cb === 'function') {
        return cb();
    } 
};

hc._shouldBeDeleted = function (t) {
	var self = this;
	var now = Date.now();
	// self.log('errcount errlimit ', self._storage[t].errcount,
	// self._config.errlimit);
	if (self._storage[t] && self._storage[t].lastrequest &&
			now - self._storage[t].lastrequest > self._config.timeout) {
		self.log('lastrequest timeout, deleting', t);
		return true;
	}
	if (self._storage[t].errcount > self._config.errlimit) {
		self.log('errlimit exceeded, deleting', t);
		return true;
	}
	return false;
};

hc._shouldBeUpdated = function (t) {
	var self = this;
	var now = Date.now();
	// self.log('#_shouldBeUpdated
	// self._storage[t].updated',t,self._storage[t].updated);
	if (self._storage[t] && 
			self._storage[t].updated &&
			// the more errors, the longer you sit in queue
			(now - self._storage[t].updated) > self._config.update_frequency +
					(self._config.update_frequency * self._storage[t].errcount)) {
		return true;
	}
	return false;
};

hc._storeItems = function (t, items, cb) {
	var self = this;
	// self.log('_storeItems _storage', self._storage);
	var now = Date.now();
	if (!self._storage[t]) {
		self._initSource(t);
		self._storage[t].registered = now;
	}
	self._storage[t].updated = now;
	self._storage[t].items = items;
	if (self._storage[t].errcount > 0) {
		self._storage[t].errcount--;
	}
	// self.log('#_storeItems updated', t, self._storage[t].updated);
    if (typeof cb === 'function') {
        return cb();
    } 
};

hc.running = false;
hc.startPeriodicRefresh = function () {
	var self = this;
	if (!self.running) {
		self.log('starting periodic refresh');
		// call it once to kick it off
		self._refreshAllRegistered();

		// set up the interval
		self._intervalId = setScopedInterval(function () {
			self._refreshAllRegistered();
		}, self._config.update_frequency, self);
		self.running = true;
	}
};

// feels like a hack
// http://stackoverflow.com/questions/3488591/how-to-kick-ass-pass-scope-through-setinterval
function setScopedInterval(func, millis, scope) {
	return setInterval(function () {
		func.apply(scope);
	}, millis);
}

hc.stopPeriodicRefresh = function () {
	var self = this;
	if (self.running) {
		self.log('stopping periodic refresh');
		clearInterval(self._intervalId);
		self.running = false;
	}
};

hc._loadStorageFromFile = function (cb) {
	var self = this;
	if (!self._config.file) {
	    if (typeof cb === 'function') {
	        return cb(null, {});
	    } 
	}
	fs.exists(self._config.file, function(exists) {
	    self.log('populating storage from ' + self._config.file);
	    if (exists) {
	        fs.readFile(self._config.file, "utf-8", function (err, data) {
	            if (err)
	                return cb(err);
//	            console.log(data);
	            if (!data) {
	                if (typeof cb === 'function') {
	                    return cb(null, data);
	                } 
	            } else {
	                self._storage = JSON.parse(data);
	                // self.log(self._storage);
	                if (typeof cb === 'function') {
	                    return cb(null, data);
	                } 
	            }
	        });
	    } else {
	        if (typeof cb === 'function') {
	            return cb(null, {});
	        } 
	    }
    });
};


hc._saveStorageToFile = function (cb) {
	var self = this;
	self.log('saving storage to ' + self._config.file);
	fs.writeFile(self._config.file, JSON.stringify(self._storage, null, 4), cb);
};

hc.shutdown = function (cb) {
	this._saveStorageToFile(cb);
};

hc.log = function () {
	var self = this;
	Array.prototype.unshift.call(arguments, '[HC]' + self._config.type);
	console.log.apply(console, arguments);
};

// a cheap hack, but it's cheap!
function clone(a) {
	return JSON.parse(JSON.stringify(a));
}

