var areVars = function(arr) {
	var res = true;
	arr.forEach(function(e) {
		res = res && !(e===undefined || e==null);
	})
	return res;
};

//////////////////////////////////////////////////////////////////
var storePoint = function(point) {
	// create or update point
	models.Point.findOneAndUpdate({ geo:point.geo }, {}, function(err,found) {
		if (err) { }
		else {
			if(!found) {
				if(areVars([point.geo])) {
					var newPoint = new models.Point(point);
					newPoint.save( function (err, savedpoint) { // on save, update user with last tweet
						if (err) { console.log("pb saving= "+JDON.stringify(point)); }
						else {
							//console.log("NEW POINT= "+savedpoint.geo);
						}
					});
				}
			} else {
				//console.log("EXISTING POINT = "+found.geo);
				// todo: update point ?
			}
		}
	});
};

//////////////////////////////////////////////////////////////////
var parseGeoJson = function(d){
	if(d.type=='Point')
		storePoint({geo:d.coordinates});
	if(d.type=='MultiPoint' || d.type=='LineString' )
		d.coordinates.forEach(function(e){ storePoint({geo:e}); });
	if(d.type=='MultiLineString' || d.type=='Polygon')
		d.coordinates.forEach(function(e){
			e.forEach(function(l){ storePoint({geo:l}); });
		});
	if(d.type=='MultiPolygon')
		d.coordinates.forEach(function(e){
			e.forEach(function(l){
				l.forEach(function(m){ storePoint({geo:m}); });
			});
		});
};

//////////////////////////////////////////////////////////////////
var fetchDatasetPoints = function(k) {
	var  data = DATASETS[k];
	//{lab:'geo_coordinates',typ:'geo_point_2d',did:'exportfinessidf2012',name:'Export FINESS Ile de France 2012'};
	console.log("Fetching dataset: "+data.id);
	var opts = {
		uri: 'http://datastore.opendatasoft.com/public/api/records/1.0/download',
		qs:	{
			dataset:	data.id,
			format:		"json",
		}
	};
	request(opts, function (error, response, body) {
		console.log("response received: "+k);
		if (!error && response.statusCode == 200) {
			var obj = JSON.parse(body);
			//console.log(obj);
			var cc = 0;
			obj.forEach(function(e){
				if(cc==0) {
					console.log("========== "+data.id+" >> "+e.fields[data.label]);
					console.log(JSON.stringify(e.fields));
				}
				cc++;
				if(data.type=='geo_point_2d')
					storePoint({geo:e.fields[data.label]});
				if(data.type=='text') {
					var d = eval('('+e.fields[data.label]+')');
					parseGeoJson(d);
				}
			});
			console.log("-------- fetching next dataset --------");
			if(k<DATASETS.length) fetchDatasetPoints(k+1);
			else { console.log(" -- DONE --"); }
		} else {
			console.log("PROBLEM fetching points !");
		}
	});		
}


//////////////////////////////////////////////////////////////////
var fetchDatasetList = function(from) {
	//http://datastore.opendatasoft.com/public/api/records/1.0/search?dataset=arbresremarquablesparis2011&rows=-1
	//http://datastore.opendatasoft.com/public/api/datasets/1.0/search
	var opts = {
		uri: 'http://datastore.opendatasoft.com/public/api/datasets/1.0/search',
		qs:	{
			rows:		20,
			start:		from,
		}
	};
	request(opts, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var obj = JSON.parse(body);
			obj.datasets.forEach(function(e){
				//console.log("========== "+e.datasetid+" = "+e.metas.description);
				var hasGeo=false;
				var keep = false;
				e.fields.forEach(function(k){
					if(['int','double','date','datetime'].indexOf(k.type)==-1) {
						keep = (k.type=='text') ? (k.label=='Geometry' || k.label=='geom') : true ;
						if(keep) console.log("{id:'"+e.datasetid+"',label:'"+k.label+"',type:'"+k.type+"',name:'"+e.metas.title+"'}");
					}
				});
			});
			console.log("- MORE = "+from);
			if(from<=160) fetchDatasetList(from+20);
			else { console.log("- DONE -"); }
		} else {
			console.log("PROBLEM fetching points !");
		}
	});	
	
}




var fetchQueFaire = function(from) {
	var opts = {
		uri: 'https://api.paris.fr:3000/data/1.0/QueFaire/get_activities/',
		qs:	{
			token:		"---",
			offset:		from,
			limit:		100,	
		}
	};
	request(opts, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var obj = JSON.parse(body);
			obj.data.forEach(function(elem){
				elem.cat = "quefaire";
				elem.geo = [elem.lat,point.lon];
				elem.id = "quefaire_"+elem.idactivites;
				storePoint(elem);
			});
			console.log("- MORE -");
			if(from<=3000) fetchQueFaire(from+99);
			else { console.log("- DONE -"); }
		} else {
			console.log("PROBLEM fetching points !");
		}
	});	
};

var DATASETS = [{id:'exportfinessidf2012',label:'geo_coordinates',type:'geo_point_2d',name:'Export FINESS Ile de France 2012'},{id:'equipementsactionsocialenantes2012',label:'geom_x_y',type:'geo_point_2d',name:'Liste des équipements publics : Action sociale'},{id:'equipementscultenantes2012',label:'geom_x_y',type:'geo_point_2d',name:'Liste des équipements publics : Culte'},{id:'equipementsculturenantes2012',label:'geom_x_y',type:'geo_point_2d',name:'Liste des équipements publics : Culture'},{id:'equipementsdeplacelementnantes2012',label:'geom_x_y',type:'geo_point_2d',name:'Liste des équipements publics : Déplacement'},{id:'equipementsenseignementnantes2012',label:'geom_x_y',type:'geo_point_2d',name:'Liste des équipements publics : Enseignement'},{id:'equipementsjusticenantes2012',label:'geom_x_y',type:'geo_point_2d',name:'Liste des équipements publics : Justice et sécurité'},{id:'equipementsservicepublicnantes2012',label:'geom_x_y',type:'geo_point_2d',name:'Liste des équipements publics : Service public'},{id:'equipementssportsnantes2012',label:'geom_x_y',type:'geo_point_2d',name:'Liste des équipements publics : Sports'},{id:'equipementsviepratiquenantes2012',label:'geom_x_y',type:'geo_point_2d',name:'Liste des équipements publics : Vie pratique'},{id:'equipementsviesocialenantes2012',label:'geom_x_y',type:'geo_point_2d',name:'Liste des équipements publics : Vie sociale'},{id:'lieuxditsnantes2012',label:'geom_x_y',type:'geo_point_2d',name:'Répertoire des lieux-dits de Nantes Métropole'},{id:'voiesnantes2012',label:'geom_x_y',type:'geo_point_2d',name:'Répertoire des voies de Nantes Métropole'},{id:'jardinsparcsnantes2012',label:'coordonnees',type:'geo_point_2d',name:'Liste des jardins et des parcs de Nantes'},{id:'volumesbatisparis2011',label:'geom_x_y',type:'geo_point_2d',name:'Volumes bâtis - Données géographiques'},{id:'volumesbatisparis2011',label:'geom',type:'text',name:'Volumes bâtis - Données géographiques'},{id:'arbresremarquablesparis2011',label:'geom_x_y',type:'geo_point_2d',name:'Arbres remarquables - Données Géographiques'},{id:'arbresremarquablesparis2011',label:'geom',type:'text',name:'Arbres remarquables - Données Géographiques'},{id:'volumesnonbatisparis2011',label:'geom_x_y',type:'geo_point_2d',name:'Volumes non bâtis - Données géographiques'},{id:'volumesnonbatisparis2011',label:'geom',type:'text',name:'Volumes non bâtis - Données géographiques'},{id:'sanisettesparis2011',label:'geom_x_y',type:'geo_point_2d',name:'Sanisettes - Données géographiques'},{id:'sanisettesparis2011',label:'geom',type:'text',name:'Sanisettes - Données géographiques'},{id:'mobilierelectriqueparis2011',label:'geom_x_y',type:'geo_point_2d',name:'Electricité - Données géographiques'},{id:'mobilierelectriqueparis2011',label:'geom',type:'text',name:'Electricité - Données géographiques'},{id:'eclairageparis2011',label:'geom_x_y',type:'geo_point_2d',name:'Eclairage public - Données géographiques'},{id:'eclairageparis2011',label:'geom',type:'text',name:'Eclairage public - Données géographiques'},{id:'mobilierenvironnementparis2011',label:'geom_x_y',type:'geo_point_2d',name:'Mobiliers sur voie publique - Données géographiques'},{id:'mobilierenvironnementparis2011',label:'geom',type:'text',name:'Mobiliers sur voie publique - Données géographiques'},{id:'mobilierstationnementparis2011',label:'geom_x_y',type:'geo_point_2d',name:'Mobiliers de stationnement - Données géographiques'},{id:'mobilierstationnementparis2011',label:'geom',type:'text',name:'Mobiliers de stationnement - Données géographiques'},{id:'mobiliertransportsparis2011',label:'geom_x_y',type:'geo_point_2d',name:'Mobiliers des transports en commun - Données géographiques'},{id:'mobiliertransportsparis2011',label:'geom',type:'text',name:'Mobiliers des transports en commun - Données géographiques'},{id:'mobiliereaupotableparis2011',label:'geom_x_y',type:'geo_point_2d',name:'Mobiliers de distribution d\'eau potable et non potable - Données géographiques'},{id:'mobiliereaupotableparis2011',label:'geom',type:'text',name:'Mobiliers de distribution d\'eau potable et non potable - Données géographiques'},{id:'mobilierpropreteparis2011',label:'geom_x_y',type:'geo_point_2d',name:'Mobiliers urbains de propreté - Emplacements des colonnes à verre'},{id:'mobilierpropreteparis2011',label:'geom',type:'text',name:'Mobiliers urbains de propreté - Emplacements des colonnes à verre'},{id:'arbresalignementparis2010',label:'geom_x_y',type:'geo_point_2d',name:'Arbres d\'alignement - Données géographiques'},{id:'arbresalignementparis2010',label:'geom',type:'text',name:'Arbres d\'alignement - Données géographiques'},{id:'parcsetjardinsparis2010',label:'geom_x_y',type:'geo_point_2d',name:'Liste des parcs et jardins - Données géographiques'},{id:'parcsetjardinsparis2010',label:'geom',type:'text',name:'Liste des parcs et jardins - Données géographiques'},{id:'plaques_commemoratives_1939-1945',label:'latitude',type:'geo_point_2d',name:'Plaques commémoratives 1939-1945'},{id:'plaques_commemoratives_1939-1945',label:'longitude',type:'geo_point_2d',name:'Plaques commémoratives 1939-1945'},{id:'voiesactuellesparis2012',label:'geo_coordinates',type:'geo_point_2d',name:'Nomenclature des voies actuelles'},{id:'distributeurspreservatifsmasculinsparis2012',label:'geo_coordinates',type:'geo_point_2d',name:'Distributeurs de préservatifs à Paris'},{id:'arretesinsalubriteparis2010',label:'geo_coordinates',type:'geo_point_2d',name:'Arrêtés municipaux d\'insalubrité - 2010'},{id:'sncfequipementsdesgares2012',label:'geo_coordinates',type:'geo_point_2d',name:'Equipements des gares'},{id:'openstreetmapplaceitaliefeb2012',label:'geom_x_y',type:'geo_point_2d',name:'POI OpenStreetMap Place d\'Italie - © OpenStreetMap contributor'},{id:'openstreetmapiledefrancemar2012',label:'geom_x_y',type:'geo_point_2d',name:'POI OpenStreetMap Ile de France - © OpenStreetMap contributor'},{id:'openstreetmappacamar2012',label:'geom_x_y',type:'geo_point_2d',name:'POI OpenStreetMap Provence Alpes Côte d\'Azur - © OpenStreetMap c'},{id:'pointsaccueilpoliceparis2011',label:'geo_coordinates',type:'geo_point_2d',name:'Points d\'accueil police (coordonnées) - Paris'},{id:'listemuseesfrance2011',label:'geo_coordinates',type:'geo_point_2d',name:'Liste des Musées de France'},{id:'immeublesprotegesiledefrancedatapublica2011',label:'geo_coordinates',type:'geo_point_2d',name:'Monuments Historiques Protégés - Ile de France'},{id:'openstreetmappaysdelaloiremar2012',label:'geom_x_y',type:'geo_point_2d',name:'POI OpenStreetMap Pays de la Loire - © OpenStreetMap contributor'},{id:'lapostepoimars2012',label:'geo_coordinates',type:'geo_point_2d',name:'Liste des points de contact du réseau postal français'},{id:'liste_des_musees_de_france_2011',label:'geo_coordinates',type:'geo_point_2d',name:'Liste des Musées de France'},{id:'datalocale_rtcc-cdt33',label:'Coordinates',type:'geo_point_2d',name:'Liste des résidences de tourisme classées de Gironde'},{id:'datalocale_mlcc-cdt33',label:'Coordinates',type:'geo_point_2d',name:'Liste des meublés labéllisés Clévacances de Gironde'},{id:'datalocale_pj-cdt33',label:'Coordinates',type:'geo_point_2d',name:'Liste des parcs et jardins de Gironde'},{id:'datalocale_lr-cdt-33',label:'Coordinates',type:'geo_point_2d',name:'Liste de restaurants de Gironde'},{id:'datalocale_mci-cdt33',label:'Coordinates',type:'geo_point_2d',name:'Liste des musées et centres d\'interprétation de Gironde'},{id:'datalocale_mlgf-cdt33',label:'Coordinates',type:'geo_point_2d',name:'Liste des meublés labéllisés Gîtes de France de Gironde'},{id:'datalocale_chlgf-cdt33',label:'Coordinates',type:'geo_point_2d',name:'Liste des chambres d\'hôtes labéllisées Gîtes de France de Gironde'},{id:'datalocale_vvc-cdt33',label:'Coordinates',type:'geo_point_2d',name:'Liste des villages de vacances classés et anciennement classés de Gironde'},{id:'datalocale_lchc-33',label:'Coordinates',type:'geo_point_2d',name:'Liste des chambres d\'hôtes labéllisées Clévacances de Gironde'},{id:'datalocale_lchfs-33',label:'Coordinates',type:'geo_point_2d',name:'Liste des chambres d\'hôtes labéllisées Fleurs de Soleil de Gironde'},{id:'datalocale_lrhnc-33',label:'Coordinates',type:'geo_point_2d',name:'Liste des résidences hotelières non classées de Gironde'},{id:'datalocale_llv-33',label:'Coordinates',type:'geo_point_2d',name:'Liste des loueurs de vélos de Gironde'},{id:'datalocale_lg-33',label:'Coordinates',type:'geo_point_2d',name:'Liste des golfs de Gironde'},{id:'datalocale_lce-33',label:'Coordinates',type:'geo_point_2d',name:'Liste des centres équestres de Gironde'},{id:'datalocale_lbp-33',label:'Coordinates',type:'geo_point_2d',name:'Liste des bateaux promenade de Gironde'},{id:'datalocale_lpt-33',label:'Coordinates',type:'geo_point_2d',name:'Liste des parcs à thèmes de Gironde'},{id:'datalocale_lmv-33',label:'Coordinates',type:'geo_point_2d',name:'Liste des maisons du vin de Gironde'},{id:'datalocale_lfd-33',label:'Coordinates',type:'geo_point_2d',name:'Liste des fermes de découverte de Gironde'},{id:'datalocale_lsolvc-33',label:'Coordinates',type:'geo_point_2d',name:'Liste des sites oenotouristiques labellisés Vignobles et Chais en Bordelais'},{id:'datalocale_lln-33',label:'Coordinates',type:'geo_point_2d',name:'Liste des loisirs nautiques de Gironde'},{id:'horaires_des_lignes_transilien',label:'stop_latlon',type:'geo_point_2d',name:'HORAIRES DES LIGNES TRANSILIEN'},{id:'equipement_des_gares_idf',label:'Coordonnées',type:'geo_point_2d',name:'EQUIPEMENT DES GARES IDF'},{id:'entres_sorties_lignes_c_et_l',label:'Coordonnées',type:'geo_point_2d',name:'ENTRÉES SORTIES LIGNES C ET L'},{id:'bornes_et_arceaux_de_stationnement_a_paris',label:'geom_x_y',type:'geo_point_2d',name:'Bornes et Arceaux de Stationnement à Paris'},{id:'bornes_et_arceaux_de_stationnement_a_paris',label:'geom',type:'text',name:'Bornes et Arceaux de Stationnement à Paris'},{id:'consultations_des_centres_de_sante',label:'Coordonnées géographiques',type:'geo_point_2d',name:'Consultations des centres de santé à Paris'},{id:'liste_des_sites_des_hotspots_paris_wifi',label:'geo_coordinates',type:'geo_point_2d',name:'Liste des sites des hotspots Paris WiFi'},{id:'liste_des_places_de_livraison',label:'geo_coordinates',type:'geo_point_2d',name:'Liste des places de livraison'},{id:'parcs_de_stationnement_en_sous_sol_a_paris',label:'geo_coordinates',type:'geo_point_2d',name:'Parcs de stationnement en sous-sol à Paris'},{id:'liste_des_kiosques_presse_theatre_et_loto',label:'geo_coordinates',type:'geo_point_2d',name:'Liste des kiosques presse, théâtre et Loto'},{id:'liste_des_marches_de_quartier_a_paris',label:'geo_coordinates',type:'geo_point_2d',name:'Liste des marchés de quartier à Paris'},{id:'liste_des_jardins_partages_a_paris',label:'geo_coordinates',type:'geo_point_2d',name:'Liste des jardins partagés à Paris'},{id:'panneaux_indicateurs_de_signalisation_routiere_et_pietonne',label:'Geometry X Y',type:'geo_point_2d',name:'Panneaux indicateurs de signalisation routière et piétonne'},{id:'panneaux_indicateurs_de_signalisation_routiere_et_pietonne',label:'Geometry',type:'text',name:'Panneaux indicateurs de signalisation routière et piétonne'},{id:'bati_donnees_geographiques',label:'Geometry X Y',type:'geo_point_2d',name:'Bâti - Données géographiques'},{id:'bati_donnees_geographiques',label:'Geometry',type:'text',name:'Bâti - Données géographiques'},{id:'tonnages_des_dechets_bacs_jaunes',label:'Total arrondissement 2011',type:'geo_point_2d',name:'Tonnages des déchets bacs jaunes'},{id:'tonnages_de_la_collecte_du_verre',label:'Total arrondissement 2011',type:'geo_point_2d',name:'Tonnages de la collecte du verre'},{id:'annuaire_de_l_administration_-_base_de_donnees_locales_v2_-_organismes',label:'coordonnees_geo',type:'geo_point_2d',name:'Annuaire de l’administration – Base de données locales V2 - Organismes'},{id:'trottoirs_des_rues_de_paris',label:'Geometry X Y',type:'geo_point_2d',name:'Trottoirs des rues de Paris'},{id:'trottoirs_des_rues_de_paris',label:'Geometry',type:'text',name:'Trottoirs des rues de Paris'},{id:'relief_naturel',label:'Geometry X Y',type:'geo_point_2d',name:'Relief naturel'},{id:'relief_naturel',label:'Geometry',type:'text',name:'Relief naturel'},{id:'murs_et_clotures',label:'Geometry X Y',type:'geo_point_2d',name:'Murs et Clotures'},{id:'murs_et_clotures',label:'Geometry',type:'text',name:'Murs et Clotures'},{id:'stations_et_espaces_autolib_de_la_metropole_parisienne',label:'Coordonnées geo',type:'geo_point_2d',name:'Stations et espaces AutoLib de la métropole parisienne'},{id:'cheminement_d_assainissement',label:'Geometry X Y',type:'geo_point_2d',name:'Cheminement d\'assainissement'},{id:'cheminement_d_assainissement',label:'Geometry',type:'text',name:'Cheminement d\'assainissement'},{id:'mobiliers_de_voies_routieres_de_type_barriere',label:'Geometry X Y',type:'geo_point_2d',name:'Mobiliers de voies routières de type barriere'},{id:'mobiliers_de_voies_routieres_de_type_barriere',label:'Geometry',type:'text',name:'Mobiliers de voies routières de type barriere'},{id:'poteaux_divers_sur_voie_publique',label:'Geometry X Y',type:'geo_point_2d',name:'Poteaux divers sur voie publique'},{id:'poteaux_divers_sur_voie_publique',label:'Geometry',type:'text',name:'Poteaux divers sur voie publique'},{id:'detail_du_bati',label:'Geometry X Y',type:'geo_point_2d',name:'Détail du Bâti'},{id:'detail_du_bati',label:'Geometry',type:'text',name:'Détail du Bâti'},{id:'tournagesdefilmsparis2011',label:'geo_coordinates',type:'geo_point_2d',name:'Lieux de tournage de films (long métrage)'},{id:'ratp_stops_with_routes',label:'geo_coordinates',type:'geo_point_2d',name:'Positions géographiques des stations (associées à leurs lignes) du réseau RATP'},{id:'accessibilite_arrets_bus_ratp',label:'Geometry X Y',type:'geo_point_2d',name:'Accessibilité Arrêts Bus RATP'},{id:'accessibilite_arrets_bus_ratp',label:'Geometry',type:'text',name:'Accessibilité Arrêts Bus RATP'}];
/////////////////////////////////////////////////////////////////////
app.get('/update', function(req, res) {
	console.log("Updating Data");
	//fetchQueFaire(0);
	//fetchDatasetList(0);
	// 14 failed
	fetchDatasetPoints(15);
	res.json({"status":"launched"});
});
