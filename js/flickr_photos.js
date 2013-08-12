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
	var granularity; 
	var initDate;
	var endDate;
	var photos;
	var currentPhoto; // stores the number of photos that have been processed
	var histogram; // each position of this array will contain a sorted array of the pictures that belong to each bin	
	var callbackOnFinish;
	var userId;
	
	function init(userId, photoInitDate, photoEndDate, callback, binsGranularity) {		
		currentPhoto = 0;
		photos = [];
		userId = this.userId;
		initDate = photoInitDate;
		endDate = photoEndDate;
		granularity = (binsGranularity == undefined) ? constants.default_granularity : binsGranularity;
		callbackOnFinish = callback;
		searchPhotos(1, onPageLoaded);		
	}

	function setGranularity(value) {
		granularity = value;
	}

	function onPageLoaded(data) {
		console.log(photos)
		console.log(data)
		
		photos = photos.concat(data.photos.photo)

	    console.log("Length: " + photos.length)

	    if (data.photos.page < data.photos.pages)
	    	searchPhotos(data.photos.page + 1, onPageLoaded);
	    else {
	    	//getPhotosMetadata()
	    	for (var i = 0; i<photos.length; i++) {
	    		photo = photos[i];
	    		console.log(photo)
	    		console.log("Date: " + photo.datetaken)
	    		photo.date = flickrDateToDate(photo.datetaken);	    		
	    	}
	    	photos.sort(function(a,b) {
	    		return a.date - b.date;
	    	});
	    	getDataStructure();
	    }
	}

	function searchPhotos(numPage, callback) {
		$.get(
			    "http://api.flickr.com/services/rest/",
			    {
			    	//oauth_nonce : 89601180, 
			    	method : 'flickr.photos.search',
			    	api_key : '4aa644ee462a328d852a34e4a0fe7855',
			    	user_id : userId,
			    	min_taken_date : initDate,
			    	max_taken_date : endDate,
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
 		histogram = [];	
 		var currentArray = [];
 		var lastDate = getTimeValue(photos[0].date);

 		for (var i = 0; i<photos.length; i++) {
 			currentDateValue = getTimeValue(photos[i].date)
 			
 			if (currentDateValue == lastDate) {
 				console.log("Adding photo " + photos[i].id + " with date " + photos[i].date + " to bin " + currentDateValue)
 				currentArray.push(photos[i]);
 				console.log("Current array has now " + currentArray.length + " values")
 			} else {
 				// first array always go to first position without filling gaps
 				console.log("Found a new identifier " + currentDateValue + " different from " + lastDate);
 				histogram.push(currentArray);
 				fillGaps(lastDate, currentDateValue);
 				console.log("Histgram has now " + histogram.length + " values");
 				lastDate = currentDateValue;
 				console.log("Adding photo " + photos[i].id + " with date " + photos[i].date + " to bin " + currentDateValue)
 				currentArray = [];
 				currentArray.push(photos[i]);
 			}	
		}
		histogram.push(currentArray);
		//draw();
		getPhotosColors();
 	}

 	/**
 	* This functions fills the "histogram" with empty arrays if there are some hours/days/weeks/months with no pictures
 	**/
 	function fillGaps(lastDate, currentDateValue) {
 		console.log("Filling gaps between " + lastDate + " and " + currentDateValue);
 		diff = currentDateValue - lastDate;

 		for (var i = 1; i<diff; i++) {
 			console.log("Added one gap");
 			histogram.push([]);
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

 		switch(granularity)
		{
			case 0: // hours					
				return tmpDate.getTime() / 3600000;
			case 1: // days
				tmpDate.setHours(0);
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
 		for (var i = 0; i<histogram.length; i++) {
 			picsArray = histogram[i];
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


