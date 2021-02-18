var activeRooms = ['00000', '12345', '54321', '99999'];

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


module.exports = {
    generateRoomID,
    validateRoomID
};