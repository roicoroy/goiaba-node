var http = require('http').createServer(handler);
// var express = require('express').createServer(handler);
// var app = express();
var fs = require('fs');
var io = require('socket.io')(http);
var cors = require('cors');
var Gpio = require('onoff').Gpio;
var LED = new Gpio(4, 'out');
var pushButton = new Gpio(26, 'in', 'both');

http.listen(5000);

// app.use(function (req, res, next) {
//  res.header("Access-Control-Allow-Origin", "*");
//  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//  next();
// });

function handler (req, res) { //create server
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
      "Access-Control-Max-Age": 2592000, // 30 days
      /** add other headers as per requirement */
    };
  fs.readFile(__dirname + '/public/index.html', function(err, data) { //read file index.html in public folder
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'}, headers); //display 404 on error
      return res.end("404 Not Found");
    }
    res.writeHead(200, {'Content-Type': 'text/html'}, headers); //write HTML
    res.write(data); //write data from index.html
    return res.end();
  });
}
// Express route for incoming requests

io.sockets.on('connection', function (socket) {   // WebSocket Connection
  var lightvalue = 0;
                                                  // static variable for current status

  socket.on('light', function(data) {             // get light switch status from client
    lightvalue = data;
    if (lightvalue != LED.readSync()) {           // only change LED if status has changed
      LED.writeSync(lightvalue);                  // turn LED on or off
      console.log("lightvalue : " + lightvalue); 
      socket.emit('light', lightvalue);
    }

  });
});

process.on('SIGINT', function () {
  LED.writeSync(0); // Turn LED off
  LED.unexport(); // Unexport LED GPIO to free resources
  process.exit(); //exit completely
});
