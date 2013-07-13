var mongoose = require('mongoose');

var pointSchema = new mongoose.Schema({
	loc:		[Number],
	count:		Number,
	created:	Date,
	updated:	Date,
	hashtags:	[],
	words:		[],
	mentions:	[],
});

pointSchema.index({loc:'2d'});

var Point = mongoose.model('Point', pointSchema);
module.exports.Point = Point;
