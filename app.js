/////////////////////////////////////////////////////////////////////
var params = require("./myparams.js");
console.log("\n==== HOLY-MIC");

/////////////////////////////////////////////////////////////////////
// We need to 'require' the following modules
var express = require("express"),
	http = require("http"),
	https = require('https'),
	path = require("path"),
	app = express(),
	mongoose = require('mongoose'),
	//redis	 = require('redis'),
	utils = require("./utils.js"),
	moment = require("moment"),
	models = require("./models.js"),
	twitterWorker = require("./twitter.js"),
	request = require('request');
	
/////////////////////////////////////////////////////////////////////
// This is our basic configuration
app.configure(function () {
	// Define our static file directory, it will be 'public'
	app.use(express.static(path.join(__dirname, 'public')));

	// all environments
	app.set('port', params.port);
	app.set('views', __dirname + '/views');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use('/css',express.static(path.join(__dirname, 'css')));
	app.use('/img',express.static(path.join(__dirname, 'img')));
	app.use('/lib',express.static(path.join(__dirname, 'lib')));
	
	// templating engine: hogan
	app.engine('html', require('hogan-express'));
	app.enable('view cache');
	app.set('view engine', 'html');
});

/////////////////////////////////////////////////////////////////////
// MongoDB connexion
mongoose.connect(params.mongdb);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongoose connection ERROR:'));
db.once('open', function callback () {
	console.log("Mongoose connected: "+params.mongdb);
});

/////////////////////////////////////////////////////////////////////
// Twitter stream worker
twitterWorker();

/////////////////////////////////////////////////////////////////////
// Create the http server on the specified port
http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});


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
		count:1,
		hashtags:1,
		mentions:1,
		words:1,
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
// avoid sleeping ?
var sleepCount = 0;
setInterval(function(){
	console.log("je ne dors pas ! "+(sleepCount++));
},200000);








