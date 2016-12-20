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
DataManager.prototype.createEvent = function(id, title, date, imageURL, description, location){
	return new Event(id, title, date, imageURL, description, location);
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = DataManager;
  else
    window.DataManager = DataManager;