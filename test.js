var express = require('express');
var app = express();
var mysql = require("mysql");

var connection = mysql.createConnection({
    host: "us-cdbr-azure-east-c.cloudapp.net",
    user : "bddfe4567fcee0",
    password : "aaa47743",
    database: "uncwesley"
})

connection.connect(function(err){
  if(!err) {
    console.log("Database is connected ... nn");    
  }else {
    console.log("Error connecting database ... nn");    
}


});

app.get('/', function (req, res) {
connection.query('SELECT * from Events', function(err, rows, fields) {
  connection.end();
  if (!err)
    console.log('The solution is: ', rows);
  else
    console.log('Error while performing Query.');
  });
});

app.listen(process.env.PORT, function () {
  console.log('App running')
})
