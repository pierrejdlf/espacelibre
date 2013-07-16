var params = require("../myparams.js"),
	models = require("../models.js"),
	express = require("express");
	
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






