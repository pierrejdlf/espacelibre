var models = require("./models.js"),
	OAuth = require('oauth').OAuth,
	params = require("./myparams.js"),
	utils = require("./utils.js");

/////////////////////////////////////////////////////////////////////

var tweetSessionCount = 1;

/////////////////////////////////////////////////////////////////////
// the simple independent tweet robot sender, declared once
var twitterer = new OAuth(
	"https://api.twitter.com/oauth/request_token",
	"https://api.twitter.com/oauth/access_token",
	params.consumer_key,
	params.consumer_secret,
	"1.0A",
	null,
	"HMAC-SHA1"
);


/////////////////////////////////////////////////////////////////////
// twitter listener
var worker = function() {
	var twitter = require("ntwitter");
	var t = new twitter({
		consumer_key: params.consumer_key,
		consumer_secret: params.consumer_secret,
		access_token_key: params.access_token_key,
		access_token_secret: params.access_token_secret
	});
	t.stream(
		'statuses/filter',{
			//'language':en,
			//'follow':["userId","userId","userId"],
			//'track':params.trackTerms,
			'locations':"-180,-90,180,90",// ALL ! //params.rectParisBig.join(',')
		},
		function(stream) {
			stream.on("data", function(tweet) {
				var keepIt = tweet.geo!=null && utils.isPointInPoly(params.parisPolygon,tweet.geo.coordinates);
				if(keepIt) {
					var lat = tweet.geo.coordinates[0].toFixed(3);
					var lng = tweet.geo.coordinates[1].toFixed(3);
									
					console.log("===== TWEET RECEIVED "+(tweetSessionCount++)+" @"+tweet.user.screen_name+" : "+lat+","+lng);
					
					models.Point.findOneAndUpdate({lat:lat,lng:lng},{}, function(err,found) {
						if (err) { console.log("error findoneandupdate"); }
						else {
							if(!found) {
								var newPoint = new models.Point({
									lat: 		lat,
									lng: 		lng,
									count: 		1,
									created: 	Date(),
									updated:	Date(),
								});
								newPoint.save();
							} else {
								found.count  	= found.count+1;
								found.updated 	= Date();
								found.save();
							}
						}
					});
				}
			});
			stream.on('error', function(error, code) {
				console.log("============ TWITTER STREAM ERROR ! " + error + ": " + code);
			});
			stream.on('end', function (response) { // Handle a disconnection
				console.log("============ TWITTER STREAM DISCONNECTED");
			});
		}
	);
};

module.exports = worker;