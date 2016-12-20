var LoadedEvents;
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
	$(document).on("receivedEvents", function(param1, param2){
		buildEvents(param1, param2);
	});
	$(document).on("input-error"), function(message){
		Materialize.toast(message, 4000, "red");
	}

	$("#filter-all-events").on("click", function(){
		buildEvents(LoadedEvents,0);
		$("#event-filter-label").html("All Events");
	})
	$("#filter-future-events").on("click", function(){
		buildEvents(LoadedEvents,1);
		$("#event-filter-label").html("Future Events");
	})
	$("#filter-past-events").on("click", function(){
		buildEvents(LoadedEvents,2);
		$("#event-filter-label").html("Past Events");
	})
	
	getEvents()

})

var getEvents = function(){
	$.ajax({
			url: "/events",
			datatype: 'jsonp',
			success: function(data){
				console.log(data);
				events = [];
				for(var i=0; i<data.length; i++){
					var date = new Date(data[i].date);
					events.push(DataManager.createEvent(data[i].id, data[i].title, date, data[i].image, data[i].description, data[i].location));
				}
				LoadedEvents = events;
				$(document).trigger("receivedEvents", [LoadedEvents, 1]);
			},
			type: 'GET'
		});
}

/*	Takes an array of events objects to build into the list
	and an int filter code:
		0 - all events
		1 - only future events
		2 - only past events
*/
var buildEvents = function(events, filter){
	var today = new Date()
	console.log(events)
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
		container.append("<div class='input-field center-align'><input id='new_event_name_"+event.id+"' type='text' value='"+event.title+"'><label for='new_event_name'>Name</label></div>")
		container.append("<div class='input-field center-align'><input id='new_event_location_"+event.id+"' type='text' value='"+event.location+"'><label for='new_location'>Location</label></div>")
		container.append("<div class=input-field><label for='new_event_description_"+event.id+"'>Description</label><textarea class='materialize-textarea' id='new_event_description_"+event.id+"'></textarea></div>");
		row1.append("<div class='input-field'><input type='text' class='datepicker valign' id='new_event_date_"+event.id+"' value='"+ $.datepicker.formatDate("dd MM, yy",event.date)+"'><label for='new_event_date_"+event.id+"'>Date</label></div>");
		row1.append("<div class='input-field center-align valign'><input id='new_event_hour_"+event.id+"' type='number' value='"+event.date.getHours()+"'><label>Starting Hour</label></div>")
		row1.append("<div class='input-field center-align valign'><input id='new_event_minute_"+event.id+"' type='number' value='"+event.date.getMinutes()+"'><label>Starting Minute</label></div>")
		row2.append("<div class='col s2 center-align'><a class='btn-floating btn-small waves-effect waves-light blue valign edit-team right-align' id='edit_event_"+event.id+"'><i class='material-icons'>input</i></a></div>")
		row2.append("<div class='col s2 center-align'><a class='btn-floating btn-small waves-effect waves-light red valign delete-team left-align' id='delete_team_"+event.id+"'><i class='material-icons'>delete</i></a></div>")
		container.append(row1, row2);
		body.append(container);
		header.addClass("blue-grey lighten-5");
		element.append(header, body);
		$("#event-collection").append(element);
		$('#new_event_description_'+event.id).val(event.description);
  		$('#new_event_description_'+event.id).trigger('autoresize');
		/*
		$("#edit_team_"+team.id).bind("click",function(){
			console.log("clicked edit team");
    		//var id = $(button).attr("id").split("edit_player_")[1];
    		var name = $("#new_team_name_"+team.id).val();
    		var skillLevel = $("#new_skill_"+team.id).val();
    		var location = $("#new_location_"+team.id).val();
    		updateTeam(team.id, name, skillLevel, location, currentUserId);
		})
		$("#delete_team_"+team.id).bind("click",function(){
			console.log("clicked delete team");
    		//var id = $(button).attr("id").split("edit_player_")[1];
    		testDeleteTeam(team.id);
		})
		*/
	}
	element = $("<li id='add_event_container'></li>");
	header = $("<div class='collapsible-header green-text'><i class='material-icons'>add</i>Add Event</div>")
	body = $("<div class='collapsible-body'></div>");
	row1 = $("<div class='row valign-wrapper'></div>");
	row2 = $("<div class='row valign-wrapper'></div>");
	container = $("<div class='container'></div>")
	container.append("<div class='input-field center-align'><input id='add_event_name' type='text'><label for='add_event_name'>Name</label></div>")
	container.append("<div class='input-field center-align'><input id='add_event_location' type='text'><label for='add_event_location'>Location</label></div>")
	container.append("<div class=input-field><label for='add_event_description'>Description</label><textarea class='materialize-textarea' id='add_event_description'></textarea></div>");
	row1.append("<div class='input-field'><input type='text' class='datepicker valign' id='add_event_date'><label for='add_event_date'>Date</label></div>");
	row1.append("<div class='input-field center-align valign'><input id='add_event_hour' type='number'><label>Starting Hour</label></div>")
	row1.append("<div class='input-field center-align valign'><input id='add_event_minute' type='number'><label>Starting Minute</label></div>")
	row2.append("<div class='col s2'><a class='btn-floating btn-small waves-effect waves-light blue valign add-event' id='add-event'><i class='material-icons'>add</i></a></div>");
	container.append(row1, row2);
	body.append(container)
	header.addClass("blue-grey lighten-5")
	element.append(header, body);
	$("#event-collection").prepend(element);
	$("#add-event").bind("click",function(){
    	var title = $("#add_event_name").val();
    	if(title.length<1 || title.length > 40){
    		$(document).trigger("input-error", ["There was an error with the event title"]);
    		return;
    	}
    	var location = $("#add_event_location").val();
    	if(location.length<1 || location.length > 40){
    		$(document).trigger("input-error", ["There was an error with the event location"]);
    		return;
    	}
    	var description = $("#add_event_description").val();
    	if(description.length<1 || description.length > 40){
    		$(document).trigger("input-error", ["There was an error with the event description"]);
    		return;
    	}
    	var date_text = $("#add_event_date").val();
    	var date_hour = $("#add_event_hour").val();
    	if(date_hour<0 || date_hour > 23){
    		$(document).trigger("input-error", ["The event date hour must be between 0 and 23"]);
    		return;
    	}
    	var date_minute = $("#add_event_minute").val();
    	if(date_minute<0 || date_minute > 60){
    		$(document).trigger("input-error", ["The event date minute must be between 0 and 60"]);
    		return;
    	}
    	var date_split = date_text.split("/[ ,]+/")
    	var date = new Date(date_split[2], months.date_split[1], date_split[0], date_hour, date_minute, 0, 0 )
    	$.ajax({
			url: "/events",
			data: {
				title: title,
				location: location,
				description: description,
				date: date,
				imageURL: imageURL
			},
			datatype: 'jsonp',
			success: function(data){
				getEvents();
			},
			type: 'POST'
		});
	})
	$('select').material_select();
	Materialize.updateTextFields();
	$('.datepicker').pickadate({
    	selectMonths: true, // Creates a dropdown to control month
    	selectYears: 15 // Creates a dropdown of 15 years to control year
  	});
}