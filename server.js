var express = require('express');
var app = express();
var mongoose = require('mongoose');

var Latest = require('./latest');
//var config = require('./config');

var https = require('https');

app.set('port', (process.env.PORT || 5000));

var mongoURI = process.env.MONGOURI || 'mongodb://localhost';

mongoose.connect(mongoURI);

app.get('/', function(req, res) {
    res.send('Welcome! There are two functions to this tool. /api/latest will bring you the last 10 searches. /api/imagesearch/[keywords] will bring you a new image search!');
});

app.get('/api/latest/', function(req, res) {

    // get all the searches
    Latest.find({}, function(err, searches) {
        if (err) throw err;

        if (searches.length > 10) {

            var sortedList = searches.sort(function(a, b) {
                var d1 = new Date(a.created_at).getTime();
                var d2 = new Date(b.created_at).getTime();
                return (d2 - d1)
            }).slice(10, searches.length);

            sortedList.forEach(function(s) {
                // delete him
                s.remove(function(err) {
                    if (err) throw err;
                    console.log('search successfully deleted!');
                });
            })

        } else {
            console.log('no searches to delete!');
        }

        var searchObj = searches.map(function(search) {
            return {
                terms: search.term,
                when: search.created_at
            }
        }).slice(0, 10);

        // object of all the searches
        res.send(searchObj);
    });

});

app.get('/api/imagesearch/*', function(req, res) {
    console.log(req.query.offset);

    if (req.query.offset) {
        var offsetVar = +req.query.offset;
    } else {
        var offsetVar = 0;
    }

    var keywords = req.params[0].split(' ').join('+');

    var pixabayKey = process.env.pixabayKey;

    var options = {
        host: 'pixabay.com',
        path: '/api/?key=' + pixabayKey + '&q=' + keywords + '&image_type=photo'
    };

    function httpGet(url) {
        return new Promise(
            function(resolve, reject) {
                var bodyData = "";
                https.get(url, function(res) {
                    console.log('STATUS: ' + res.statusCode);
                    res.setEncoding('utf8');
                    res.on('data', function(chunk) {
                        bodyData += chunk;
                    });
                    res.on('end', function() {
                        resolve(bodyData);
                    });
                }).end()
            });
    }

    httpGet(options)
        .then(
            function(value) {
                var picObj = JSON.parse(value).hits;

                console.log(picObj.length + " hits found!")

                if (offsetVar + 5 < picObj.length) {
                    offsetEnd = offsetVar + 5;
                } else {
                    offsetEnd = picObj.length;
                }

                console.log("offsetVar: " + offsetVar + " offsetEnd: " + offsetEnd);

                var picUrls = picObj.slice(offsetVar, offsetEnd).map(function(pic) {
                    return {
                        pageURL: pic.pageURL,
                        tags: pic.tags,
                        previewURL: pic.previewURL,
                        webformatURL: pic.webformatURL
                    };
                })
                res.send(picUrls);
            },
            function(reason) {
                console.error('Https request to pixabay failed', reason);
            });

    var newSearch = new Latest({
        term: req.params[0],
        created_at: Date.now()
    })

    // call the built-in save method to save to the database
    newSearch.save(function(err) {
        if (err) throw err;

        console.log('Search saved successfully!');
    });


});

app.listen(app.get('port'), function () {
  console.log('Example app listening on port ' + app.get('port'));
});