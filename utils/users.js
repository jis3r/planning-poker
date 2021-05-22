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

function userJoin(id, username, room, role) {
    let estimation = '';
    let isReady = false;
    const user = { id, username, room, estimation, isReady, role };
  
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

//checks if all users of given room have submitted their estimation
function checkAllEstimated(room) {
    return getRoomUsers(room).every(hasUserEstimated);
}

//checks if user has already submitted an estimation
function hasUserEstimated(user){
    if( user.estimation !== '') {
        return true
    }
    else {
        return false;
    }
}

//resets the estimations of all users
function resetEstimations(room){
    let reset = getRoomUsers(room)
    for(let i = 0; i < reset.length; i++) {
        console.log(reset[i]);
        reset[i].estimation = '';
        reset[i].isReady = false;
    }
    console.log('all estimations were sucessfully reseted.', users);
}

module.exports = {
    generateRoomID,
    validateRoomID,
    userJoin,
    userLeave,
    getCurrentUser,
    getRoomUsers,
    checkAllEstimated,
    resetEstimations
};