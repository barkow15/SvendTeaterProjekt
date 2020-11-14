const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

let usersConnected = 0;
let showPanel = false;

let theaterVoting = {
   "akt1" : {
      a: 0,
      b: 0
   },
   "akt2":{
      a: 0, 
      b: 0,
   }
}

app.get('/', (req, res) => {
   res.sendFile(__dirname + '/index.html');
});

app.get('/vispanel', (req, res) => {
   io.sockets.emit('showpanel', true);
   res.send({showPanel: true});
});

io.on('connection', (socket) => {
   usersConnected = usersConnected + 1;
   
   const usersConnectedMsg = `Number of users connected ${usersConnected}`;
   
   io.sockets.emit('number-of-users-connected', {usersConnected : usersConnected});
   
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