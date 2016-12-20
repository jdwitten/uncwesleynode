var express = require('express');
var app = express();
var mysql = require("mysql");
var DataManager = require("./public/js/DataManager")

app.use(express.static('public'))




app.get('/', function(req, res){
  res.sendFile('index.html');
})


app.post('/events', function(req, res){
  var manager = new DataManager();
  var title = req.body.title;
  var date = new Date(req.body.date);
  date = date.toISOString().slice(0, 19).replace('T', ' ');
  var imageURL = "";
  var description = req.body.description;
  var location = req.body.location
  var connection = mysql.createConnection({
    host: "us-cdbr-azure-east-c.cloudapp.net",
    user : "bddfe4567fcee0",
    password : "aaa47743",
    database: "uncwesley",
    port:3306
  });
  connection.connect(function(err){
    if(!err) {
      console.log("Database is connected ... nn");    
    }else {
      console.log(err)
      console.log("Error connecting database ... nn");    
    }
    connection.query('INSERT INTO events (title, date, imageURL,description, location) VALUES (?,?,?,?,?)', [title, date, imageURL, description, location],
      function(err, rows, fields) {
      if (!err){
        res.status(200).send(true);
        connection.destroy()
      }
      else{
        console.log('Error while performing Query.');
      }
    })
  })
});


app.get('/events', function (req, res) {
  var manager = new DataManager();
  var connection = mysql.createConnection({
    host: "us-cdbr-azure-east-c.cloudapp.net",
    user : "bddfe4567fcee0",
    password : "aaa47743",
    database: "uncwesley",
    port:3306
  });
  connection.connect(function(err){
    if(!err) {
      console.log("Database is connected ... nn");    
    }else {
      console.log(err)
      console.log("Error connecting database ... nn");    
    }
    connection.query('SELECT eventID, title, date, imageURL,description, location from events ORDER BY date DESCENDING', function(err, rows, fields) {
      if (!err){
        events = [];
        for(var i=0; i<rows.length; i++){
          events.push(manager.createEvent(rows[i].eventID, rows[i].title, rows[i].date, rows[i].imageURL, rows[i].description, rows[i].location))
        }
        res.status(200).send(events);
        connection.destroy()
      }
      else{
        console.log('Error while performing Query.');
      }
    })
  })
});




app.listen(process.env.PORT, function () {
  console.log('App running')
})
