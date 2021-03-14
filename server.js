const express = require('express');
const socketio = require('socket.io');
const path = require('path');
const http = require('http');
const { generateRoomID, 
        validateRoomID,
        userJoin,
        userLeave,
        getCurrentUser,
        getRoomUsers,
        checkAllEstimated,
        resetEstimations    } = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

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
    if (userdata.roomID === "") {
      userdata.roomID = generateRoomID();
    }
    
    socket.emit('newRoom', userdata.roomID);
    console.log('Server recieved userdata:', userdata.username, '\n', userdata.roomID);
    const user = userJoin(socket.id, userdata.username, userdata.roomID);
    socket.join(user.room);

    //welcome current user
    socket.emit('bannermessage', 'Welcome.');

    //broadcast when a user connects
    socket.broadcast.to(user.room).emit('bannermessage', `${user.username} has joined.`);
    
    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

    socket.on('estimated', (estimation) => {
      let user = getCurrentUser(socket.id);
      user.estimation = estimation;
      console.log('User ', user.id, 'with alias ', user.username, 'estimated ', estimation);
      
      //broadcasts estimation to all room-members
      socket.broadcast.to(user.room).emit('newEstimation', user);
      if( checkAllEstimated(user.room) === true ) {
        console.log('all users estimated');
        io.to(user.room).emit('reveal', '');
      }
      else {
        console.log(`waiting for all users of room ${user.room} to estimate`);
      }
    });

    socket.on('reset', (foo) => {
      let user = getCurrentUser(socket.id);
      resetEstimations(user.room);

      //broadcast command to empty all estimations to all room-members
      io.to(user.room).emit('emptyList', '');
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
      let tempUser = getCurrentUser(socket.id);
      console.log(tempUser);
      const user = userLeave(socket.id);

      if (user) {
        io.to(user.room).emit('bannermessage', `${user.username} has left.`);

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
          room: user.room,
          users: getRoomUsers(user.room)
        });
      }

      if(tempUser) {
        if( checkAllEstimated(tempUser.room) === true ) {
          console.log('all users estimated');
          io.to(tempUser.room).emit('reveal', '');
        }
        else {
          console.log(`waiting for all users of room ${tempUser.room} to estimate`);
        }
      }
    });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));