var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var bus = require('./event-bus');
var pool = require('./db-pool');
var manager = require("./DataManager");



var Calendar = function(){

}
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
Calendar.prototype.authorize = function(credentials, res, callback) {
  var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
  /*
  var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
  process.env.USERPROFILE) + '/.credentials/';
  var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';
  */
  var TOKEN_PATH = "token.json"
  var clientSecret = credentials.web.client_secret;
  var clientId = credentials.web.client_id;
  var redirectUrl = credentials.web.redirect_uris[0];
  console.log(redirectUrl)
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      Calendar.prototype.getNewToken(oauth2Client,res, callback);
      return
    } else {
      oauth2Client.setCredentials({
        access_token: JSON.parse(token)
      })
      var token = JSON.parse(token);
      var now = new Date()
      if(token.expiry_date < now.getTime()){
        console.log("get new token")
        Calendar.prototype.getNewToken(oauth2Client, res, callback)
        return
      } 
      oauth2Client.credentials = token;
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
Calendar.prototype.getNewToken = function(oauth2Client, res, callback) {
  var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  var response = {url: authUrl}
  console.log("sending url")
  res.send(response)
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
Calendar.prototype.storeToken = function(token) {
  console.log("storing token")
  var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/';
  var TOKEN_PATH = TOKEN_DIR + 'token.json';
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
Calendar.prototype.listEvents = function(auth) {
  var calendarAPI = google.calendar('v3');
  var calendarList = calendarAPI.calendarList.list({ auth: auth}, function(err, calendarList){
    console.log(calendarList)
    var calendar = calendarList.items[2];
    var calendarID = calendar.id;
    calendarAPI.events.list({
    auth: auth,
    calendarId: calendarID,
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    console.log("The 4th calendar description is:", calendar.description)
    var events = response.items;
    bus.emit("calendarEventsReceived", err, events);
    if (events.length == 0) {
      console.log('No upcoming events found.');
    } else {
      console.log('Upcoming 10 events:');
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var start = event.start.dateTime || event.start.date;
        console.log('%s - %s', start, event.summary);
      }
    }
  });
  })
  
}

/*  sync will pull upcoming events from the google calendar 
 *  and create event objects for them if there
 *  is not already an event at that same time in the database
 *
 * @param auth: google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param existingEvents: future event objects that are already in the db
 * @param callback: a callback function that expects to receive an array of
 * events that are not in the db but are in the calendar
 */
Calendar.prototype.createEventsToSync = function(auth, existingEvents, callback){
  var calendarAPI = google.calendar('v3');
  var calendarList = calendarAPI.calendarList.list({ auth: auth}, function(err, calendarList){
    console.log("error", err)
    console.log(calendarList)
    var calendar = calendarList.items[0];
    var calendarID = calendar.id;
    console.log(calendar)
    var now = new Date()
    var nowMax = new Date()
    nowMax.setDate(now.getDate()+7)
    calendarAPI.events.list({
      auth: auth,
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: nowMax.toISOString(),
      //singleEvents: true,
      //orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return callback(err, null);
    }
    var googleEvents = response.items;
    bus.emit("calendarEventsReceived", err, events);
    if (events.length == 0) {
      console.log('No upcoming events found.');
    } else {
      console.log('Upcoming 10 events:');
      var eventsToSync = []
      var matched = false;
      for (var i = 0; i < googleEvents.length; i++) {
        matched = false;
        var googcalEvent = googleEvents[i];
        var googcalStart = new Date(googcalEvent.start.dateTime)
        for(var j=0; j<existingEvents.length; j++){
          console.log(googcalStart.getTime(), existingEvents[j].date.getTime())
          if(googcalStart.getTime() === existingEvents[j].date.getTime()){
            matched = true;
          }
        }
        console.log(matched)
        if(!matched){
          eventsToSync.push(manager.prototype.createEvent(0, googcalEvent.summary, googcalStart, "http://chapelboro.com/wp-content/uploads/2015/02/wesley-campus-ministry-logo.jpg.jpg", googcalEvent.description, googcalEvent.location))
        }
      }
      callback(err, eventsToSync);
    }
  });
  })


}





module.exports = Calendar;
