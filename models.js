var mongoose = require('mongoose');

var pointSchema = new mongoose.Schema({
	lat:	Number,
	lng:	Number,
	count:	Number,
	created:Date,
	updated:Date,
});

var Point = mongoose.model('Point', pointSchema);
module.exports.Point = Point;
