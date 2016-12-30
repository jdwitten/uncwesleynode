var mysql = require("mysql");

var pool = mysql.createPool({
    host: "us-cdbr-azure-east-c.cloudapp.net",
    user : "bddfe4567fcee0",
    password : "aaa47743",
    database: "uncwesley",
    connectionLimit: 4
  });

module.exports = pool