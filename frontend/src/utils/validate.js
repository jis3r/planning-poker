function validateUsername(username) {
    if( username.length > 2 && username.length < 21 ) return true;
    return false;
}

function validateRoomID(roomid) {
    if( roomid.length === 5 && roomid.match(/^[0-9]+$/) !== null ) return true;
    return false;
}

export {
    validateUsername,
    validateRoomID
}