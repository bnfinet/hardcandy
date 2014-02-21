var should = require('chai').should();

var ntwitter = require('./data/ntwitter_config.json');
describe("hc_tweets", function() {
	var HCTweets = require('../lib/hc_tweets.js');
	var hctweets = new HCTweets({
	    type : 'tweets',
        max_items : 5,
        update_frequency : 61 * 60 * 1000,
        // update_frequency: 10 * 1000,
        timeout : 24 * 60 * 60 * 1000,
        errlimit : 20,
        file : __dirname + '/data/_hc_twitter.json',  // no file, no persistence
        ntwitter: ntwitter
	});
	
	var snames = ['personaltelco', 
	              'bnf',
	              'rssenior',  
	              'streetroots',
	              'pdxfiber',
	              ];
	
	it('#getAndParse', function(done) {
		hctweets.getAndParse(snames[0], function(err, items) {
			should.not.exist(err);
			items.length.should.not.equal(0);
			done(err);
		});
	});
	
	describe("file operations for storage", function() {
		it('#_saveStorageToFile', function(done) {
			hctweets._saveStorageToFile(function(err) {
				should.not.exist(err);
				done(err);
			});
		});
		it('#_loadStorageFromFile', function(done) {
			hctweets._loadStorageFromFile(function(err) {
				should.not.exist(err);
				done(err);
			});
		});
		
	});

	describe("regsiter and delete", function() {
		it('#registerSource snames[0]', function(done) {
			hctweets.registerSource(snames[0], function(err) {
			    should.exist(hctweets._storage[snames[0]]);
				hctweets._storage[snames[0]].items.length.should.not.equal(0);
				done(err);
			});
		});

		it('#_shouldBeDeleted snames[0]', function(done) {
			var now = new Date().getTime();
			hctweets._shouldBeDeleted(snames[0]).should.equal(false);
	
			hctweets._storage[snames[0]].errcount = 10000;
			hctweets._shouldBeDeleted(snames[0]).should.equal(true);
	
			hctweets._storage[snames[0]].errcount = 0;
			hctweets._shouldBeDeleted(snames[0]).should.equal(false);
	
			hctweets._storage[snames[0]].lastrequest = now - hctweets._config.timeout * 2;
			hctweets._shouldBeDeleted(snames[0]).should.equal(true);
	
			hctweets._storage[snames[0]].lastrequest = now;
			hctweets._shouldBeDeleted(snames[0]).should.equal(false);
			
			done();
		});
	
		it('#_shouldBeUpdated snames[0]', function(done) {
			hctweets._shouldBeUpdated(snames[0]).should.equal(false);
			hctweets._storage[snames[0]].updated = -1;
			hctweets._shouldBeUpdated(snames[0]).should.equal(true);
			done();
		});
		
		it('#unregisterSource snames[0]', function(done) {
			hctweets.unregisterSource(snames[0], function() {
				should.not.exist(hctweets._storage[snames[0]]);
				done();
			});
		});
	});
	
	it('#registerSource snames[0]', function(done) {
		var sname = snames[0];
		hctweets.registerSource(sname, function(err, items) {
			should.not.exist(err);
			hctweets._isRegistered(sname).should.equal(true);
			should.exist(hctweets._storage[sname]);
			hctweets._storage[sname].items.length.should.not.equal(0);
			hctweets._storage[sname].updated.should.not.equal(-1);
			done();
		});
	});
	
	it('#getItems snames[0]', function(done) {
		var sname = snames[0];
		this.timeout(200); // should come back fast since it's registered (cached)
		hctweets.getItems(sname, function(err, items) {
			should.not.exist(err);
			hctweets._storage[sname].updated.should.not.equal(-1);
			done();
		});
	});

	it('#registerSource snames[1]', function(done) { // lucky lab rss has issues
		var sname = snames[1];
		this.timeout(60000);
		hctweets.registerSource(sname, function(err, items) {
//			console.log('cb for #registerSource snames[1]');
//			should.exist(err);
			done(err);
		});
	});

	it('#registerSource snames[2]', function(done) {
		var sname = snames[2];
		this.timeout(60000);
		hctweets.registerSource(sname, function(err, items) {
//			console.log('#registerSource snames[2] err', err);
			should.not.exist(err);
			should.exist(hctweets._storage[sname]);
			hctweets._storage[sname].items.length.should.not.equal(0);
			hctweets._shouldBeUpdated(sname).should.equal(false);
			done(err);
		});
	});

	it('#registerSource snames[3]', function(done) {
		var sname = snames[3];
		this.timeout(60000);
		hctweets.registerSource(sname, function(err, items) {
			should.not.exist(err);
			should.exist(hctweets._storage[sname]);
			hctweets._storage[sname].items.length.should.not.equal(0);
			hctweets._shouldBeUpdated(sname).should.equal(false);
			done();
		});
	});

	it('#registerSource snames[4]', function(done) {
		var sname = snames[4];
		this.timeout(60000);
		hctweets.registerSource(sname, function(err, items) {
			should.not.exist(err);
			should.exist(hctweets._storage[sname]);
			hctweets._storage[sname].items.length.should.not.equal(0);
			hctweets._shouldBeUpdated(sname).should.equal(false);
			done();
		});
	});

	it('#startPeriodicRefresh', function(done) {
		this.timeout(60000);
		hctweets.startPeriodicRefresh();
		done();
	});

	it('#stopPeriodicRefresh', function(done) {
		this.timeout(60000);
		hctweets.stopPeriodicRefresh();
		done();
	});

	it('#getItems', function(done) {
		var sname = snames[0];
		hctweets.getItems(sname, function(err, items) {
			items.length.should.not.equal(0);
			done();
		});
	});
});