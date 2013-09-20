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

 		// check if there is a time interval with no pictures
 		interval = getTimeInterval(new Date(globalVars.initDate), globalVars.photos[0].date);
 		console.log("interval between " + new Date(globalVars.initDate) + " and " + globalVars.photos[0].date + " is = " + interval.length);
 		console.log("INterval: " + interval);
 		if (interval.length > 0) 
 			addBlankElementsToArray(globalVars.histogram, interval.length);

 		var currentArray = [globalVars.photos[0]];
 		var currentDate = globalVars.photos[0].date;

 		for (var i = 1; i<globalVars.photos.length; i++) {
 			interval = getTimeInterval(currentDate, globalVars.photos[i].date);
 			if (interval.length == 0) {
 				currentArray.push(globalVars.photos[i]);
 			} else {
 				globalVars.histogram.push(currentArray);
 				// fill with empty arrays when the interval between two dates is bigger than 1
 				addBlankElementsToArray(globalVars.histogram, interval.length - 1);
 				/*for (var j = 1; j<interval.length; j++) {
 					globalVars.histogram.push([]);
 				}*/
 				currentArray = [globalVars.photos[i]];
 				currentDate = globalVars.photos[i].date;
 			}
		}
		globalVars.histogram.push(currentArray);

		interval = getTimeInterval(globalVars.photos[globalVars.photos.length - 1].date, new Date(globalVars.endDate));
		console.log("interval between " + globalVars.photos[globalVars.photos.length - 1].date + " and " + new Date(globalVars.endDate) + " is = " + interval.length);
		console.log("INterval: " + interval);
		if (interval.length > 0)
			addBlankElementsToArray(globalVars.histogram, interval.length - 1);

		getPhotosColors();
 	}

 	function addBlankElementsToArray(array, numOfBlankElements) {
 		console.log("Adding extra " + numOfBlankElements + " to histogram")
 		for (var i = 0; i<numOfBlankElements; i++) 
			globalVars.histogram.push([]);
 	}


 	function getTimeInterval(date1, date2) {
 		switch(globalVars.granularity)
		{
			case 0: // hours					
				return d3.time.hour.range(date1, date2);
			case 1: // days
				return d3.time.day.range(date1, date2);
			case 2: // weeks
				return d3.time.week.range(date1, date2);
			case 3: // months
				return d3.time.month.range(date1, date2);
			default:
				return d3.time.day.range(date1, date2);
		}
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


