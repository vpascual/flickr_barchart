var constants = {
		'main_url' : 'url_l',
		'num_photos_per_page' : 20,
		'default_granularity' : 1
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
	var photos = [];
	var currentPhoto = 0; // stores the number of photos that have been processed
	var histogram = []; // each position of this array will contain a sorted array of the pictures that belong to each bin	
	
	function init(photoInitDate, photoEndDate, binsGranularity) {
		initDate = photoInitDate;
		endDate = photoEndDate;
		granularity = binsGranularity;

		searchPhotos(1, onPageLoaded);		
	}	

	function onPageLoaded(data) {
		console.log(photos)
		console.log(data)
		
		photos = photos.concat(data.photos.photo)

	    console.log("Length: " + photos.length)

	    if (data.photos.page < 2/*data.photos.pages*/)
	    	searchPhotos(data.photos.page + 1, onPageLoaded);
	    else {
	    	//getPhotosMetadata()
	    	for (var i = 0; i<photos.length; i++) {
	    		photo = photos[i];
	    		console.log(photo)
	    		console.log("Date: " + photo.datetaken)
	    		photo.date = flickrDateToDate(photo.datetaken);	    		
	    	}
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
			    	user_id : '12001399@N05',
			    	min_taken_date : initDate,
			    	max_taken_date : endDate,
			    	per_page : constants.num_photos_per_page,
			    	sort : 'date-posted-asc',
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
    	date = new Date(day[0], day[1], day[2], hour[0], hour[1], hour[2]);
    	return date;
 	}

 	function getDataStructure() {
 		var lastDate = -1; 		
 		var currentArray = [];
 		var lastBinIdentifier = getGranularityValue(photos[0].date);

 		for (var i = 0; i<photos.length; i++) {
 			currentPhotoIdentifier = getGranularityValue(photos[i].date)
 			
 			if (currentPhotoIdentifier == lastBinIdentifier) {
 				console.log("Adding photo " + photos[i].id + " with date " + photos[i].date + " to bin " + currentPhotoIdentifier)
 				currentArray.push(photos[i]);
 				console.log("Current array has now " + currentArray.length + " values")
 			} else { 				
 				console.log("Found a new identifier " + currentPhotoIdentifier + " different from " + lastBinIdentifier);
 				histogram.push(currentArray);
 				console.log("Histgraom has now " + histogram.length + " values");
 				lastBinIdentifier = currentPhotoIdentifier;
 				console.log("Adding photo " + photos[i].id + " with date " + photos[i].date + " to bin " + currentPhotoIdentifier)
 				currentArray = [];
 				currentArray.push(photos[i]);
 			}	
		}
		histogram.push(currentArray);
		//draw();
		getPhotosColors();
 	}

 	/**
 	*	This could also be solved with the granularity param: http://www.flickr.com/services/api/misc.dates.html
 	* 	Nevertheless this param doesn't allow the "week" granularity so decided to do it by myself creating the  	"date!" parameter in the "photo" object
 	**/
 	function getGranularityValue(date) {
 		switch(granularity)
			{
				case 0: // hours
					console.log("Current granularity value: " + String(date.getMonth) + String(date.getDay()) + date.getHours());
					return String(date.getMonth) + String(date.getDay()) + String(date.getHours());
				case 1: // days
					console.log("Current granularity value: " + String(date.getMonth()) + String(date.getDay()));
					return String(date.getMonth()) + String(date.getDay());
				case 2: // weeks
					console.log("Current granularity value: " + getWeekNumber(date));
					return getWeekNumber(date);
				case 3: // months
					console.log("Current granularity value: " + date.getYear() + date.getMonth());
					return date.getYear() + date.getMonth();
				default:
					console.log("Return default granularity value: " + String(date.getMonth()) + String(date.getDay()));
					return String(date.getMonth()) + String(date.getDay());
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
	    // Return array of year and week number
	    return weekNo;
	}
 	
 	function getPhotosColors() {

 	}

