const express = require('express');
const socketio = require('socket.io');
const path = require('path');
const http = require('http');
const { generateRoomID, 
        validateRoomID } = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname, 'public')));


const botName = 'Werwolph';

//run when a client connects
io.on('connection', socket => {
    console.log('New websocket connection');

    socket.on('checkRoom', (roomID) => {
        console.log('Server recieved ', roomID, '. It will now be validated.')
        socket.emit('validation', validateRoomID(roomID));
    });

    socket.on('joinRoom', (userdata) => {
        if (userdata.roomID === "") {
            userdata.roomID = generateRoomID();
            socket.emit('newRoom', userdata.roomID);
        }
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