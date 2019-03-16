const express = require('express');
const bodyParser = require('body-parser')
// var cors = require('cors')
// var session = require('express-session');
// let mysql = require("mysql")
let app = express();

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

var server = app.listen(5000, () => {
    console.log('Server is running..');
});

// Serve static files, such as css and scripts, from the directory below.
app.use(express.static(__dirname + '/static_files'));

// Parse application/x-www-form-urlencoded
// Don't worry about this.
app.use(bodyParser.urlencoded({ extended: true}));

// Parse application/json
// Allows us to read JSON.
app.use(bodyParser.json());

// Use this as an example of a super simple GET request.
// req: The request that has came in, contains all the information from the client to get a page.
// res: The response that will be set to the client.
app.get('/', function (req, res) {

    // Tells the client that it's receiving a html file
    res.setHeader("Content-Type", "text/html")

    // The data that is getting sent to the file.
    res.sendfile('static_files/index.html')
    return res;
});

// Register a new user account to the system, allowing for the user to configure their microbit settings.
// Use this as an example of how Post commands work.
app.post('/register', function (req, res) {

    let stored = "Not Stored";

    // Query the database, inserting the given details into the user table.
    // req.body.username is the data that hsa been sent in the post request from the client. This is how it is accessed.
    runSQL("INSERT INTO user(username, password, notification_interval) VALUES (?, ?, ?)", [req.body.username, req.body.password, req.body.notification_interval], function (err, recordset) {

        if(err)
            console.log(err);

        stored = "Stored";
    });

    res.send(stored);
});
