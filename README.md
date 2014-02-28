# hardcandy
https://github.com/bnfinet/hardcandy

Benjamin Foote     
hardcandy@bnf.net   
http://bnf.net

hardcandy is a big sucker!

Periodically gets things from the internet with a specific lifecycle (a poller of URLs)

The base library hardcandy.js is meant to be inherited.  Examples for rss and tweets are included.

We use this at the personal telco project as a backing service for api.personaltelco.net  
http://personaltelco.net  
https://github.com/personaltelco/rest-api  

## Installation

```bash
    npm install --save git+ssh://git@github.com:bnfinet/hardcandy.git
```

## the lifecycle of a hardcandy item

(using rss as an example)

    - register a new url
    - immediately try to go and download content
    - store it in memory in a json object

    - start the poller
    - periodically, go and get content from each registered url
    - if there's an error, try again later
    - if there are too many errors, drop it

    - on shutdown write to disk for all urls

    - on next startup, load from disk and poll





## Usage

### RSS
backed by FeedParser

    var HCRss = require('../lib/hc_rss.js');
    var hcrss = new HCRss({
        type : 'rss',                       // a short string
        max_items : 5,                      // the max items we'll store at a time for each url
        update_frequency : 61 * 60 * 1000,  // how often the polling should kick off
        timeout : 4 * 24 * 60 * 60 * 1000,  // if we don't successfully get the feed for longer than maximum_age we drop the feed
        errlimit : 20,                      // errs allowed before we drop 
        file : __dirname + '/data/_hc_rss.json'  // no file, no persistence
    });

    var feeds = ['http://myblog.net/rss','http://yourblog.org/rss']; // backed by FeedParser so atom works too

    hcrss.registerSource(feeds[0], function(err, items) {
        if (err) {
            // handle it
        }
        // publish items
        console.log('here are the rss entries for ' + feeds[0], items);
    }
    var items = hcrss.getItems(feeds[0]);
    hcrss.startPeriodicRefresh(); // can be called at any time really, uses update_frequency as the interval 
    
    hcrss.registerSource(feeds[1], function(err, items) {
        if (err) {
            // handle it
        }
        // publish items
        console.log('here are the rss entries for ' + feeds[1], items);
    }
    hcrss.stopPeriodicRefresh();
    hcrss.shutdown(function(){
        console.log('done!');        
    });


### Twitter
using ntwitter

    var HCTwitter = require('hc_twitter');
    var hctwitter = new HCTwitter({
            type : 'twitter',
            max_items : 5,
            update_frequency : 61 * 60 * 1000,
            timeout : 24 * 60 * 60 * 1000,
            errlimit : 20,
            file : __dirname + '/data/_hc_tweets.json',  // no file, no persistence
            ntwitter = {
                consumer_key : '',
                consumer_secret : '',
                access_token_key : '',
                access_token_secret : ''
            };
    }

    // everything else is essentially the same as the rss example
    hctwitter.registerSource(url, function(err, items) {
        if (err) {
            // handle it
        }
        // publish items
        console.log('here are the tweets!', items);
    }
    hctwitter.getItems(url, function(err, items) {
        if (err) {
            // handle it
        }
        // publish items
        console.log('here are the tweets!', items);
    }


Roll Your Own
-------------
If you look at ./lib/hc_tweets.js you'll see an inheritance from hardcandy.js and a function 'getAndParse'

You should create the getAndParse function with the following basic form....

    MyAwesomeHC.prototype.getAndParse = function(key, cb) {
        var self = this;
        self.log('getAndParse', key);
        
        // work your magic with getting and parsing
        myAwesomeDownloadAndExtractionRoutine(function(err, data) {
            if (err) {
                self.log(err)
                return self.parserErr(err, sn, cb);
            }
            return cb(err, data);
        });
    };

You'll also need to pass config in your constructor and inherit from HardCandy (using utils.inherits in this case) 

    function MyAwesomeHC(config) { 
        if (this.configure(config)) {
            this.log('new MyAwesomeHC');
        }
    }
    util.inherits(HardCandyTweets, HardCandy);

Have fun and please do send me pulls!

TODO
---------
spin hc_rss.js and hc_tweets.js off into their own repos
use a key=value store, probably Mongo, as an optional persistence layer
or perhaps node-lru-cache






