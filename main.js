var express = require('express');
var app = express();
var mysql = require("mysql");
var DataManager = require("./public/js/DataManager");
var bodyParser = require('body-parser');
var session = require("client-sessions");
var calendar = require("./public/js/google-calendar-sync");
var fs = require('fs');
var bus = require("./public/js/event-bus");
var pool = require("./public/js/db-pool");
var apn = require("apn");

app.use(express.static('public'));

jsonParser = bodyParser.json();
urlParser = bodyParser.urlencoded({extended:true});


app.use(session({
  cookieName: 'session',
  secret: 'Ag5Tvc',
  duration: 30*60*1000,
  activeDuration: 5*60*1000
}))

app.use(function(req, res, next){
  if(req.session && req.session.logged_in){
    req.logged_in = true
    req.session.logged_in = true;
    next();
  }else{
    next();
  }
})

function requireLogin(req, res, next){
  if(!req.logged_in){
    res.redirect('/login');
  }else{
    next();
  }
}

app.get('/login_error', function(req, res){
  res.sendFile("login_error.html", {"root": "public"});
})

app.get('/', requireLogin, function(req, res){
  res.redirect("/dashboard")
})

app.get("/login", function(req, res){
  console.log("sending login");
  if(!req.logged_in){
    console.log("sending login");
    res.sendFile("login.html",{"root": "public"})
  }
  else{
    res.redirect('/dashboard');
  }
})

app.get('/dashboard', requireLogin, function(req,res){
  console.log("sending dashboard");
  res.sendFile('dashboard.html', {"root": "public"});
})

app.post("/login", urlParser, function(req, res){
  console.log(req.body)
  if(typeof req.body.password != "undefined"){
    var tryPass = req.body.password;
    console.log("try pass:", tryPass)
    if(tryPass === "fairygodmother"){
      console.log("passwords matched")
      req.session.logged_in = true;
      res.redirect("/dashboard");
    }else{
      console.log("passwords didn't matched")
      res.redirect("/login_error");
    }
  }else{
    res.sendFile("login.html",{"root": "public"})
  }
})

app.post("/login_error", urlParser, function(req, res){
  var tryPass = req.body.password;
  console.log("try pass:", tryPass)
  if(tryPass === "fairygodmother"){
    console.log("passwords matched")
    req.session.logged_in = true;
    res.redirect("/dashboard");
  }else{
    console.log("passwords didn't matched")
    res.redirect("/login_error");
  }

})
app.get("/logout", function(req, res){
  req.session.reset()
  res.redirect("/login")
})
app.post("/dashboard", function(req, res){
  res.sendFile('dashboard.html', {"root": "public"});
})


app.put('/events', jsonParser, function(req, res){
  console.log(req.body)
  var manager = new DataManager();
  var title = req.body.title;
  var date = new Date(req.body.date);
  date = date.toISOString().slice(0, 19).replace('T', ' ');
  var imageURL = "";
  var description = req.body.description;
  var location = req.body.location
  var id = req.body.id;
  console.log(location)
  pool.getConnection(function(err, connection){
    if(err){console.log(err)}
    else{
      connection.query('UPDATE events SET title = ?, date = ?, description = ?, location = ? WHERE eventID = ?', [title, date, description, location, id],
      function(err, rows, fields) {
        if (!err){
          res.status(200).send(true);
          connection.release()
        }
        else{
          console.log('Error while performing Query.');
          connection.release()
        }
      });
    }
  });
});

app.post('/events', jsonParser, function(req, res){
  console.log(req.body)
  var manager = new DataManager();
  var title = req.body.title;
  var date = new Date(req.body.date);
  date = date.toISOString().slice(0, 19).replace('T', ' ');
  var imageURL = "http://chapelboro.com/wp-content/uploads/2015/02/wesley-campus-ministry-logo.jpg.jpg";
  var description = req.body.description;
  var location = req.body.location
  pool.getConnection(function(err, connection){
    if(err){console.log(err)}
    else{
      connection.query('INSERT INTO events (title, date, imageURL,description, location) VALUES (?,?,?,?,?)', [title, date, imageURL, description, location],
      function(err, rows, fields) {
        if (!err){
          res.status(200).send(true);
          connection.release()
        }
        else{
          console.log('Error while performing Query.');
          connection.release()
        }
      });
    }
  });
});

app.delete('/events', jsonParser, function(req, res){
  var id = req.body.id;
  pool.getConnection(function(err, connection){
    if(err){console.log(err)}
    else{
      connection.query('DELETE FROM events WHERE eventID = ?', [id],
      function(err, rows, fields) {
        if (!err){
          res.status(200).send(true);
          connection.release()
        }
        else{
          console.log('Error while performing Query.');
          connection.release()
        }
      });
    }
  });
});




app.get('/events', function (req, res) {
  var manager = new DataManager();
  pool.getConnection(function(err, connection){
    if(!err) {
      console.log("Database is connected ... nn");    
    }else {
      console.log(err)
      console.log("Error connecting database ... nn");
      connection.release()    
    }
    manager.getEvents(connection, function(err, events){
      connection.release()
      if(err){
        res.status(500).send()
      }else{
        res.status(200).send(events)

      }
    })
  })
});

app.get('/prayers', function (req, res) {
  var manager = new DataManager();
  pool.getConnection(function(err, connection){
    if(!err) {
      console.log("Database is connected ... nn");    
    }else {
      console.log(err)
      console.log("Error connecting database ... nn");    
    }
    connection.query('SELECT prayerID, prayerDate, content, fname, lname from prayers AS P JOIN users AS U ON P.senderID = U.userID ORDER BY prayerDate DESC', function(err, rows, fields) {
      if (!err){
        prayers = [];
        for(var i=0; i<rows.length; i++){
          prayers.push(manager.createPrayer(rows[i].prayerID, rows[i].prayerDate, rows[i].content, rows[i].fname, rows[i].lname))
        }
        res.status(200).send(prayers);
        connection.release()
      }
      else{
        console.log(err);
        console.log('Error while performing Query.');
        connection.release()
      }
    })
  })
});


app.delete('/prayers', jsonParser, function(req, res){
  var id = req.body.id;
  pool.getConnection(function(err, connection){
    if(err){console.log(err)}
    else{
      connection.query('DELETE FROM prayers WHERE prayerID = ?', [id],
      function(err, rows, fields) {
        if (!err){
          res.status(200).send(true);
          connection.release()
        }
        else{
          console.log('Error while performing Query.');
          connection.release()
        }
      });
    }
  });
});
app.get('/blogs', function (req, res) {
  var manager = new DataManager();
  pool.getConnection(function(err, connection){
    if(!err) {
      console.log("Database is connected ... nn");    
    }else {
      console.log(err)
      console.log("Error connecting database ... nn");    
    }
    connection.query('SELECT devotionID, author, text, date, title from devotions ORDER BY date DESC', function(err, rows, fields) {
      if (!err){
        blogs = [];
        for(var i=0; i<rows.length; i++){
          blogs.push(manager.createBlog(rows[i].devotionID, rows[i].text, rows[i].author, rows[i].date, rows[i].title))
        }
        res.status(200).send(blogs);
        connection.release()
      }
      else{
        console.log(err);
        console.log('Error while performing Query.');
        connection.release()
      }
    })
  })
});

app.put('/blogs', jsonParser, function(req, res){
  var manager = new DataManager();
  var title = req.body.title;
  var date = new Date(req.body.date);
  date = date.toISOString().slice(0, 19).replace('T', ' ');
  console.log(date);
  var text = req.body.text;
  var author = req.body.author
  var id = req.body.id;
  pool.getConnection(function(err, connection){
    if(err){console.log(err)}
    else{
      connection.query('UPDATE devotions SET author = ?, text = ?, date = ?, title = ? WHERE devotionID = ?', [author, text, date, title, id],
      function(err, rows, fields) {
        if (!err){
          res.status(200).send(true);
          connection.release()
        }
        else{
          console.log('Error while performing Query.');
          connection.release()
        }
      });
    }
  });
});

app.delete('/blogs', jsonParser, function(req, res){
  var id = req.body.id;
  pool.getConnection(function(err, connection){
    if(err){console.log(err)}
    else{
      connection.query('DELETE FROM devotions WHERE devotionID = ?', [id],
      function(err, rows, fields) {
        if (!err){
          res.status(200).send(true);
          connection.release()
        }
        else{
          console.log('Error while performing Query.');
          connection.release()
        }
      });
    }
  });
});
app.post('/blogs', jsonParser, function(req, res){
  var manager = new DataManager();
  var title = req.body.title;
  var date = new Date(req.body.date);
  date = date.toISOString().slice(0, 19).replace('T', ' ');
  console.log(date);
  var text = req.body.text;
  var author = req.body.author
  pool.getConnection(function(err, connection){
    if(err){console.log(err)}
    else{
      connection.query('INSERT INTO devotions (author, text, date, title) VALUES (?,?,?,?)', [author, text, date, title],
      function(err, rows, fields) {
        if (!err){
          res.status(200).send(true);
          connection.release()
        }
        else{
          console.log('Error while performing Query.');
          connection.release()
        }
      });
    }
  });
});

bus.on("syncedEvents", function(response, connection){
    console.log("synced events")
    connection.release();
    return response.status(200).send();
  })

bus.on("googleCalendarAuthorized", function(err, auth,res){
  if(err){
    console.log("Error authorizing google calendar")
  }else{
    pool.getConnection(function(err, connection){
      if(err){
        console.log(err)
        return res.status(500).send()
      }
        calendar.prototype.createEventsToSync(auth, events, function(err, eventsToSync){
        if(eventsToSync.length==0){
          console.log("no events to sync")
          return bus.emit("syncedEvents", res, connection);
        }
        var processed = eventsToSync.length
        for(var i=0; i<eventsToSync.length; i++){
          console.log(i)
          DataManager.prototype.postEvent(eventsToSync[i], connection, function(err,event){
            if(err){
              console.log(err)
              res.status(500).send()
            }
            if( --processed == 0){
              return bus.emit("syncedEvents", res, connection)
            }
          })
        }
      })
    })
  }
})

app.get('/calendar', function(req,res){

  // Load client secrets from a local file.
  pool.getConnection(function(err, connection){
    DataManager.prototype.getEvents(connection, function(err, events){
      connection.release();
      if(err){
        console.log(err);
        res.status(500).send();
      }else{
        fs.readFile('client_secret.json', function processClientSecrets(err, content) {
          if (err) {
            connection.release();
            console.log('Error loading client secret file: ' + err);
            return;
          }
          connection.release()
          calendar.prototype.authorize(JSON.parse(content), function(auth){
            bus.emit("googleCalendarAuthorized", err, auth, res)
          });
        })
      }
    })
  })
});


bus.on("finishedSendingNotifications",function(response, connection){
  console.log("finished sending notifications");
  connection.release()
  response.status(200).send();
})


app.post("/notifications", jsonParser, function(req, res){


  pool.getConnection(function(err, connection){
    if(err){
      console.log("Error getting connection ", err);
      res.status(500).send()
    }else{
      var text = req.body.text
      var date = new Date(req.body.date);
      date = date.toISOString().slice(0, 19).replace('T', ' ');
      DataManager.prototype.postNotification(text, date, connection, function(err, success){
    
      })
      DataManager.prototype.getAPNS(connection, function(err, tokens){
        if(err){
          console.log(err)
          res.status(500).send()
        }else{
          // Set up apn with the APNs Auth Key
          var apnProvider = new apn.Provider({  
          token: {
              key: './apns/apns.p8', // Path to the key p8 file
              keyId: 'PDR468NBSM', // The Key ID of the p8 file (available at https://developer.apple.com/account/ios/certificate/key)
              teamId: 'XA9HBUSBJ5', // The Team ID of your Apple Developer Account (available at https://developer.apple.com/account/#/membership/)
            },
            production: false // Set to true if sending a notification to a production iOS app
          });

          // Enter the device token from the Xcode console
          var deviceToken = '';

          // Prepare a new notification
          var notification = new apn.Notification();

          // Specify your iOS app's Bundle ID (accessible within the project editor)
          notification.topic = 'jdwitten.uncwesley';

          // Set expiration to 1 hour from now (in case device is offline)
          notification.expiry = Math.floor(Date.now() / 1000) + 3600;

          // Set app badge indicator
          notification.badge = 1;

          // Play ping.aiff sound when the notification is received
          notification.sound = 'ping.aiff';

          // Display the following message (the actual notification text, supports emoji)
          notification.alert = text;

          // Send any extra payload data with the notification which will be accessible to your app in didReceiveRemoteNotification
          notification.payload = {id: 123};
          var processed = tokens.length;
          for(var i=0; i<tokens.length; i++){
            console.log("sending notification to ", tokens[i])
            deviceToken = tokens[i];
            // Actually send the notification
            apnProvider.send(notification, deviceToken).then(function(result) {  
              // Check the result for any failed devices
              if(--processed === 0 ){
                bus.emit("finishedSendingNotifications", res, connection);
              }
            });
          }
        }
      })
    }
  })
})

app.get("/notifications", function(req, res){
  pool.getConnection(function(err, connection){
    if(err){
      console.log("error getting connection", err)
      res.status(500).send()
    }
    else{
      DataManager.prototype.getNotifications(connection, function(err, notifications){
        if(err){
          console.log("error getting notifications ", err)
          connection.release()
          res.status(500).send()
        }
        else{
          connection.release();
          res.status(200).send(notifications)
        }
      })
    }
  })
})

app.post("/token",jsonParser, function(req, res){
  console.log(req.body)
  var tokenString = req.body.token
  console.log("received token string ", tokenString);
  pool.getConnection(function(err, connection){
    DataManager.prototype.postAPNS(tokenString, connection, function(err,success){
      if(success){
        console.log("successfully inserted token")
        connection.release()
        res.status(200).send()
      }
      else{
        res.status(500).send()
        connection.release()
      } 

    })

  })
})

app.post("/users", jsonParser, function(req,res){
  var fname = req.fname;
  var lname = req.lname;
  var email = req.email;
  var year = req.class;
  var major = req.major;

  console.log(fname, lname, email, year, major)

  pool.getConnection(function(err, connection){
    DataManager.prototype.addUser(fname, lname, email, year, major, connection, function(err,success, id){
      var response = {}
      if(success){
        console.log("successfully inserted User")
        response.success = true;
        response.id = id;
        connection.release()
        res.status(200).send(response)
      }
      else{
        res.status(500).send()
        connection.release()
      } 

    })

  })
})



app.listen(process.env.PORT, function () {
  console.log('App running')
})
