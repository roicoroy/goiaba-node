var http = require('http'); //require http server, and create server with function handler()
var express = require('express').createServer(handler);
var app = express();
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
var cors = require('cors');
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var LED = new Gpio(4, 'out'); //use GPIO pin 4 as output
var pushButton = new Gpio(26, 'in', 'both'); //use GPIO pin 17 as input, and 'both' button presses, and releases should be handled


app.listen(5000); //listen to port 8080

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

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
app.get('/goiaba/led', function(req, res) {
    let my_message = 'Hello, this my message from server';
    res.send(my_message);

});
// Express route for any other unrecognised incoming requests
app.get('*', function(req, res) {
  res.status(404).send('Unrecognised API call');
});

// Express route to handle errors
app.use(function(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send('Oops, Something went wrong!');
  } else {
    next(err);
  }
});


io.sockets.on('connection', function (socket) {   // WebSocket Connection
  var lightvalue = 0;
                                                  // static variable for current status
  pushButton.watch(function (err, value) {        // Watch for hardware interrupts on pushButton
    if (err) { //if an error
      console.error('There was an error', err);   // output error message to console
      return;
    }
    lightvalue = value;
    socket.emit('light', lightvalue);             // send button status to client
  });

  socket.on('light', function(data) {             // get light switch status from client
    lightvalue = data;
    if (lightvalue != LED.readSync()) {           // only change LED if status has changed
      LED.writeSync(lightvalue);                  // turn LED on or off
      console.log("lightvalue : " + lightvalue); 
      socket.emit('light', lightvalue);
    }

  });
});

process.on('SIGINT', function () { //on ctrl+c
  LED.writeSync(0); // Turn LED off
  LED.unexport(); // Unexport LED GPIO to free resources
  pushButton.unexport(); // Unexport Button GPIO to free resources
  process.exit(); //exit completely
});
