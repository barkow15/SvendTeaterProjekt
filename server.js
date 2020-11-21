const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const firebaseAdmin = require('firebase-admin');
const bodyParser = require("body-parser");
const serviceAccount = require('./svendteaterprojekt-firebase-adminsdk-7dh99-975a3fcc37.json');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

firebaseAdmin.initializeApp({
   credential: firebaseAdmin.credential.cert(serviceAccount),
   databaseURL: "https://svendteaterprojekt.firebaseio.com"
});
// Get a database reference to our posts
const db = firebaseAdmin.database();
const ref = db.ref("/");

/**
 * Reading Value from
 * Firebase Data Object
 */


ref.once("value", function(snapshot) {
   const data = snapshot.val();   //Data is in JSON format.
   console.log(data);
});


let usersConnected = 0;

app.get('/', (req, res) => {
   res.sendFile(__dirname + '/index.html');
});

app.get('/controlpanel', (req, res) => {
   res.sendFile(__dirname + '/panelControls.html');
});

app.post('/panel', (req, res) => {
   if(req.body.showPanel === true){
      io.sockets.emit('showpanel', true);
      res.status(200).send("Success. Showing panel.");
   }else if(!req.body?.showPanel){
      io.sockets.emit('showpanel', false);
      res.status(200).send("Success. Hiding panel.");
   }else{
      res.status(400).send("Not the right format buddy. Try again.");
   }
});
//
// app.post('/post', (req, res) => {
//    console.log(req.params);
//    io.sockets.emit('showpanel', false);
//    res.send({showPanel: true});
// });

io.on('connection', (socket) => {
   usersConnected = usersConnected + 1;
   
   const usersConnectedMsg = `Number of users connected ${usersConnected}`;
   
   io.sockets.emit('number-of-users-connected', usersConnected);
   
   socket.on('vote', (val) => {
      console.log(val);
      
      socket.emit('vote-response','hejsa');
   });
   
   socket.on('disconnect', () => {
      usersConnected = usersConnected - 1;

      console.log(`Number of users connected ${usersConnected}`)
   });
});

http.listen(3000, () => {
   console.log('listening on *:3000');
});