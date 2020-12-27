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

let spoergsaalData = null;

ref.once("value", function(snapshot) {
   const data = snapshot.val();   //Data is in JSON format.
   console.log(data);
   
   spoergsaalData = data;
});

ref.on("child_changed", function(snapshot) {
   const data = snapshot.val();   //Data is in JSON format.
   console.log(data);
   spoergsaalData = data;
}, function (errorObject) {
   console.log("The read failed: " + errorObject.code);
});


let usersConnected = 0;

app.get('/', (req, res) => {
   res.sendFile(__dirname + '/index.html');
});

app.get('/stemmeoversigt', (req, res) => {
   res.sendFile(__dirname + '/panelControls.html');
});

app.get('/spoergsmaal/:number', (req, res) => {
   const {number} = req.params;

   io.sockets.emit('spoergsmaal', number);
   
   res.send(number);
});

app.get('/hentspoergsmaal', (req, res) => {
   ref.once("value", function(snapshot) {
      const data = snapshot.val();   //Data is in JSON format.
      
      console.log(data);
      
      res.status(200).send(data);
   });
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

app.post('/stem', (req, res) => {
   const { radioValue, spoergsmaalIndex } = req.body;
   let currentVoteCount = null;
   const ref = `sporgsmaal/${spoergsmaalIndex}/valgmuligheder/${radioValue}`;
   
   const voteRef = db.ref(ref);
   voteRef.on('value', (snapshot) => {
      const data = snapshot.val();
      currentVoteCount = data;
   });
   
   let newVoteCount = currentVoteCount + 1;
   
   console.log(newVoteCount);

   db.ref(ref).set(
      newVoteCount
   , (error) => {
      if (error) {
         // The write failed...
         res.status(500).send("Fejl noget gik galt prøv igen");
      } else {
         // Data saved successfully!
         res.status(200).send(true);
      }
   });
});

app.get('/nulstil', (req, res) => {

   let spoergsmalIndexes = [];

   db.ref('sporgsmaal/').once('value', snapshot => {
      
      const updates = {};
      snapshot.forEach((child) => {
         
         const childVals = child.val().valgmuligheder;

         for (const [key, value] of Object.entries(childVals)) {
            updates[`${child.key}/valgmuligheder/${key}`] = 0;
         }
      });
      
      return db.ref('sporgsmaal/').update(updates);
   }).then(() => {
      res.status(200).end();
   }).catch((err) => {
      console.log(err);
      res.status(500).send(err);
   });
});

app.get('/skjulpanel', (req, res) => {
      io.sockets.emit('hidepanel', true);
      res.status(200).send("Success. Hiding panel.");
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