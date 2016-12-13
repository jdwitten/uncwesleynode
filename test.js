var express = require('express')
var app = express()
// Require my new parser.js file.
var Parser = require('./Parser');

// Load the fs (filesystem) module.
var fs = require('fs');

// Read the contents of the file into memory.
fs.readFile('example_log.txt', function (err, logData) {
  
// If an error occurred, throwing it will
  // display the exception and kill our app.
  if (err) throw err;
  
// logData is a Buffer, convert to string.
  var text = logData.toString();
  
});

app.get('/', function (req, res) {
// Read the contents of the file into memory.
	fs.readFile('example_log.txt', function (err, logData) {
  
	// If an error occurred, throwing it will
  	// display the exception and kill our app.
  	if (err) throw err;
  
	// logData is a Buffer, convert to string.
  	var text = logData.toString();
  	var parser = new Parser();
  	res.send(parser.parse(text))
	});
})

app.listen(process.env.PORT, function () {
  console.log('App running')
})
