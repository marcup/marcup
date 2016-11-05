(function($,window,document) {

	loadSocials();
	setEventTracking();
	//setWelcome();
	//dohoudini(function(trigger) { $(trigger).nextAll().hide(); })	
	
	$("nav.main > a").on("click", function (e) {
	  e.preventDefault();
	  var target = this.hash,
		$target = $(target);
	  $('html, body').stop().animate({
	    'scrollTop': $target.offset().top
	  }, 900, 'swing');
	  return false;
	});
	
	function gaEventTrack(category,action,label) {      
	  ga('send', 'event', category, action, label);	  
    }

	function setEventTracking() {    
        $(".tile","#tiles").each(function(){
          $(this).click(function(){
            if ($(this).hasClass("blog")) {gaEventTrack("tile blog","click","tiles")}
            if ($(this).hasClass("code")) {gaEventTrack("tile code","click","tiles")}
            if ($(this).hasClass("resume")) {gaEventTrack("tile resume","click","tiles")}
          })
        });                                
		$("#stream li").each(function(){
          $(this).click(function(){
            gaEventTrack($(this).className,"click","stream")
          })
        });
		$("#follow a").each(function(){
          $(this).click(function(){
            gaEventTrack($(this).className,"click","follow")
          })
        });
    }

	function setWelcome() {
		var now = new Date();
		var hours = now.getHours(); 
		if (hours < 12) msg = "Good morning";
		else if (hours < 18) msg = "Good afternoon";
		else msg = "Good evening";
		$('#greeting').text(msg);
	}

	function loadSocials() {

		var 
      //Instagram data
      instagramEndpoint = 'https://api.instagram.com/v1',
      instagramUserId = '3269959',
      instagramAccessToken = "3269959.2defecc.e6a434ae0a0544de9a7548fc78ca746a",
      //LastFM data
      lastfmEndpoint = 'http://ws.audioscrobbler.com/2.0',
      lastfmApiKey = "7fb854700b08eb56210a14cb22b0b537",
      lastfmUser = "marc80b",
      //Foursquare data
      foursquareEndpoint = 'https://api.foursquare.com/v2',
      foursquareAccessToken = 'R0FL55VFNHR0XDQEK1PPNRNMCTZ5PB1K3IEJCQSXVXDACN1J',
      foursquareApiVersion = '20140801', //http://bit.ly/vywCav    
			foursquareVenueImageSize = 'width300'; //https://developer.foursquare.com/docs/responses/photo
			
		function fetchLatestInstagram(amount,returnData) {
			$.ajax({
				type: "GET",
				dataType: "jsonp",
				cache: false,
				url: instagramEndpoint+"/users/"+instagramUserId+"/media/recent/?access_token="+instagramAccessToken+"&count="+amount,
				success: function (response) {
				  $.each(response.data, function (obj) {
					  if (this.caption) { returnData(this.images.low_resolution.url, this.link, this.caption.text, this.created_time); }				  
						else {returnData(this.images.low_resolution.url,this.link,"instagram image",this.created_time);}
					});
				}
			});
		}

		function fetchLatestFoursquare(amount,returnData) {
			$.ajax({
				type: "GET",
				dataType: "jsonp",
				cache: false,
				url: foursquareEndpoint+"/users/self/checkins?oauth_token="+foursquareAccessToken+"&v="+foursquareApiVersion+"&limit="+amount,
				success: function(response) {
					//console.log(response);
					$.each(response.response.checkins.items,function(obj) {
						var obj = this;
						//venue image not included in checkin object, get seperate
						fetchFoursquareVenueImg(this.venue.id,function(imgurl){ 
						  returnData(obj.venue.name, obj.venue.location.city, obj.venue.url, imgurl, obj.createdAt);
						});
					});
				}
			});
		}

		function fetchFoursquareVenueImg(venueId,returnData) {
			$.ajax({
				type: "GET",
				dataType: "jsonp",
				cache: false,
				url: foursquareEndpoint+"/venues/"+venueId+"?oauth_token="+foursquareAccessToken+"&v="+foursquareApiVersion,
				success: function(response) {
					//console.log(response);
					$.each(response.response.venue.photos.groups[0].items,function(i,obj) {
						if (i==0) {returnData(this.prefix+foursquareVenueImageSize+this.suffix);	}
					});
				}
			});
		}

		function getTopArtistsLastfm(limit,period,returnData) {
			var maxEntries = 0; // if 0 there will be no limit
			$.getJSON(
				lastfmEndpoint+"/?method=user.gettopartists&user="+lastfmUser+"&api_key="+lastfmApiKey+"&period="+period+"&limit="+limit+"&format=json",
				function(response){
				  var imgsrc;
					$.each(response.topartists.artist ,function(obj) {
						$.each(this.image,function(obj) {
							if (this.size=="large") { //small|medium|large|extralarge|mega
								imgsrc= this['#text'];
							}
						});
						returnData(this.name,this.url,imgsrc,this["@attr"].rank);
					});
				}
			);
		}


		

		// get Last.FM weekly Topartists // http://www.last.fm/api/show/user.getTopArtists
		getTopArtistsLastfm(3,"7day",function(artistname,artisturl,imgsrc,rank) { 
			if(artistname && artisturl && imgsrc) {
				//no timestamp provided by last.fm, only a ranking, (listened certain nr. of songs by artist somewhere during the last week), 
				//so let's make up our own timestamp, let's say max. 7 days (7 times 86400s) and consider provided order/ranking (higher ranking = lower value = higher timestamp )
				var timestamp = Math.round(new Date().getTime()/1000.0) - 7*86400 - rank*86400;
			  appendItem('<li class="lastfm" data-timestamp='+timestamp+'><a href="'+artisturl+'" title="listened to: '+artistname+'" target="_blank"><span style="background-image:url('+imgsrc+');">recently listened: '+artistname+'"</span><label>last.fm</label></a></li>',timestamp)
				//appendItem('<li class="lastfm" data-timestamp=' + timestamp + '><a href="' + artisturl + '" title="listened to: ' + artistname + '" target="_blank"><img src="' + imgsrc + '" alt="'+ artistname +'" /></a></li>', timestamp)
			}
		});

		// get Latest Instagram posts
		fetchLatestInstagram(3,function(imgsrc,link,caption,timestamp) {
			appendItem('<li class="instagram" data-timestamp='+timestamp+'><a href="'+link+'" title="posted: '+caption+'" target="_blank"><span style="background-image:url('+imgsrc+');">instagram: '+caption+'"</span><label>instagram</label></a></li>',timestamp)
		});
		
		// get Latest Foursquare checkins
		fetchLatestFoursquare(3, function (venuename, venuelocation, link, imgsrc, timestamp) {
		  var target = ' target="_blank"';
		  if (!link) { link = "javascript:void(0)"; target="" }
			appendItem('<li class="foursquare" data-timestamp='+timestamp+'><a href="'+link+'" title="checked in at: '+venuename+' in '+venuelocation+'"'+target+'><span style="background-image:url('+imgsrc+');">foursquare checkin: '+venuename+'"</span><label>foursquare</label></a></li>',timestamp)
		});


		//add collected items to stream sorted by timestamp

		function appendItem(newitem, timestamp) {
			//ensure integer
			timestamp = timestamp*1;
			if (timestamp && $("#stream li[data-timestamp]").length) {
				var marker = 0;
				//check if item to add is older than anything already in stream
				$("#stream li[data-timestamp]").each(function(){	
					if (timestamp < $(this).attr('data-timestamp')) {
						marker = $(this).attr('data-timestamp');
					}					
				});
				if (marker != 0)	{
					$(newitem).insertAfter($('#stream li[data-timestamp="'+marker+'"]'))
				}
				//if not, then item to add is the newest one
				else {
					$("#stream").prepend(newitem);
				}
			}
			else { 
				$("#stream").append(newitem);
			}
		}


	}


}(this.jQuery,this,this.document));










