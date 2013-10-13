var params = require("../myparams.js"),
	models = require("../models.js"),
	express = require("express"),
	_ = require('underscore');
	
var app = module.exports = express();

/////////////////////////////////////////////////////////////////////
// home page rendered in index.html
app.get('/', function(req, res) {
	models.Point.findOne().sort({count:-1}).exec(function(err, doc) {
		if (err !== null) {console.log("pb fetching max points: "+err);}
		else {
			console.log("max count: "+doc.count);
			res.locals = {
				maxcount: doc.count,
			};
			return res.render('gmaps');
		}
	});
	
});


/////////////////////////////////////////////////////////////////////
//
// TODO: compute worddistance between each words ... to regroup ? to lemm ?
//
/////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////
// compute for each point the {'word':count} list
app.get('/compute', function(req, res) {
	var pass = req.param('pass');
	if(pass==params.pass) {
		models.Point.find().exec(function(er, points) {
			points.forEach(function(p){
				// transform [oui,non,oui] to {oui:2,non:1}
				var clasm = _.reduce(p.words,function(init,d){
					init[d] = (init[d] || 0) +1;
					return init;
				},{});
				p.wix = clasm;
				p.save();
			});
			res.json({status:'computed'});
		});
	} else {
		//res.json({status:'done'});
		res.json({status:'forbidden'});
	}
});

/////////////////////////////////////////////////////////////////////
// display map and list of words based on bounds
app.get('/list', function(req, res) {
	res.render('list');
});
app.get('/list.json', function(req, res) {
	var zone = req.param('zone').split(',');
	// var query = {
	//	// not working !	
	// 	loc:	{ "$lt":[zone[0],zone[2]],"$gt":[zone[1],zone[3]] },
	// }
	// console.log(JSON.stringify(query,null,4));

	models.Point
		.find({},{
			wix: 1,
		})
		.where( 'loc.0' ).gt( zone[0] ).lt( zone[2] )
		.where( 'loc.1' ).gt( zone[1] ).lt( zone[3] )
		.exec(function(er, points) {
			if(er) console.log(er);
			console.log("points in that zone: "+points.length);
			var words  = {};
			// in words we put all the cumulated {word:12,mot:2,pouet:1}
			var max = 0;
			points.forEach(function(d) {
				for(k in d.wix) {
					var n = (words[k] || 0) + 1;
					words[k] = n;
					max = Math.max(n,max);
				}
			});
			// remove all words with only occurence <3
			toomit = [];
			for(w in words) {
				if(words[w]<3) toomit.push(w);
			}
			_.omit(words,toomit);
				// clasm.forEach(function(w){
				// 	//natural.JaroWinklerDistance(,);
				// 	//natural.LevenshteinDistance(,);
				// 	//natural.DiceCoefficient(,);
				// });
			//var out = {data:points[0].wix};
			res.json({words:words,max:max,n:points.length});
		});
});

/////////////////////////////////////////////////////////////////////
// clear all points
app.get('/clear', function(req, res) {
	var pass = req.param('pass');
	if(pass==params.pass) {
		models.Point.find().exec(function(er, points) {
			points.map(function(p){
				p.remove();
			});
			res.json({status:'done'});
		});
	} else {
		res.json({status:'forbidden'});
	}
});

/////////////////////////////////////////////////////////////////////
app.get('/points.json', function(req, res) {
	//var limit = req.param('limit') || 0;
	models.Point.find({},{
		loc:1,
	}).exec(function(er, points) {
		if (er !== null) {console.log("pb fetching points ! "+er);}
		else {
			console.log("fetched: "+points.length);
			res.json(points);
		}
	});
});

/////////////////////////////////////////////////////////////////////
app.get('/all.json', function(req, res) {
	//var limit = req.param('limit') || 0;
	models.Point.find({},{
		loc:1,
		count:1,
		hashtags:1,
		mentions:1,
		words:1,
		users:1,
		dates:1,
		followers:1,
		_id:0,
	}).exec(function(er, points) {
		if (er !== null) {console.log("pb fetching points ! "+er);}
		else {
			console.log("fetched: "+points.length);
			res.json(points);
		}
	});
});

/////////////////////////////////////////////////////////////////////
app.get('/grouped.json', function(req, res) {
	//var limit = req.param('limit') || 0;
	models.Point.find({},{
		loc:1,
		count:1,
		hashtags:1,
		mentions:1,
		words:1,
		users:1,
		dates:1,
		followers:1,
		_id:0,
	}).exec(function(er, points) {
		if (er !== null) {console.log("pb fetching points ! "+er);}
		else {
			result = {};
			console.log("fetched: "+points.length);
			points.forEach(function(d){
				var key = d.loc.map(function(u){return u.toFixed(1);});
				if(result.hasOwnProperty(key))
					result[key] = {
						words: d.words.join(",")+","+result[key].words
					};
				else
					result[key] = {
						words: d.words.join(",")
					};
			});
			res.json(result);
		}
	});
});






