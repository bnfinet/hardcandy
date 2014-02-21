var should = require('chai').should();

describe("hc_rss", function() {
    var HCRss = require('../lib/hc_rss.js');
    var hcrss = new HCRss({
        type : 'rss',
        max_items : 5,
        // update_frequency : 61 * 60 * 1000,
        update_frequency: 7 * 1000,
        timeout : 24 * 60 * 60 * 1000,
        errlimit : 20,
        file : __dirname + '/data/_hc_rss.json'  // no file, no persistence
            
    });
    
    var feeds = ['https://groups.google.com/forum/feed/ptp-general/msgs/rss_v2_0.xml?num=5',
	             'http://luckylab.com/blog/feed/',		// this times out
	             'http://beatervillecafeandbar.com/feed/',   // this is right!
	             'https://library.pdx.edu/',  // this is wrong
	             'http://stumptowncoffee.com/news/feed/',
	];
	
	it('#getAndParse', function(done) {
		hcrss.getAndParse(feeds[0], function(err, items) {
			should.not.exist(err);
			items.length.should.not.equal(0);
			done(err);
		});
	});

	describe("storage", function() {
		it('#_saveStorageToFile', function(done) {
			hcrss._saveStorageToFile(function(err) {
				should.not.exist(err);
				done(err);
			});
		});
		it('#_loadStorageFromFile', function(done) {
			hcrss._loadStorageFromFile(function(err) {
				should.not.exist(err);
				done(err);
			});
		});
	});
	
	describe("regsiter and delete", function() {
		it('#registerSource feeds[0]', function(done) {
			hcrss.registerSource(feeds[0], function() {
			    should.exist(hcrss._storage[feeds[0]]);
				hcrss._storage[feeds[0]].items.length.should.not.equal(0);
				done();
			});
		});

		it('#_shouldBeDeleted feeds[0]', function(done) {
			var now = new Date().getTime();
			hcrss._shouldBeDeleted(feeds[0]).should.equal(false);
	
			hcrss._storage[feeds[0]].errcount = 10000;
			hcrss._shouldBeDeleted(feeds[0]).should.equal(true);
	
			hcrss._storage[feeds[0]].errcount = 0;
			hcrss._shouldBeDeleted(feeds[0]).should.equal(false);
	
			hcrss._storage[feeds[0]].lastrequest = now - hcrss._config.timeout * 2;
			hcrss._shouldBeDeleted(feeds[0]).should.equal(true);
	
			hcrss._storage[feeds[0]].lastrequest = now;
			hcrss._shouldBeDeleted(feeds[0]).should.equal(false);
			
			done();
		});
	
		it('#_shouldBeUpdated feeds[0]', function(done) {
			hcrss._shouldBeUpdated(feeds[0]).should.equal(false);
			hcrss._storage[feeds[0]].updated = -1;
			hcrss._shouldBeUpdated(feeds[0]).should.equal(true);
			done();
		});
		
		it('#unregisterSource feeds[0]', function(done) {
			hcrss.unregisterSource(feeds[0], function() {
				should.not.exist(hcrss._storage[feeds[0]]);
				done();
			});
		});
	});
	
	it('#registerSource feeds[0]', function(done) {
		var url = feeds[0];
		hcrss.registerSource(url, function(err, items) {
			should.not.exist(err);
			hcrss._isRegistered(url).should.equal(true);
			should.exist(hcrss._storage[url]);
			hcrss._storage[url].items.length.should.not.equal(0);
			hcrss._storage[url].updated.should.not.equal(-1);
			done(err);
		});
	});
	
	it('#getItems feeds[0]', function(done) {
		var url = feeds[0];
		this.timeout(200); // should come back fast since it's registered (cached)
		hcrss.getItems(url, function(err, items) {
			should.not.exist(err);
			hcrss._storage[url].updated.should.not.equal(-1);
			done(err);
		});
	});

	it('#registerSource feeds[1]', function(done) { // lucky lab rss has issues
		var url = feeds[1];
		this.timeout(60000);
		hcrss.registerSource(url, function(err, items) {
//			should.exist(err);
			done(err);
		});
	});

	it('#registerSource feeds[2]', function(done) {
		var url = feeds[2];
		this.timeout(60000);
		hcrss.registerSource(url, function(err, items) {
//			console.log('#registerSource feeds[2] err', err);
			should.not.exist(err);
			should.exist(hcrss._storage[url]);
			hcrss._storage[url].errcount.should.equal(0);
//			hcrss._storage[url].items.length.should.equal(0);
			hcrss._shouldBeUpdated(url).should.equal(false);
			done(err);
		});
	});

	it('#registerSource feeds[3]', function(done) {
		var url = feeds[3];
		this.timeout(60000);
		hcrss.registerSource(url, function(err, items) {
			should.exist(err);
			should.exist(hcrss._storage[url]);
			hcrss._storage[url].items.length.should.equal(0);
			hcrss._shouldBeUpdated(url).should.equal(true);
			done();
		});
	});

	it('#registerSource feeds[4]', function(done) {
		var url = feeds[4];
		this.timeout(60000);
		hcrss.registerSource(url, function(err, items) {
			should.not.exist(err);
			should.exist(hcrss._storage[url]);
			hcrss._storage[url].items.length.should.not.equal(0);
			hcrss._shouldBeUpdated(url).should.equal(false);
			done();
		});
	});

	it('#startPeriodicRefresh', function(done) {
		this.timeout(60000);
		hcrss.startPeriodicRefresh();
		done();
	});

	it('#stopPeriodicRefresh', function(done) {
		this.timeout(60000);
		hcrss.stopPeriodicRefresh();
		done();
	});

	it('#getItems', function(done) {
		var url = feeds[0];
		hcrss.getItems(url, function(err, items) {
			items.length.should.not.equal(0);
			done();
		});
	});
});