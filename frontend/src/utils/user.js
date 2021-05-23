let userdata = {
    username: '', 
    roomID: '', 
    role: 'member'
}

function setUserdata(name, id, role='member') {
    userdata.username = name || 'user';
    userdata.roomID = id || '';
    userdata.role = role;

    localStorage.setItem('username', name);
    localStorage.setItem('role', role);
    socket.connect();
    socket.emit('joinRoom', userdata);
}

export {
    userdata,
    setUserdata
}