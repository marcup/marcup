(function($,window,document) {

	var settings = {
    "instagramEndpoint":"https://api.instagram.com/v1",
    "instagramUserId":"3269959",
    "instagramAccessToken":"3269959.2defecc.e6a434ae0a0544de9a7548fc78ca746a",
    "lastfmEndpoint":"http://ws.audioscrobbler.com/2.0",
    "lastfmApiKey":"7fb854700b08eb56210a14cb22b0b537",
    "lastfmUser":"marc80b",
    "foursquareEndpoint":"https://api.foursquare.com/v2",
    "foursquareAccessToken":"R0FL55VFNHR0XDQEK1PPNRNMCTZ5PB1K3IEJCQSXVXDACN1J",
    "foursquareApiVersion":"20140801", //http://bit.ly/vywCav    
		"foursquareVenueImageSize":"width300", //https://developer.foursquare.com/docs/responses/photo
		"activityAmounts": {
			"instagram": 3,
			"lastfm": 3,
			"foursquare": 3
		}
	};

	loadSocials();
	//setEventTracking();
	//showSocials();
	setWelcome();

	
	$("nav.main > a").on("click", function (e) {
	  e.preventDefault();
	  var target = this.hash,
		$target = $(target);
	  $('html, body').stop().animate({
	    'scrollTop': $target.offset().top
	  }, 900, 'swing');
	  return false;
	});
	
	// function gaEventTrack(category,action,label) {      
	// 	ga('send', 'event', category, action, label);	  
	// }

	// function setEventTracking() {    
      
	// 	$(".tile","#tiles").each(function(){
 //      $(this).click(function(){
 //        if ($(this).hasClass("blog")) {gaEventTrack("tile blog","click","tiles")}
 //        if ($(this).hasClass("code")) {gaEventTrack("tile code","click","tiles")}
 //        if ($(this).hasClass("resume")) {gaEventTrack("tile resume","click","tiles")}
 //      })
 //    });                                

	// 	$("#stream li").each(function(){
 //      $(this).click(function(){
 //        gaEventTrack($(this).className,"click","stream")
 //      })
 //    });

	// 	$("#follow a").each(function(){
 //      $(this).click(function(){
 //        gaEventTrack($(this).className,"click","follow")
 //      })
 //    });

 //  }


	function setWelcome() {
		var now = new Date();
		var hours = now.getHours(); 
		if (hours < 12) {msg = "Good morning";}
		else if (hours < 18) {msg = "Good afternoon";}
		else {msg = "Good evening";}
		$('#greeting').text(msg);
	};

	function loadSocials() {

		//create activities placeholder
		var activities = {};

		//pointers to see if ajax calls are finished
		var InstagramCall = $.Deferred();
		var FoursquareVenueImgCall = $.Deferred();
		var LastfmCall = $.Deferred();

		//create handlebars templates
		var HBT_wrapper = Handlebars.compile($("#activity-wrapper").html());
		var HBT_instagram = Handlebars.compile($("#activity-instagram").html());
		var HBT_lastfm = Handlebars.compile($("#activity-lastfm").html());
		var HBT_foursquare = Handlebars.compile($("#activity-foursquare").html());

		fetchLatestInstagram(settings.activityAmounts.instagram).then(function(response) {
		  console.debug("Success! instagram", response);
		  $.each(response.data, function (obj) {
		  	var caption = this.caption ? this.caption.text : "instagram image";
				activities[this.created_time] = {
					"img":this.images.low_resolution.url,
					"url":this.link,
					"caption":caption,
					"timestamp":this.created_time,
					"source":"instagram"
				};
			});
			InstagramCall.resolve();
		}, function(error) {
		  return;
		});


		fetchLatestFoursquare(settings.activityAmounts.foursquare,function(response) {

			console.debug("Success! fetchLatestFoursquare", response);
			var count = 0, maxcount = settings.activityAmounts.foursquare;
			
			$.each(response.response.checkins.items,function(i,obj) {
				var obj = this;
				//venue image not included in checkin object, get seperate
				//fetchFoursquareVenueImg(this.venue.id,function(imgurl){ 
				fetchFoursquareVenueImg(this.venue.id).then(function(subResponse){
					var imgurl;
					$.each(subResponse.response.venue.photos.groups[0].items,function(i,obj) {
						if (i==0) {imgurl = this.prefix+settings.foursquareVenueImageSize+this.suffix}
					});
				  activities[obj.createdAt] = {
						"img":imgurl,
						"url":obj.venue.url,
						"venue":obj.venue.name,
						"city":obj.venue.location.city,
						"timestamp":obj.createdAt,
						"source":"foursquare"
					};
					count++;
					console.debug("fetchFoursquareVenueImg",count);
					if (count===maxcount) {FoursquareVenueImgCall.resolve();}
				});
			});

		});



		getTopArtistsLastfm(settings.activityAmounts.lastfm,"7day").then(function(response){

			//console.debug("Success! getTopArtistsLastfm", response);

			var imgsrc;
			$.each(response.topartists.artist ,function(obj) {
				$.each(this.image,function(obj) {
					if (this.size=="large") { //small|medium|large|extralarge|mega
						imgsrc= this['#text'];
					}
				});
				if(this.name && this.url && imgsrc) {
					//no timestamp provided by last.fm, only a ranking, (listened certain nr. of songs by artist somewhere during the last week), 
					//so let's make up our own timestamp, let's say max. 7 days (7 times 86400s) and consider provided order/ranking (higher ranking = lower value = higher timestamp )
					var rank = this["@attr"].rank;
					var timestamp = Math.round(new Date().getTime()/1000.0) - 7*86400 - rank*86400;
					activities[timestamp] = {
						"img":imgsrc,
						"url":this.url,
						"artist":this.name,
						"timestamp":timestamp,
						"source":"lastfm"
					};
				}
			});
			LastfmCall.resolve();
		}, function(error) {
		  return;
		});


		// check if promises for Instagram and LastFM are resolved
		//Promise.all([fetchLatestInstagram(),getTopArtistsLastfm()]).then(function() {
			// make sure all calls are done
			$.when( FoursquareVenueImgCall,InstagramCall,LastfmCall ).done(function () {
			    console.debug( "all done, start parsing" ); 
			    parseActivities()
			});
		//});


		function parseActivities() {

			//re-order or shuffle activity object if needed 
			//Object.keys(activities).sort();

			$.each(activities, function(timestamp,activity) {

			  var snippet;
			  if (activity.source == "instagram") {
					snippet = $(HBT_instagram(activity));
				}
				if (activity.source == "lastfm") {
					snippet = $(HBT_lastfm(activity));
				}
				if (activity.source == "foursquare") {
					snippet = $(HBT_foursquare(activity));
				}
				//add to DOM
				$('.activities').append($(HBT_wrapper(activity)).append(snippet));
				
			});

		};

		

		function fetchLatestInstagram(amount) {			
			return new Promise(function(resolve, reject) {
				$.ajax({
					type: "GET",
					dataType: "jsonp",
					cache: false,
					url: settings.instagramEndpoint+"/users/"+settings.instagramUserId+"/media/recent/?access_token="+settings.instagramAccessToken+"&count="+amount,
					success: function (response) {
						resolve(response);
					},
					error: function () {
						reject();
					}
				});
			});
		};

		function fetchLatestFoursquare(amount,returnData) {
			return new Promise(function(resolve, reject) {
				$.ajax({
					type: "GET",
					dataType: "jsonp",
					cache: false,
					url: settings.foursquareEndpoint+"/users/self/checkins?oauth_token="+settings.foursquareAccessToken+"&v="+settings.foursquareApiVersion+"&limit="+amount,
					success: function(response) {
						returnData(response);
					}
				});
			});
		};

		function fetchFoursquareVenueImg(venueId) {
			return new Promise(function(resolve, reject) {
				$.ajax({
					type: "GET",
					dataType: "jsonp",
					cache: false,
					url: settings.foursquareEndpoint+"/venues/"+venueId+"?oauth_token="+settings.foursquareAccessToken+"&v="+settings.foursquareApiVersion,
					success: function(response) {
						resolve(response);
						console.debug("FSImg_Response",response);
					},
					error: function() {
						reject()
					}
				});
			});
		};

		function getTopArtistsLastfm(amount,period,returnData) {
			return new Promise(function(resolve, reject) {
					$.getJSON(
					settings.lastfmEndpoint+"/?method=user.gettopartists&user="+settings.lastfmUser+"&api_key="+settings.lastfmApiKey+"&period="+period+"&limit="+amount+"&format=json",
					function(response){
						resolve(response);
					}
				);
			});
		};

	};

	//add collected items to stream sorted by timestamp
	// function appendItem(newitem, timestamp) {
	// 	//ensure integer
	// 	timestamp = timestamp*1;
	// 	if (timestamp && $("#stream li[data-timestamp]").length) {
	// 		var marker = 0;
	// 		//check if item to add is older than anything already in stream
	// 		$("#stream li[data-timestamp]").each(function(){	
	// 			if (timestamp < $(this).attr('data-timestamp')) {
	// 				marker = $(this).attr('data-timestamp');
	// 			}					
	// 		});
	// 		if (marker != 0)	{
	// 			$(newitem).insertAfter($('#stream li[data-timestamp="'+marker+'"]'))
	// 		}
	// 		//if not, then item to add is the newest one
	// 		else {
	// 			$("#stream").prepend(newitem);
	// 		}
	// 	}
	// 	else { 
	// 		$("#stream").append(newitem);
	// 	}
	// }




}(this.jQuery,this,this.document));










