let userdata = {
    username: '', 
    roomID: '', 
    role: ''
}
function setUserdata(name, id, role) {
    userdata.username = name || 'user';
    userdata.roomID = id || '00000';
    userdata.role = role || 'member';

    console.log(userdata);
    localStorage.setItem('username', name);
    localStorage.setItem('role', role);
    socket.connect();
    socket.emit('joinRoom', userdata);
}

export {
    setUserdata
}