/////////////////////////////////////////////////////////////////////
var params = require("./myparams.js");

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
	
	app.enable('view cache');

	// setup jade templating
	app.set('view engine', 'jade');
    app.set('views', __dirname + '/views');
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

app.use(require('./controllers/index'));

/////////////////////////////////////////////////////////////////////
// avoid sleeping ?
var sleepCount = 0;
setInterval(function(){
	console.log("je ne dors pas ! "+(sleepCount++));
},200000);
