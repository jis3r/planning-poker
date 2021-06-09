const express = require('express');
const cors = require('cors');
const socketio = require('socket.io');
const { instrument } = require("@socket.io/admin-ui");
const path = require('path');
const http = require('http');
const { userJoin,
        userLeave,
        getCurrentUser,
        getRoomUsers,
        checkAllEstimated,
        resetEstimations    } = require('./utils/users');
const { validateRoomID, 
        generateRoomID, 
        addRoom             } = require('./utils/rooms');


const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketio(server);

instrument(io, {
  auth: false
});

//set static folder
app.use(express.static(path.join(__dirname, 'frontend', 'public')));

//run when a client connects
io.on('connection', socket => {
  console.log('New websocket connection');

  socket.on('checkRoom', (roomID) => {
    console.log('Server recieved ', roomID, '. It will now be validated.');
    socket.emit('validation', validateRoomID(roomID));
  });

  socket.on('joinRoom', (userdata) => {
    console.log('Server recieved userdata:', userdata);
    if (userdata.roomID === "") {
      userdata.roomID = generateRoomID();
    }
    socket.emit('newRoom', userdata.roomID);
    const user = userJoin(socket.id, userdata.username, userdata.roomID, userdata.role);

    //add user to room
    socket.join(user.room);
    console.log(user.username, 'with id', user.id, 'joined room', user.room);
    
    socket.on('ready', () => {
      //welcome current user
      socket.emit('bannermessage', 'Welcome.');
      //broadcast when a user connects
      socket.broadcast.to(user.room).emit('bannermessage', `${user.username} has joined.`);
      // Send users info
      socket.emit('roomUsers', getRoomUsers(user.room));
      socket.broadcast.to(user.room).emit('addUser', user);

      if( user.role !== 'spectator' ) {
        io.to(user.room).emit('resetReveal');
      } else {
        if( checkAllEstimated(user.room) ) socket.emit('reveal');
      }
    });
  });


  socket.on('estimated', (estimation) => {
    let user = getCurrentUser(socket.id);
    user.estimation = estimation;
    console.log(user.username, 'with id', user.id, 'estimated', user.estimation);
    
    //broadcasts estimation to all room-members
    socket.broadcast.to(user.room).emit('newEstimation', user);
    if( checkAllEstimated(user.room) ) {
      console.log('all users estimated');
      io.to(user.room).emit('reveal');
    } else {
      console.log(`waiting for all users of room ${user.room} to estimate`);
    }
  });

  socket.on('reset', () => {
    let user = getCurrentUser(socket.id);
    console.log(user.username, 'with id', user.id, 'requests a reset');
    resetEstimations(user.room);

    //broadcast command to empty all estimations to all room-members
    io.to(user.room).emit('emptyList');
  });

  // Runs when client leaves or disconnects
  socket.on('disconnect', () => {
    let tempUser = getCurrentUser(socket.id);
    const user = userLeave(socket.id);
    
    if (user) {
      io.to(user.room).emit('bannermessage', `${user.username} has left.`);
      // Send users and room info
      socket.broadcast.to(user.room).emit('removeUser', user);
      console.log(user.username, 'with id', user.id, 'left room', user.room);
    }

    if(tempUser) {
      if( checkAllEstimated(tempUser.room) ) {
        console.log('all users estimated');
        io.to(tempUser.room).emit('reveal');
      } else {
        console.log(`waiting for all users of room ${tempUser.room} to estimate`);
      }
    }
    //socket.disconnect();
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
