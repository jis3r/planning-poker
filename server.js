const express = require('express');
const socketio = require('socket.io');
const path = require('path');
const http = require('http');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname, 'public')));


const botName = 'Werwolph';

//run when a client connects
io.on('connection', socket => {
    console.log('New websocket connection');

    socket.on('joinRoom', ( userdata ) => { 
        console.log('Server recieved userdata:', userdata.username, '\n', userdata.roomID);
        //const user = userJoin(socket.id, username, room);
        //socket.join(user.room);
    
        //welcome current user
        socket.emit('message', 'Welcome to the room');
    
        //broadcast when a user connects
        //socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));
    });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));