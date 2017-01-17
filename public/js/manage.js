var LoadedEvents;
var LoadedPrayers;
var LoadedBlogs;
var LoadedUsers;
var LoadedNotifications;
var EventFilter = 1;
var PrayerFilter = 1;
var DataManager = new DataManager();
var months = {
	January:0,
	February:1,
	March:2,
	April:3,
	May:4, 
	June:5,
	July:6,
	August:7,
	September:8,
	October:9,
	November:10,
	December:11
}

$(document).ready(function(){
	$(document).on("receivedEvents", function(event, param1, param2){
		buildEvents(param1, param2);
	});
	$(document).on("receivedPrayers", function(event, prayers, filter){
		buildPrayers(prayers, filter);
	});
	$(document).on("receivedBlogs", function(event, blogs){
		buildBlogs(blogs);
	});
	$(document).on("receivedNotifications", function(event, notifications){
		buildNotifications(notifications);
	});
	$(document).on("input-error", function(event, message){
		console.log(message)
		Materialize.toast(message, 4000,"red");
	});
	$(document).on("added-event", function(event, message){
		Materialize.toast("Successfully added an event!", 4000, "green")
	})
	$(document).on("added-blog", function(event, message){
		Materialize.toast("Successfully added a blog!", 4000, "green")
	})
	$(document).on("added-notification", function(event, message){
		$("#notification-spinner").removeClass("active")
		Materialize.toast("Successfully added a notification!", 4000, "green")
	})
	$(document).on("edited-event", function(event, message){
		Materialize.toast("Successfully edited an event!", 4000, "green")
	})
	$(document).on("edited-blog", function(event, message){
		Materialize.toast("Successfully edited an blog!", 4000, "green")
	})
	$(document).on("deleted-event", function(event){
		Materialize.toast("Successfully deleted an event!", 4000, "green");
	})
	$(document).on("deleted-prayer", function(event){
		Materialize.toast("Successfully deleted a prayer!", 4000, "green");
	})
	$(document).on("deleted-notification", function(event){
		Materialize.toast("Successfully deleted a notification!", 4000, "green");
	})
	$(document).on("deleted-blog", function(event){
		Materialize.toast("Successfully deleted a blog!", 4000, "green");
	})
	$(document).on("synced-calendar", function(event){
		Materialize.toast("Successfully synced with the Google Calendar!", 4000, "green");
	})

	$("#filter-all-events").on("click", function(){
		EventFilter = 0;
		buildEvents(LoadedEvents,0);
		$("#event-filter-label").html("All Events");
	})
	$("#filter-future-events").on("click", function(){
		EventFilter =1;
		buildEvents(LoadedEvents,1);
		$("#event-filter-label").html("Future Events");
	})
	$("#filter-past-events").on("click", function(){
		EventFilter = 2;
		buildEvents(LoadedEvents,2);
		$("#event-filter-label").html("Past Events");
	})
	$("#filter-all-prayers").on("click", function(){
		PrayerFilter = 0;
		buildPrayers(LoadedPrayers,0);
		$("#prayer-filter-label").html("All Prayers");
	})
	$("#filter-active-prayers").on("click", function(){
		PrayerFilter =1;
		buildPrayers(LoadedPrayers,1);
		$("#prayer-filter-label").html("Active Prayers");
	})
	$("#filter-inactive-prayers").on("click", function(){
		PrayerFilter = 2;
		buildPrayers(LoadedPrayers,2);
		$("#prayer-filter-label").html("Past Prayers");
	})
	$(document).on("click","#google_sync", function(){
		syncCalendar();
	})
	$(document).on("click",".delete-prayer",function(){
		console.log("clicked delete prayer");
		if(confirm("Are you sure you want to delete this prayer request?")){
			deletePrayer(LoadedPrayers[$(this).index()].id);
		}
	})
	$(document).on("click",".edit-blog",function(){
		var blogContainer = $(this).parent().parent().parent()
		var index = blogContainer.index();
		var blog = LoadedBlogs[index];
		blog.title = blogContainer.find(".blog_title").val()
		var date_text = blogContainer.find(".blog_date").val();
		var date_split = date_text.split(/[ ,]+/).join(',').split(",");
    	var date = new Date(date_split[2], months[date_split[1]], date_split[0])
    	console.log(date)
		blog.date = date
		blog.text = blogContainer.find(".blog_text").val();
		blog.author = blogContainer.find(".blog_author").val();
		editBlog(blog);

	})
	$(document).on("click",".delete-blog",function(){
		console.log("clicked delete blog");
		if(confirm("Are you sure you want to delete this blog?")){
			deleteBlog(LoadedBlogs[$(this).index()].id);
		}
	})
	$(document).on("click",".add-blog",function(){
		var blogContainer = $(this).parent().parent().parent()
		var blog = new Blog("","","","","")
		blog.title = blogContainer.find(".blog_title").val()
		var date_text = blogContainer.find(".blog_date").val();
		var date_split = date_text.split(/[ ,]+/).join(',').split(",");
    	var date = new Date(date_split[2], months[date_split[1]], date_split[0])
    	console.log(date)
		blog.date = date
		blog.text = blogContainer.find(".blog_text").val();
		blog.author = blogContainer.find(".blog_author").val();
		addBlog(blog);
	})

	$(document).on("click", ".edit-event", function(){
		var eventContainer = $(this).parent().parent().parent().parent().parent();
		var index = eventContainer.index() - 1;
		var event = LoadedEvents[index];
		event.title = eventContainer.find(".event_title").val();
		event.location = eventContainer.find(".event_location").val();
		event.description = eventContainer.find(".event_description").val();
		var date_text = eventContainer.find(".event_date").val();
    	var date_hour = eventContainer.find(".event_hour").val();
    	
    	if(date_hour<0 || date_hour > 23){
    		$(document).trigger("input-error", ["The event date hour must be between 0 and 23. Could not edit this event!"]);
    		return;
    	}
    	var date_minute = eventContainer.find(".event_minute").val();
    	if(date_minute<0 || date_minute > 60){
    		$(document).trigger("input-error", ["The event date minute must be between 0 and 60. Could not edit this event!"]);
    		return;
    	}
    	var date_split = date_text.split(/[ ,]+/).join(',').split(",");
    	var date = new Date(date_split[2], months[date_split[1]], date_split[0], date_hour, date_minute, 0, 0 )
    	date.setHours(date.getHours())
    	event.date = date;
    	console.log(event);
    	if(validateEvent(event)){
    		var id=event.id
    		var eventData = JSON.stringify({id: event.id, title: event.title, location: event.location, description: event.description, date: event.date.toISOString()});
    		$.ajax({
				url: "/events",
				headers:{
					"Content-Type":"application/json"
				},
				data: eventData,
				datatype: 'application/json',
				success: function(data){
					getEvents();
					$(document).trigger("edited-event");
				},
				type: 'PUT'
			});
    	}
    	else return;
    })

    $(document).on("click", "#add-notification", function(){
    	$("#notification-spinner").addClass("active")
    	var text = $("#new_notification").val();
    	var date = new Date();
    	date.setHours(date.getHours()-5)
    	var notification = DataManager.createNotification(0, text,date);
    	var push = $("#push").is(":checked")
    	if(confirm("Are you sure you want to add this notification? It will be sent to all users of the UNC Wesley App.")==true){
    		addNotification(notification, push);
    	}
    })

    $(document).on("click",".delete-event", function(){
    	console.log("clicked delete event");
    	var eventContainer = $(this).parent().parent().parent().parent().parent()
		var index = eventContainer.index() - 1;
		console.log(eventContainer, index)
		if(confirm("Are you sure you want to delete this event?")==true){
			deleteEvent(LoadedEvents[index].id);
		}
	})

	$(document).on("click",".add-event", function(e){
		var eventContainer = $(this).parent().parent().parent();
		var event = new Event("", "","","","","");
		event.title = eventContainer.find(".event_title").val();
		event.location = eventContainer.find(".event_location").val();
		event.description = eventContainer.find(".event_description").val();
		var date_text = eventContainer.find(".event_date").val();
    	var date_hour = eventContainer.find(".event_hour").val();
    

    	if(date_hour<0 || date_hour > 23){
    		$(document).trigger("input-error", ["The event date hour must be between 0 and 23. Could not edit this event!"]);
    		return;
    	}
    	var date_minute = eventContainer.find(".event_minute").val();
    	if(date_minute<0 || date_minute > 60){
    		$(document).trigger("input-error", ["The event date minute must be between 0 and 60. Could not edit this event!"]);
    		return;
    	}
    	var date_split = date_text.split(/[ ,]+/).join(',').split(",");
    	var date = new Date(date_split[2], months[date_split[1]], date_split[0], date_hour, date_minute, 0, 0 )
    	date.setHours(date.getHours()-5)
    	event.date = date;
    	if(validateEvent(event)){
    		var id=event.id
    		var eventData = JSON.stringify({title: event.title, location: event.location, description: event.description, date: event.date.toISOString()});
    		$.ajax({
				url: "/events",
				headers:{
					"Content-Type":"application/json"
				},
				data: eventData,
				datatype: 'application/json',
				success: function(data){
					getEvents();
					$(document).trigger("added-event");
				},
				type: 'POST'
			});
    	}
    	else return;
	})
	$(document).on("click", ".delete-notification", function(event){
		var notificationContainer = $(this).parent().parent().parent()
		console.log(notificationContainer)
		var index = notificationContainer.index()
		console.log("delete notification", index)
		if(confirm("Are you sure you want to delete this notification?")==true){
			deleteNotification(LoadedNotifications[index].id);
		}
	})
	
	getEvents();
	getPrayers();
	getBlogs();
	getNotifications();

})

function validateEvent(event){
    if(event.title.length<1 || event.title.length > 40){
    	$(document).trigger("input-error", ["There was an error with the event title. Could not edit this event!"]);
    	return false;
   	}
    if(event.location.length<1 || event.location.length > 40){
    	$(document).trigger("input-error", ["There was an error with the event location. Could not edit this event!"]);
    	return false;
   	}
    if(event.description.length<1 || event.description.length > 1000){
    	$(document).trigger("input-error", ["There was an error with the event description. Could not edit this event!"]);
    	return false;
    }
    return true;
}

var syncCalendar = function(){
	 $.ajax({
		url: "/calendar",
		headers:{
			"Content-Type":"application/json"
		},
		datatype: 'application/json',
		success: function(data){
			var response = data
			//var response = JSON.parse(data)
			console.log(response)
			if(response.url){
				$('#authenticate_modal').show()
				$("#google_url").attr("href", response.url)
				return
			}
			console.log("successfully synced calendar")
			getEvents();
			$(document).trigger("synced-calendar");
		},
		type: 'GET'
	});
}

var addBlog = function(blog){
    var blogData = JSON.stringify({title: blog.title, text: blog.text, author: blog.author, date: blog.date.toISOString()});
    $.ajax({
		url: "/blogs",
		headers:{
			"Content-Type":"application/json"
		},
		data: blogData,
		datatype: 'application/json',
		success: function(data){
			getBlogs();
			$(document).trigger("added-blog");
		},
		type: 'POST'
	});
}

var addNotification = function(notification, push){
	console.log("send push notification", push)
	var notificationData = JSON.stringify({text: notification.text, date: notification.date.toISOString(), push: push});
    $.ajax({
		url: "/notifications",
		headers:{
			"Content-Type":"application/json"
		},
		data: notificationData,
		datatype: 'application/json',
		success: function(data){
			getNotifications();
			$(document).trigger("added-notification");
			$("#new_notification").val("")
		},
		type: 'POST'
	});
}

var deleteNotification = function(id){
	var deleteData = JSON.stringify({id: id});
	$.ajax({
			url: "/notifications",
			datatype: 'application/json',
			headers:{
				"Content-Type":"application/json"
			},
			data: deleteData,
			success: function(data){
				getNotifications();
				$(document).trigger("deleted-notification");
			},
			type: 'DELETE'
		});
}

var deleteBlog = function(blogID){
	var deleteData = JSON.stringify({id: blogID});
	console.log(deleteData);
	$.ajax({
			url: "/blogs",
			datatype: 'application/json',
			headers:{
				"Content-Type":"application/json"
			},
			data: deleteData,
			success: function(data){
				getBlogs();
				$(document).trigger("deleted-blog");
			},
			type: 'DELETE'
		});
}

var editBlog = function(blog){
    var blogData = JSON.stringify({id: blog.id, title: blog.title, text: blog.text, author: blog.author, date: blog.date.toISOString()});
    $.ajax({
		url: "/blogs",
		headers:{
			"Content-Type":"application/json"
		},
		data: blogData,
		datatype: 'application/json',
		success: function(data){
			getBlogs();
			$(document).trigger("edited-blog");
		},
		type: 'PUT'
	});
}

var getNotifications = function(){
	$.ajax({
			url: "/notifications",
			datatype: 'jsonp',
			success: function(data){
				console.log(data)
				notifications = [];
				for(var i=0; i<data.length; i++){
					var date = new Date(data[i].date);
					date.setHours(date.getHours()+5)
					notifications.push(DataManager.createNotification(data[i].id, data[i].text, date));
				}
				LoadedNotifications = notifications;
				$(document).trigger("receivedNotifications", [LoadedNotifications]);
			},
			type: 'GET'
		});
}
var getEvents = function(){
	
	$.ajax({
			url: "/events",
			data: {date: "1970-01-01 00:00:01"},
			success: function(data){
				console.log(data)
				events = [];
				for(var i=0; i<data.length; i++){
					var date = new Date(data[i].date);
					//date.setHours(date.getHours())
					events.push(DataManager.createEvent(data[i].id, data[i].title, date, data[i].image, data[i].description, data[i].location));
				}
				LoadedEvents = events;
				$(document).trigger("receivedEvents", [LoadedEvents, EventFilter]);
			},
			type: 'GET'
		});
}

var getPrayers = function(){
	$.ajax({
			url: "/prayers",
			data: {date: "1970-01-01 00:00:01"},
			success: function(data){
				console.log(data);
				prayers = [];
				for(var i=0; i<data.length; i++){
					var date = new Date(data[i].date);

					prayers.push(DataManager.createPrayer(data[i].id, date, data[i].content, data[i].fname, data[i].lname));
				}
				LoadedPrayers = prayers;
				$(document).trigger("receivedPrayers", [LoadedPrayers, PrayerFilter]);
			},
			type: 'GET'
		});
}
var getBlogs = function(){
	$.ajax({
			url: "/blogs",
			datatype: 'jsonp',
			success: function(data){
				blogs = [];
				for(var i=0; i<data.length; i++){
					var date = new Date(data[i].date);
					blogs.push(DataManager.createBlog(data[i].id, data[i].text, data[i].author, date, data[i].title));
				}
				LoadedBlogs = blogs;
				$(document).trigger("receivedBlogs", [LoadedBlogs]);
			},
			type: 'GET'
		});
}

var deleteEvent = function(eventID){
	var deleteData = JSON.stringify({id: eventID});
	console.log(deleteData);
	$.ajax({
			url: "/events",
			datatype: 'application/json',
			headers:{
				"Content-Type":"application/json"
			},
			data: deleteData,
			success: function(data){
				getEvents();
				$(document).trigger("deleted-event");
			},
			type: 'DELETE'
		});
}

var deletePrayer = function(prayerID){
	var deleteData = JSON.stringify({id: prayerID});
	console.log(deleteData);
	$.ajax({
			url: "/prayers",
			datatype: 'application/json',
			headers:{
				"Content-Type":"application/json"
			},
			data: deleteData,
			success: function(data){
				getPrayers();
				$(document).trigger("deleted-prayer");
			},
			type: 'DELETE'
		});
}

var buildNotifications = function(notifications){
	console.log("build notifications:", notifications)
	$("#notification-collection").empty();
	var element, header, body, row;
	for(var i=0; i<notifications.length;i++){
		var notification = notifications[i];
		element = $("<li class='collection-item blue-grey lighten-5'></li>");
		element.append("<div class='row'><h3 class='col s10'>"+ $.datepicker.formatDate("dd MM, yy", notification.date)+"</h3><div class='col s2 center-align'><a class='btn-floating btn-small waves-effect waves-light red valign delete-notification'><i class='material-icons'>delete</i></a></div></div>");
		element.append("<p>"+notification.text+"</p>");
		$("#notification-collection").append(element);
	}
}

var buildBlogs = function(blogs, filter){
	console.log("build blogs:", blogs)
	$("#blog-collection").empty();
	var element, header, body, row;
	for(var i=0; i<blogs.length;i++){
		var blog = blogs[i];
		element = $("<li class='collection-item blue-grey lighten-5'></li>");
		container = $("<div class='container'></div>")
		row1 = $("<div class='row valign-wrapper'></div>");
		row2 = $("<div class='row valign-wrapper'></div>");
		row3 = $("<div class='row valign-wrapper'></div>");
		header = $("<div class='collapsible-header'><i class='material-icons'>mode_edit</i>"+blog.title+"</div>")
		body = $("<div class='collapsible-body'></div>");
		row1.append("<div class='input-field center-align'><input type='text' class='blog_title' value='"+blog.title+"'><label for='blog_title'>Title</label></div>");
		row1.append("<div class='input-field'><input type='text' class='datepicker valign blog_date' value='"+ $.datepicker.formatDate("dd MM, yy",blog.date)+"'><label for='blog_date'>Date</label></div>");
		row1.append("<div class='input-field center-align'><input type='text' class='blog_author' value='"+blog.author+"'><label for='blog_author'>Author</label></div>")
		row2.append("<div class='input-field col s12'><label for='blog_text'>Text</label><textarea class='materialize-textarea blog_text' id='textarea"+i+"''></textarea></div>")
		row3.append("<div class='col s2 center-align'><a class='btn-floating btn-small waves-effect waves-light blue valign edit-blog right-align'><i class='material-icons'>input</i></a></div>")
		row3.append("<div class='col s2 center-align'><a class='btn-floating btn-small waves-effect waves-light red valign delete-blog left-align'><i class='material-icons'>delete</i></a></div>")
		container.append(row1, row2, row3);
		body.append(container);
		element.append(header, body);
		$("#blog-collection").append(element);
		$("#textarea"+i).val(blog.text)
		$("#textarea"+i).trigger("autoresize")

	}
	element = $("<li class='collection-item blue-grey lighten-5'></li>");
	container = $("<div class='container'></div>")
	row1 = $("<div class='row valign-wrapper'></div>");
	row2 = $("<div class='row valign-wrapper'></div>");
	row3 = $("<div class='row valign-wrapper'></div>");
	header = $("<div class='collapsible-header'><i class='material-icons'>add</i></div>")
	body = $("<div class='collapsible-body'></div>");
	row1.append("<div class='input-field center-align'><input type='text' class='blog_title'><label for='blog_title'>Title</label></div>");
	row1.append("<div class='input-field'><input type='text' class='datepicker valign blog_date'><label for='blog_date'>Date</label></div>");
	row1.append("<div class='input-field center-align'><input type='text' class='blog_author'><label for='blog_author'>Author</label></div>")
	row2.append("<div class='input-field col s12'><label for='blog_text'>Text</label><textarea class='materialize-textarea blog_text'></textarea></div>")
	row3.append("<div class='col s2 center-align'><a class='btn-floating btn-small waves-effect waves-light blue valign add-blog right-align'><i class='material-icons'>add</i></a></div>")
	container.append(row1, row2, row3);
	body.append(container);
	element.append(header, body);
	$("#blog-collection").prepend(element);
	$('select').material_select();
	Materialize.updateTextFields();
	$('.datepicker').pickadate({
    	selectMonths: true, // Creates a dropdown to control month
    	selectYears: 15 // Creates a dropdown of 15 years to control year
  	});
  	$('.collapsible').collapsible();
}


/*	Takes an array of events objects to build into the list
	and an int filter code:
		0 - all prayers
		1 - only active prayers
		2 - only past events
*/
var buildPrayers = function(prayers, filter){
	console.log("build prayers:", prayers)
	var today = new Date()
	$("#prayer-collection").empty();
	var element, header, body, row;
	var vailid = false;
	for(var i=0; i<prayers.length;i++){
		let prayer = prayers[i];
		let date = prayer.date;
		var cutoffDate = date;
		cutoffDate.setDate(prayer.date.getDay()+14)
		console.log(cutoffDate.getTime())
		//Filter by the provided code
		switch(filter){
			case 0:
				valid = true;
				break;
			case 1:
				if(cutoffDate.getTime() > today.getTime()){valid = true;}
				else{valid=false;}
				break;
			case 2:
				if(cutoffDate.getTime() < today.getTime()){valid = true;}
				else{valid = false;}
				break;
			default:
				break;
		}
		if(!valid) continue;

		element = $("<li class='collection-item blue-grey lighten-5'></li>");
		row1 = $("<div class='row valign-wrapper'></div>");
		row2 = $("<div class='row'></div>");
		row3 = $("<div class='row valign-wrapper'></div>");
		row1.append("<h3>"+prayer.fname+ " " + prayer.lname+"<h3>");
		row2.append("<p class='grey-text'>"+ prayer.date.toDateString() + "</p>")
		row3.append("<p>" + prayer.content + "</p>");
		row1.append("<div class='col s2 center-align'><a class='btn-floating btn-small waves-effect waves-light red valign delete-prayer left-align'><i class='material-icons'>delete</i></a></div>")

		element.append(row1, row2, row3);
		$("#prayer-collection").append(element);
	}
}

/*	Takes an array of events objects to build into the list
	and an int filter code:
		0 - all events
		1 - only future events
		2 - only past events
*/
var buildEvents = function(events, filter){
	var today = new Date()
	$("#event-collection").empty();
	var element, header, body, row;
	for(var i=0; i<events.length;i++){
		var vailid = false;
		let event = events[i];

		//Filter by the provided code
		switch(filter){
			case 0:
				valid = true;
				break;
			case 1:
				if(event.date.getTime() > today.getTime()){valid = true;}
				else{valid=false;}
				break;
			case 2:
				if(event.date.getTime() < today.getTime()){valid = true;}
				else{valid = false;}
				break;
			default:
				break;
		}
		if(!valid) continue;

		element = $("<li id='event_container_"+event.id+"'></li>");
		header = $("<div class='collapsible-header'><i class='material-icons'>today</i>"+event.title+"</div>")
		body = $("<div class='collapsible-body'></div>");
		container = $("<div class='container'></div>");
		row1 = $("<div class='row valign-wrapper'></div>");
		row2 = $("<div class='row valign-wrapper'></div>");
		container.append("<div class='input-field center-align'><input type='text' class='event_title' value='"+event.title+"'><label for='new_event_name'>Name</label></div>")
		container.append("<div class='input-field center-align'><input type='text' class='event_location' value='"+event.location+"'><label for='new_location'>Location</label></div>")
		container.append("<div class=input-field><label>Description</label><textarea class='materialize-textarea event_description' id='event_description_"+event.id+"'></textarea></div>");
		row1.append("<div class='input-field'><input type='text' class='datepicker valign event_date' value='"+ $.datepicker.formatDate("dd MM, yy",event.date)+"'><label for='new_event_date_"+event.id+"'>Date</label></div>");
		row1.append("<div class='input-field center-align valign'><input type='number' class='event_hour' value='"+event.date.getHours()+"'><label>Starting Hour</label></div>")
		row1.append("<div class='input-field center-align valign'><input type='number' class='event_minute' value='"+event.date.getMinutes()+"'><label>Starting Minute</label></div>")
		row2.append("<div class='col s2 center-align'><a class='btn-floating btn-small waves-effect waves-light blue valign edit-event right-align' id='edit_event_"+event.id+"'><i class='material-icons'>input</i></a></div>")
		row2.append("<div class='col s2 center-align'><a class='btn-floating btn-small waves-effect waves-light red valign delete-event left-align' id='delete_event_"+event.id+"'><i class='material-icons'>delete</i></a></div>")
		container.append(row1, row2);
		body.append(container);
		header.addClass("blue-grey lighten-5");
		element.append(header, body);
		$("#event-collection").append(element);
		$('#event_description_'+event.id).val(event.description);
  		$('#event_description_'+event.id).trigger('autoresize');
	}

	element = $("<li id='add_event_container'></li>");
	header = $("<div class='collapsible-header green-text'><i class='material-icons'>add</i>Add Event</div>")
	body = $("<div class='collapsible-body'></div>");
	row1 = $("<div class='row valign-wrapper'></div>");
	row2 = $("<div class='row valign-wrapper'></div>");
	container = $("<div class='container'></div>")
	container.append("<div class='input-field center-align'><input class='event_title' type='text'><label for='add_event_name'>Name</label></div>")
	container.append("<div class='input-field center-align'><input class = 'event_location' type='text'><label for='add_event_location'>Location</label></div>")
	container.append("<div class=input-field><label for='add_event_description'>Description</label><textarea class='materialize-textarea event_description' id='add_event_description'></textarea></div>");
	row1.append("<div class='input-field'><input type='text' class='datepicker valign event_date'><label for='add_event_date'>Date</label></div>");
	row1.append("<div class='input-field center-align valign'><input class='event_hour' type='number'><label>Starting Hour</label></div>")
	row1.append("<div class='input-field center-align valign'><input class='event_minute' type='number'><label>Starting Minute</label></div>")
	row2.append("<div class='col s2'><a class='btn-floating btn-small waves-effect waves-light blue valign add-event'><i class='material-icons'>add</i></a></div>");
	container.append(row1, row2);
	body.append(container)
	header.addClass("blue-grey lighten-5")
	element.append(header, body);
	$("#event-collection").prepend(element);
	$('select').material_select();
	Materialize.updateTextFields();
	$('.datepicker').pickadate({
    	selectMonths: true, // Creates a dropdown to control month
    	selectYears: 15 // Creates a dropdown of 15 years to control year
  	});
}