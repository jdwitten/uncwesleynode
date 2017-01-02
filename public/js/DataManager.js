var DataManager = function(){

}


var Event = function(id, title, date, imageURL, description, location){
	this.id = id;
	this.title = title;
	this.date = date;
	this.image = imageURL;
	this.description = description;
	this.location = location
}

var Prayer = function(id, date, content, fname, lname){
	this.id = id;
	this.date = date;
	this.content = content;
	this.fname = fname;
	this.lname = lname;
}

var Blog = function(id, text, author, date, title){
	this.id = id;
	this.text = text;
	this.author = author;
	this.date = date;
	this.title = title;
}

DataManager.prototype.postAPNS = function(tokenString, connection, callback){
	connection.query("INSERT ? INTO tokens", [tokenString], function(err, rows, fields){
		if(!err){
			callback(err, true);
		}else{
			console.log("error inserting apns", err);
			callback(err, false);
		}
	})
}

DataManager.prototype.getAPNS = function(connection, callback){
	connection.query('SELECT * FROM tokens', function(err, rows, fields){
		if(!err){
			tokens = [];
			for(var i=0; i<rows.length; i++){
				tokens.push(rows[i].apns)
			}
			callback(err, tokens);
		}else{
			console.log("Error while performing query");
			callback(err, null);
		}
	})
}

DataManager.prototype.getEvents = function(connection, callback){
	connection.query('SELECT eventID, title, date, imageURL,description, location from events ORDER BY date DESC', function(err, rows, fields) {
      if (!err){
        events = [];
        for(var i=0; i<rows.length; i++){
          events.push(DataManager.prototype.createEvent(rows[i].eventID, rows[i].title, rows[i].date, rows[i].imageURL, rows[i].description, rows[i].location))
        }
        callback(err, events)
      }
      else{
        console.log(err);
        console.log('Error while performing Query.');
        callback(err, null);
      }
    })
}

DataManager.prototype.postEvent = function(event, connection, callback){
	console.log(event);
	connection.query('INSERT INTO events (title, date, imageURL,description, location) VALUES (?,?,?,?,?)', [event.title, event.date, event.image, event.description, event.location],
      function(err, rows, fields) {
        if (!err){
          callback(err, event);
        }
        else{
          console.log('Error while performing Query.');
          console.log(err);
          callback(err, event);
        }
    });
}


DataManager.prototype.createBlog = function(id, text, author, date, title){
	return new Blog(id, text, author, date, title);
}

DataManager.prototype.createEvent = function(id, title, date, imageURL, description, location){
	return new Event(id, title, date, imageURL, description, location);
}

DataManager.prototype.createPrayer = function(id, date, content, fName, lName){
	return new Prayer(id, date, content, fName, lName);
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = DataManager;
  else
    window.DataManager = DataManager;