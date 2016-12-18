var express = require('express');
var app = express();
var mysql = require("mysql");

app.use(express.static('public'))




app.get('/', function(req, res){
  res.sendFile('index.html');
})

app.get('/events', function (req, res) {
  var connection = mysql.createConnection({
    host: "us-cdbr-azure-east-c.cloudapp.net",
    user : "bddfe4567fcee0",
    password : "aaa47743",
    database: "uncwesley"
  });
  connection.connect(function(err){
    if(!err) {
      console.log("Database is connected ... nn");    
    }else {
      console.log("Error connecting database ... nn");    
    }
    connection.query('SELECT * from events', function(err, rows, fields) {
      if (!err){
        res.status(200).send(rows);
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
