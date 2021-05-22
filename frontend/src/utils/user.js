let user = {
    id: '', 
    username: '', 
    room: '', 
    estimation: '', 
    isReady: false, 
    role: ''
}
function setUserdata(userdata) {
    localStorage.setItem('username', userdata.name);
    localStorage.setItem('role', userdata.role);
    socket.connect();
    socket.emit('joinRoom', userdata);
}

export {
    setUserdata
}