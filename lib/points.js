var l = null;
////////////////////////////////////////////////////////////////////////////
var voronoimap = function(divid,shapeMask) {
	var f = {}, bounds, feature;

	var mydataPoints = null;
	var stats = [];
	var minPointSize = 7,
		maxPointSize = 7;
	var minPointSizeFrom = 4,
		maxPointSizeFrom = 4;
	var minPointTime = 20000,
		maxPointTime = 200;
	var tweetDateScaleMin = null,
		tweetDateScaleMax = null,
		tweetDateScaleTime = null,
		tweetDateScaleColor = null,
		tweetDateScaleOp = null;
	var defTweetColor = "red";//"#26BBF8"; // twitter blue
		overTweetColor = "black";
		pmapTweetColor = "red";
	var pmapTweetSize = 5;
	
	var showVoronoi = true;
	
	var overdiv = d3.select('#'+divid).append("div").attr('id','overmap');
	f.parent = overdiv.node();
	var svgmap = overdiv.append('svg').attr("id","svgmap").attr("class","leaflet-zoom-hide");
	g = svgmap.append("g");
	var gcontour = g.append("g").attr("id","gcontour");
	var gvoronoi = g.append("g").attr("id","gvoronoi");
	var gbubbles = g.append("g").attr("id","gbubbles");
	
	var mapmask = overdiv.append("svg").attr("id","svgmapmask")
		.attr("width",window.innerWidth)
		.attr("height",window.innerHeight)
		.append("path").attr("d","");
		
	///////////////////////////////////////////////////////////////////////////////////// FIXED PARIS PATH
	// tests
	//var parisGeo = [[48.804602,2.213745],[48.804602,2.438278],[48.920469,2.438278],[48.920469,2.213745]];
	// simplified convex paris
	var parisGeo = shapeMask;
	//console.log(parisGeo);
	var parisPolygon = null;
	var parisPixel = null;
		
	////////////////////////////////////////////////////////////////////////////////////
	// Use mapbox for the geographic projection
	f.projectraw = function(array) {
		var point = f.map.latLngToContainerPoint( new L.LatLng(array[0],array[1]) ); // Mapbox 1.0
		return [point.x, point.y];
	};
	f.projectdot = function(d) {
		// here, workaround to add some small decimal values to avoid same pixel position (voronoi bug)
		var pixpt = f.projectraw([d.x,d.y]);
		pixpt[0] += d.x/50.0;
		pixpt[1] += d.y/10.0;
		return pixpt;
	};
	
	/////////////////////////////////////////////////////////////////////////////////////	
	f.on = function(){};	
    f.initialize = function (latlng) {
    	console.log(" ... f.initialize");
    };
    f.onAdd = function (map) {
    	console.log(" ... f.onAdd");
    	f.map.on('move',  f.draw ,this);
        f.draw();
    },
    
	/////////////////////////////////////////////////////////////////////////////////////
	// Reposition the SVG to cover the features.
	f.draw = function() {
		//hide all tooltips when panning/zooming
		$('.mytooltip').remove();
		
		var bounds = f.map.getBounds();
		var	bl = bounds.getSouthWest(),
			tr = bounds.getNorthEast();
		var bottomLeft = f.projectraw([bl.lat,bl.lng]),
			topRight = f.projectraw([tr.lat,tr.lng]);
		d3.select("#svgmap")
			.attr({"width":topRight[0]-bottomLeft[0], "height":bottomLeft[1]-topRight[1]})
			.style({"margin-left":bottomLeft[0]+"px","margin-top":topRight[1]+"px"});
		d3.select("#svgmap g")
			.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");

		///////// POINTS
		d3.selectAll(".tweets")
			.attr("cx",function(d,i){return f.projectdot(d)[0];})
			.attr("cy",function(d,i){return f.projectdot(d)[1];});
			
			
		parisPixel = parisGeo.map(function(e){return [f.projectraw(e)[0],f.projectraw(e)[1]]; });
		parisPolygon = d3.geom.polygon(parisPixel);
		
		///////// PARIS CONTOUR
		d3.selectAll(".contour")
			.data([parisPixel])
			.attr("points",function(d) { return d.map( function(d){return [d[0],d[1]].join(",");} ).join(" "); });
		
		///////// PARIS MASK
		d3.select("#svgmapmask")
			.attr("width", topRight[0] - bottomLeft[0])
			.attr("height", bottomLeft[1] - topRight[1]);
		d3.select("#svgmapmask path").attr("d",f.getSvgMaskPath() );						
		
		if(showVoronoi) {
			var dataPositions = mydataPoints.map(function(d){ return [f.projectdot(d)[0],f.projectdot(d)[1]];});
			var ndata = d3.geom.voronoi(dataPositions).map(function(cell) { return parisPolygon.clip(cell); });
			///////// PATHS
			d3.selectAll(".voropaths")
				.data(ndata)
				.attr("d",function(d){ return "M"+d.join("L")+"Z"; });
		}	
	};
	/////////////////////////////////////////////////////////////////////////////////////
	// get mask path based on zoom
	f.getSvgMaskPath = function() {
		var mx = window.innerWidth;
		var my = window.innerHeight;
		var myy = my;
		var mxx = mx;
		var res = "M"+mxx+" "+myy;
		for(var i=0;i<parisPixel.length;i++) {
			var x = parisPixel[i][0];
			var y = parisPixel[i][1];
			res += " L"+x+" "+y;
		}
		res += " L"+parisPixel[0][0]+" "+parisPixel[0][1];
		res += " L"+mxx+" -0 L"+mxx+" "+myy+" L-0 "+myy+" L-0 -0 L"+mxx+" -0 L"+mxx+" "+myy+" Z";
		return res;
	};	
	
	/////////////////////////////////////////////////////////////////////////////////////
	// tweet tooltip content
	f.tooltipContent = function(d,mode) {
		return '<div><div class="toolt_head">'+formatDateFromNow(d.date)+" | "+formatDate(d.date,"ddd DD HH:mm")+" | "+d.lieu+'</div><div class="toolt_body">'+d.nom+'</div></div>';
	};
	
	/////////////////////////////////////////////////////////////////////////////////////
	// update user color scale
	f.updateScales = function() {
		tweetDateScaleOp = d3.scale.linear()
			.domain([stats['mindate'],stats['maxdate']])
			.range([0.6,1]);
			
		tweetDateScaleMin = d3.scale.linear()
			.domain([stats['mindate'],stats['maxdate']])
			.range([minPointSizeFrom,minPointSize]);
		tweetDateScaleMax = d3.scale.linear()
			.domain([stats['mindate'],stats['maxdate']])
			.range([maxPointSizeFrom,maxPointSize]);
			
		tweetDateScaleTime = d3.scale.linear()
			.domain([stats['mindate'],stats['maxdate']])
			.range([minPointTime,maxPointTime]);
		tweetDateScaleColor = d3.scale.pow().exponent(4)
			.domain([stats['maxdate'],stats['mindate']])
			.range(["black",defTweetColor]);
	};
	
	////////////////////////////////////////////////////////////////////////////////////
	// ATTR to tweets
	f.attrTweets = function(selection) {
		return selection
			//.style("pointer-events","none")
			.attr("class",function(d,i){ return "svg tweets"; } )
			.attr("id",function(d,i){return "c_"+d.id;})
			.attr("rel","tooltip")
			.attr("title",function(d,i){return f.tooltipContent(d);})
			//.attr("opacity",function(d,i){return tweetDateScaleOp(moment(d.created_at));})
			.attr("fill",function(d,i){return tweetDateScaleColor(moment(d.date));}) // color = vibrTweet
			.attr("cx",function(d,i){return f.projectdot(d)[0];})
			.attr("cy",function(d,i){return f.projectdot(d)[1];})
			.attr("r",function(d,i){return minPointSizeFrom;})
	};
	
	////////////////////////////////////////////////////////////////////////////////////
	// ATTR to voropaths
	f.attrVoronoi = function(selection) {
		selection
			.attr("class",function(d,i){ return "voropaths"; } )
			//.attr("id",function(d,i){return "v_"+mydataPoints[i].id;})
			.attr("fill","none")
			.attr("stroke","black")
		return selection;
	};

	////////////////////////////////////////////////////////////////////////////////////
	// access to grouped data from json (structured in the mongodb query)
	f.doto = function(d) {
		return {
			id:		d.idactivites,
			x:		d.lat,
			y:		d.lon,
			nom:	d.nom,
			date:	d.occurences[0].from,
			lieu:	d.lieu,
		};
	};

	////////////////////////////////////////////////////////////////////////////////////
	// init
	f.data = function(alldata,m,eventSourceChannel) {
		f.map = m;
		
		mydataPoints	= alldata.map(function(d){return f.doto(d);});
		
		stats['ntweets'] = mydataPoints.length;
		stats['mindate'] = Math.min.apply(Math,mydataPoints.map(function(d){ return moment(d.date) ; }));
		stats['maxdate'] = Math.max.apply(Math,mydataPoints.map(function(d){ return moment(d.date) ; }));
		stats['minlat'] = Math.min.apply(Math,mydataPoints.map(function(d){ return d.x ; }));
		stats['minlng'] = Math.min.apply(Math,mydataPoints.map(function(d){ return d.y ; }));
		stats['maxlat'] = Math.max.apply(Math,mydataPoints.map(function(d){ return d.x ; }));
		stats['maxlng'] = Math.max.apply(Math,mydataPoints.map(function(d){ return d.y ; }));
		
		console.log(stats);

		f.updateScales();
			
		//console.log(" ... sample first tweet:");
		//console.log(mydataPoints[0]);

		parisPixel = parisGeo.map(function(e){return [f.projectraw(e)[0],f.projectraw(e)[1]]; });	
		
		/////////////////////////////////////////// PARIS MASK
		d3.select("#svgmapmask path").attr("d",f.getSvgMaskPath());	
		
		/////////////////////////////////////////// PARIS BOUNDARIES
		gcontour.selectAll("polygon")
			.data([parisPixel])
			.enter().append("polygon")
				.attr("class","contour")
				.attr("points",function(d) { 
					return d.map( function(d){return [d[0],d[1]].join(",");} ).join(" ");
				});
	
		
		console.log(" ... init will make tweets");
		/////////////////////////////////////////// TWEET POINTS
		gbubbles.selectAll('tweets')
			.data(mydataPoints)
			.enter().append("svg:circle")
				.call(f.attrTweets);
				//.each(function(d,i){f.vibrTweets(d3.select(this),d,i);});
				
		
		console.log(" ... init will make voronoi");	
		/////////////////////////////////////////// VORONOI
/*
		// friendly array for d3 voronoi
		parisPolygon = d3.geom.polygon(parisPixel);
		//mydataPoints.forEach(function(e){ console.log(e.geo.coordinates[0]+","+e.geo.coordinates[0])});
		var dataPositions = mydataPoints.map(function(d,i){ return [f.projectdot(d)[0],f.projectdot(d)[1]];});
		//dataPositions.forEach(function(e){ console.log(e[0]+","+e[1])});
		var vdata = d3.geom.delaunay(dataPositions);
		gvoronoi.selectAll("path")
			.data(vdata)
			.enter().append("svg:path")
				.call(f.attrVoronoi);
*/
		
		// we don't make userlist
		//console.log(" ... init will make userlist");
		//f.makeUserList();
		makeTooltips('click');

		d3.select("#toggleVoronoi input").attr('checked','checked');
		d3.select("#toggleVoronoi input").on("click", function(){
			showVoronoi = !showVoronoi;
			d3.selectAll(".voropaths").style("opacity",showVoronoi ? 1 : 0);
			f.draw();
		});
		
		return f;
	};
	return f;
}

////////////////////////////////////////////////////////////////////////////
var init_map = function(divid,eventSourceChannel,shapeMask,jsonUrl,pos,zoom) {
	var m = L.mapbox.map(divid,null,{
		attributionControl:false,
		zoomControl:true,
		zoomAnimation:false,
		//minZoom:2,
		//maxZoom:25,
		//maxBounds:new L.LatLngBounds(new L.LatLng(48.498408,1.711121),new L.LatLng(49.156562,2.883911))
	}).setView(pos,zoom);
	m.zoomControl.setPosition('bottomright');
	var mLayer = L.mapbox.tileLayer('minut.map-ajvfk52h',{ format: 'jpg70' }); //funky = minut.map-ybst8py7 , satelite = minut.map-az5xzh7g , streets = minut.map-ajvfk52h
	mLayer.addTo(m);
	console.log(" ... waiting for json: "+jsonUrl);
	d3.json(jsonUrl, function(data) {
		console.log(" ... got json");
		l = voronoimap(divid,shapeMask).data(data,m,eventSourceChannel);
		m.addLayer(l);
	});
};


////////////////////////////////////////////////////////////////////////////
var goToMyPosition = function() {
	// fetching my current position (from browser)			
	navigator.geolocation.getCurrentPosition(
		function(position) {
			// Once we've got a position, zoom and center the map
			// on it, add ad a single feature
			console.log(" ... current location found !");
			console.log(position.coords);
			l.map.panTo([position.coords.latitude,position.coords.longitude]);
			l.map.setView([position.coords.latitude,position.coords.longitude],14,false);
		},
		function(err) {
			// If the user chooses not to allow their location
			console.log(" ... you refused to show your location !");
		}
	);
}
////////////////////////////////////////////////////////////////////////////

