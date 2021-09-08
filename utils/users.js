const users = [];

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
    if (index !== -1) return users.splice(index, 1)[0];
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
    if(user.estimation !== '' || user.role === 'spectator') return true;
}

//resets the estimations of all users
function resetEstimations(room) {
    let reset = getRoomUsers(room);
    for(let i = 0; i < reset.length; i++) {
        reset[i].estimation = '';
        reset[i].isReady = false;
    }
    console.log('all estimations were sucessfully reseted');
}

module.exports = {
    userJoin,
    userLeave,
    getCurrentUser,
    getRoomUsers,
    checkAllEstimated,
    resetEstimations
};
