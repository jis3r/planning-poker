const activeRooms = [];

function generateRoomID() {
    let roomID = '';
    for(let i = 0; i < 5; i++) {
        roomID += Math.floor(Math.random() * 10).toString();
    }
    if( activeRooms.includes(roomID) === false ) {
        activeRooms.push(roomID);
    } else {
        generateRoomID();
    }
    console.log('Generator Output: ', roomID, activeRooms);
    return roomID;
}

function addRoom(id) {
    const room = { id };
    if( !activeRooms.includes(room) ) {
        activeRooms.push(room);
    }
  
    return room;
}



module.exports = {
    generateRoomID,
    addRoom
};