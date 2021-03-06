var models = require("./models.js"),
	OAuth = require('oauth').OAuth,
	params = require("./myparams.js"),
	utils = require("./utils.js"),
	natural = require('natural'),
	ent = require('ent'),
	tokenizer = new natural.WordTokenizer();

/////////////////////////////////////////////////////////////////////

var tweetSessionCount = 1;

/////////////////////////////////////////////////////////////////////
// the simple independent tweet robot sender, declared once
/*
var twitterer = new OAuth(
	"https://api.twitter.com/oauth/request_token",
	"https://api.twitter.com/oauth/access_token",
	params.consumer_key,
	params.consumer_secret,
	"1.0A",
	null,
	"HMAC-SHA1"
);
*/

var removeHashMentionsHttp = function(t){
	t = ent.decode(t);
	t = t.replace(/@[^ ]+/g,"");								// mentions
	t = t.replace(/#[^ ]+/g,"");								// hashtags
	t = t.replace(/http:[a-z0-9\.\/]+/g,"");					// links
	return t;
};
/////////////////////////////////////////////////////////////////////
// get words from tweet
var getPuncs = function(text) {
	var res = [];
	var t = text.toLowerCase();
	t = removeHashMentionsHttp(t);
	var l = t.split(/[(a-z)çàéèêîôóùû ]+/g);
	l.forEach(function(m){
		var ok = (m.length>0);
		if(ok) res.push(m);
	});
	
	return res;
};

/////////////////////////////////////////////////////////////////////
// get words from tweet
var getWords = function(text) {
	var res = [];
	var t = text.toLowerCase();
	t = t.replace(/[a-z]*([a-z])\1{2,}[a-z]*/g," "); 			// repeating 3 chars like "mooort"
	t = t.replace(/[a-z]*([aehijoquvwxyz])\1{1,}[a-z]*/g," ");	// repeating 2x aehijoquvwxyz
	t = removeHashMentionsHttp(t);
	//var l = t.split(/[^(a-z)]+/g);
	var l = t.split(/[^(a-z)çàéèêîôóùû]+/g);
	//l = tokenizer.tokenize(t);
	l.forEach(function(m){
		var ok = (m.length>2);
		if(ok) res.push(m);
	});
	
	return res;
};

var playwithtweet = function(tweet) {
	var t = tweet.text;
	var toks = tokenizer.tokenize(t);
	console.log("PLAYED: "+t);
	console.log(toks);
	//natural.JaroWinklerDistance(,);
	//natural.LevenshteinDistance(,);
	//natural.DiceCoefficient(,);
}

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
				
					var hs = tweet.entities.hashtags.map(function(h){
						return h.text.toLowerCase();
					});
					var us = tweet.entities.user_mentions.map(function(u){
						return u.screen_name.toLowerCase();
					});
					var point = {
						text:		tweet.text,
						loc: 		[lat,lng],
						count: 		1,
						created: 	Date(),
						updated:	Date(),
						hashtags:	hs,
						mentions:	us,
						words:		getWords(tweet.text),
						puncs:		getPuncs(tweet.text),
						users:		[tweet.user.screen_name.toLowerCase()],
						dates:		[Date()],
						followers:	[tweet.user.followers_count],
						//todo: store the {word:count} wix object here ! avoid computing all despues
					}
					
					//playwithtweet(tweet);
					//console.log(JSON.stringify(point,null,4));
					
					models.Point.findOneAndUpdate({loc:point.loc},{}, function(err,found) {
						if (err) { console.log("error findoneandupdate"); }
						else {
							if(!found) {
								var newPoint = new models.Point(point);
								newPoint.save();
							} else {
								found.count  	= found.count+1;
								found.updated 	= Date();
								found.hashtags	= point.hashtags.concat(found.hashtags);
								found.mentions	= point.mentions.concat(found.mentions);
								found.words		= point.words.concat(found.words);
								found.puncs		= point.words.concat(found.puncs);
								found.users		= point.users.concat(found.users);
								found.dates		= point.dates.concat(found.dates);
								found.followers	= point.followers.concat(found.followers);
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
				console.log(response);
			});
		}
	);
};

module.exports = worker;