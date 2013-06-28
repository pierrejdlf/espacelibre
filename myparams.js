var params = {
	//parlaparci account
	twittername:			'pipidata',
	consumer_key: 			process.env.ELCK,
	consumer_secret: 		process.env.ELCS,
	access_token_key: 		process.env.ELAK,
	access_token_secret: 	process.env.ELAS,
	
	/////////////// node web server port
	port:			process.env.PORT ,
	
	/////////////// DB
	mongdb:			process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://localhost/superpipidata',
	
	/////////////// twitter stream api, see https://dev.twitter.com/docs/streaming-apis/parameters
	trackTerms:		["ton","a","il","on","se","au","y","c","moi","je","tu","sa","son","ton","ta","ne","pas","la","le","de","des","du","un","et","si","pour","rien","sur","avec","sans","ds","dans","à","ce","ces","est","eu","vu","va","oui","non","no"],
	
	///////////////	NB: using location in twitter API will match -track- OR -fallswithinlocation-
	//locations		'48.804602,2.213745,48.920469,2.438278,48.804602,2.213745,48.920469,2.438278' Paris AND London
	
	// PARIS
	//rectParisBig:	[48.8145178,2.248419843,48.90334427,2.417923419], 	// based on following simplified Paris polygon bounding box
	//rectParisSmall:	[48.83173,2.292709,48.879167,2.395706],				// rectangle included in Paris
	
	// ILE-DE-FRANCE
	rectParisBig:	[48.056054,1.461182,49.335862,3.641968], 	// based on following simplified Paris polygon bounding box
	rectParisSmall:	[48.987427,2.06543,49.023461,3.059692],				// rectangle included in Paris
	
	///////////////	paris polygon for area calculation [lat,lng]
	// PARIS / ILE-DE-FRANCE
	//parisSqMeters:	91427402.83911657,
	parisSqMeters:		14679353480.09045,
	
	// PARIS / ILE-DE-FRANCE
	//parisPolygon: 	[[48.83419548,2.413464948],[48.85033074,2.417923419],[48.87367875,2.415478115],[48.90210227,2.392779594],[48.90334427,2.320691251],[48.88427269,2.281273171],[48.84087239,2.248419843],[48.83452727,2.256083081],[48.8158365,2.335076699],[48.8145178,2.36226302],[48.8282736,2.401443596]],
	parisPolygon: 	[[48.61791813,3.572957953],[48.85618892,3.508235299],[49.12239773,3.161118783],[49.24195102,2.093441879],[49.25413604,1.69649542],[49.05706873,1.409758358],[48.659274,1.582294231],[48.28108529,1.956014471],[48.11285239,2.444832491],[48.10563874,2.664153506],[48.11956951,2.825897828],[48.15829264,2.950372307],[48.38476815,3.422591908]],
	////////////////////////////////////////////////////////////////////////////////////////////////

};

module.exports = params;