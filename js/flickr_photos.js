var constants = {
		'main_url' : 'url_l',
		'num_photos_per_page' : 500,
		'default_granularity' : 1,
		'hours' : 0,
		'days' : 1,
		'weeks' : 2,
		'months' : 3
	}
	/*
		0 - Hours
		1 - Days
		2 - Weeks
		3 - Months
	*/
	//var granularity; 
	/*var initDate;
	var endDate;
	var photos;
	var histogram; // each position of this array will contain a sorted array of the pictures that belong to each bin	
	var callbackOnFinish;
	var userId;*/

	var callbackOnFinish;

	function getIdFromUserName(username, callback) {
		$.get(
			    "http://api.flickr.com/services/rest/",
			    {
			    	//oauth_nonce : 89601180, 
			    	method : 'flickr.people.findByUsername',
			    	api_key : '4aa644ee462a328d852a34e4a0fe7855',
			    	username : username,
			    	format : 'json',
			    	nojsoncallback : 1
			    }, 
			    callback);
	}
	
	function init(userId, photoInitDate, photoEndDate, callback, binsGranularity) {		
		globalVars.photos = [];
		//granularity = (binsGranularity == undefined) ? constants.default_granularity : binsGranularity;
		callbackOnFinish = callback;
		searchPhotos(1, onPageLoaded);		
	}

	function onPageLoaded(data) {
		console.log(globalVars.photos)
		console.log(data)
		
		globalVars.photos = globalVars.photos.concat(data.photos.photo)

	    console.log("Length: " + globalVars.photos.length)

	    if (data.photos.page < data.photos.pages)
	    	searchPhotos(data.photos.page + 1, onPageLoaded);
	    else {
	    	//getPhotosMetadata()
	    	for (var i = 0; i<globalVars.photos.length; i++) {
	    		photo = globalVars.photos[i];
	    		console.log(photo)
	    		console.log("Date: " + photo.datetaken)
	    		photo.date = flickrDateToDate(photo.datetaken);	    		
	    	}
	    	globalVars.photos.sort(function(a,b) {
	    		return a.date - b.date;
	    	});
	    	getDataStructure();
	    }
	}

	function searchPhotos(numPage, callback) {
		console.log("Searching pics between " + globalVars.initDate + " and " + globalVars.endDate);
		$.get(
			    "http://api.flickr.com/services/rest/",
			    {
			    	//oauth_nonce : 89601180, 
			    	method : 'flickr.photos.search',
			    	api_key : '4aa644ee462a328d852a34e4a0fe7855',
			    	user_id : globalVars.userId,
			    	min_taken_date : globalVars.initDate,
			    	max_taken_date : globalVars.endDate,
			    	per_page : constants.num_photos_per_page,
			    	sort : 'date-taken-asc',
			    	extras : 'date_taken, original_format, geo, date_taken, original_format, geo, url_sq, url_t, url_s, url_q, url_m, url_n, url_z, url_c, url_l, url_o',
			    	page : numPage,
			    	format : 'json',
			    	nojsoncallback : 1
			    }, 
			    callback);
	}

 	function flickrDateToDate(datetaken) {
 		var splitDate = datetaken.split(' ');
    	day = splitDate[0].split('-');
    	hour = splitDate[1].split(':');
    	// months start at 0, so Febrruary is month 1
    	date = new Date(day[0], parseInt(day[1])-1, day[2], hour[0], hour[1], hour[2]);
    	return date;
 	}

 	function getDataStructure() { 	
 		globalVars.histogram = [];	
 		var currentArray = [];
 		var lastDate = getTimeValue(globalVars.photos[0].date);

 		for (var i = 0; i<globalVars.photos.length; i++) {
 			currentDateValue = getTimeValue(globalVars.photos[i].date)
 			
 			if (currentDateValue == lastDate) {
 				console.log("Adding photo " + globalVars.photos[i].id + " with date " + globalVars.photos[i].date + " to bin " + currentDateValue)
 				currentArray.push(globalVars.photos[i]);
 				console.log("Current array has now " + currentArray.length + " values")
 			} else {
 				// first array always go to first position without filling gaps
 				console.log("Found a new identifier " + currentDateValue + " different from " + lastDate);
 				globalVars.histogram.push(currentArray);
 				fillGaps(lastDate, currentDateValue);
 				console.log("Histgram has now " + globalVars.histogram.length + " values");
 				lastDate = currentDateValue;
 				console.log("Adding photo " + globalVars.photos[i].id + " with date " + globalVars.photos[i].date + " to bin " + currentDateValue)
 				currentArray = [];
 				currentArray.push(globalVars.photos[i]);
 			}	
		}
		globalVars.histogram.push(currentArray);
		//draw();
		getPhotosColors();
 	}

 	/**
 	* This functions fills the "globalVars.histogram" with empty arrays if there are some hours/days/weeks/months with no pictures
 	**/
 	function fillGaps(lastDate, currentDateValue) {
 		console.log("Filling gaps between " + lastDate + " and " + currentDateValue);
 		diff = currentDateValue - lastDate;

 		for (var i = 1; i<diff; i++) {
 			console.log("Added one gap");
 			globalVars.histogram.push([]);
 		}
 	}

 	/**
 	*	This could also be solved with the granularity param: http://www.flickr.com/services/api/misc.dates.html
 	* 	Nevertheless this param doesn't allow the "week" granularity so decided to do it by myself creating the  	"date!" parameter in the "photo" object
 	**/
 	function getTimeValue(date) {
 		tmpDate = new Date();
 		tmpDate.setTime(date.getTime());
 		// set minutes, seconds and milliseconds to 0
 		tmpDate.setMinutes(0);
		tmpDate.setSeconds(0);
		tmpDate.setMilliseconds(0);

 		switch(globalVars.granularity)
		{
			case 0: // hours					
				return tmpDate.getTime() / 3600000;
			case 1: // days
				tmpDate.setHours(0);
				tmpDate.setDate(tmpDate.getDate() - 4);
				return tmpDate.getTime() / 86400000;
			case 2: // weeks
				return Math.floor(tmpDate.getTime() / 604800000);
			case 3: // months
				return tmpDate.getFullYear() * 12 + tmpDate.getMonth();
			default:
				return tmpDate.getTime() / 86400000; // days
		}
 	}

 	/*
 	*	Code taken from http://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
 	*/
	function getWeekNumber(d) {
	    // Copy date so don't modify original
	    d = new Date(d);
	    d.setHours(0,0,0);
	    // Set to nearest Thursday: current date + 4 - current day number
	    // Make Sunday's day number 7
	    d.setDate(d.getDate() + 4 - (d.getDay()||7));
	    // Get first day of year
	    var yearStart = new Date(d.getFullYear(),0,1);
	    // Calculate full weeks to nearest Thursday
	    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)
	    
	    return String(d.getYear()) + String(weekNo);
	}
 	
 	function getPhotosColors() {
 		var colorThief = new ColorThief();

 		/**
			The call to ColorThief.getColor generates the error "Unable to get image data from canvas because the canvas has been tainted by cross-origin data."
			This is a problem of the Same Origin Policy and apparently should be fixed either using jsonp(¿?) or by
			creating a proxy that retrieves the image
 		**/
 		/*
 		for (var i = 0; i<globalVars.histogram.length; i++) {
 			picsArray = globalVars.histogram[i];
 			for (var j = 0; j<picsArray.length; j++) {
	 			img = new Image();
	 			img.src = picsArray[j][constants.main_url];
		 		console.log("img: " + img);
				dominantColor = colorThief.getColor(img);
				// console.log("Dominant color of photo " + picsArray[j][constants.main_url] + ": " + dominantColor)
			}
		}*/
		
		callbackOnFinish();
 	}


