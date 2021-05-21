let userdata = {
    username: "",
    roomID: ""
}
function setUserdata(name, id) {
    userdata.username = name;
    userdata.roomID = id;
    localStorage.setItem('username', name);
    socket.connect();
    socket.emit('joinRoom', userdata);
}

export {
    setUserdata
}