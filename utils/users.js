const activeRooms = ['00000'];
const users = [];

function generateRoomID() {
    let roomID = '';
    for(let i = 0; i < 5; i++) {
        roomID += Math.floor(Math.random() * 10).toString();
    }
    if( activeRooms.includes(roomID) === false ) {
        activeRooms.push(roomID);
    }
    else {
        generateRoomID();
    }
    console.log('Generator Output: ', roomID, activeRooms);
    return roomID;
}

function validateRoomID(roomID) {
    console.log('Active rooms on validation', activeRooms, roomID);
	if (activeRooms.includes(roomID) === true )
	{
		return true;
	}
    else {
        return false;
    }
}

function userJoin(id, username, room) {
    const user = { id, username, room };
  
    users.push(user);
  
    return user;
}

// User leaves chat
function userLeave(id) {
    const index = users.findIndex(user => user.id === id);
    
    if (index !== -1) {
        return users.splice(index, 1)[0];
      }
  }
  
function getCurrentUser(id) {
    return users.find(user => user.id === id);
}
  
// Get room users
function getRoomUsers(room) {
  return users.filter(user => user.room === room);
}

module.exports = {
    generateRoomID,
    validateRoomID,
    userJoin,
    userLeave,
    getCurrentUser,
    getRoomUsers
};