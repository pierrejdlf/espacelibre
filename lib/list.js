var m = null;

function fetchWords() {
	var b = m.getBounds();
	var zone = [b._southWest.lat, b._southWest.lng, b._northEast.lat, b._northEast.lng];
	query = {
		zone: 	zone,
		//zoom:	m.getCenter(),
	};
	console.log(query);
	superagent
		.get("/list.json")
		.query(query)
		.end(function(res) {
			console.log("json received");
			console.log(res.body);
			var words = res.body.words;
			var max = res.body.max;
		
			$("#info").html("we have: "+
				Object.keys(words).length + "words" +
				", max count is:" + max
			);
			for(w in words) {
				var fs = 0.5 + (words[w] * 2.5 / max);
				wd = $("<div>",{
							'class':'word',
							'data-count':words[w],
						})
						.css({'font-size':fs+'em'})
						.html(w);
				$("#list").append(wd);
			}
			console.log("sorting");
			$("#list div").sort(function(a,b){
				return $(b).attr("data-count")-$(a).attr("data-count");
			}).appendTo('#list');
		});
};

$(document).ready(function(){
	console.log("loading map");

	var pos = [48.862908,2.346611]; // center of Paris
	var zoom = 13;
	m = L.mapbox.map('map','minut.map-ajvfk52h').setView(pos,zoom);

	m.on('dragend',function(e) {
		//fetchWords();
	});
	$("#update").on('click',function(){
		fetchWords();
	})
});