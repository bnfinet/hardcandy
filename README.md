hardcandy
# hardcandy
https://github.com/bnfinet/hardcandy

Benjamin Foote
hardcandy@bnf.net
http://bnf.net

hardcandy is a big sucker!

Periodically gets things from the internet with a specific lifecycle (a poller of URLs)

The base library hardcandy.js is meant to be inherited.
    examples for rss and tweets are included

## the lifecycle 

(using rss as an example)

    - register a new url
    - immediately try to go and download content
    - store it in memory in a json object

    - periodically, go and get content from each registered url
    - if there's an error, try again later
    - if there are too many errors, drop it

    - on shutdown write to disk for all urls

    - on next startup, load from disk and poll

## Installation

```bash
    git clone https://github.com/bnfinet/hardcandy
```


RSS Feeds
==========

backed by FeedParser

usage:

RSS
-----
    var HCRss = require('hc_rss');
    var hcrss = new HCRss({
            type : 'rss',
            max_items : 5,
            update_frequency : 61 * 60 * 1000,
            timeout : 24 * 60 * 60 * 1000,
            errlimit : 20,
            file : './data/_gather_rss.json'
    }
    hcrss


Twitter
-------

    var HCTwitter = require('hc_twitter');
    var hctwitter = new HCTwitter({
            type : 'twitter',
            max_items : 5,
            update_frequency : 61 * 60 * 1000,
            timeout : 24 * 60 * 60 * 1000,
            errlimit : 20,
            file : './data/_gather_rss.json',
            ntwitter = {
                consumer_key : '',
                consumer_secret : '',
                access_token_key : '',
                access_token_secret : ''
            };
    }





