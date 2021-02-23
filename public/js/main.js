const socket = io();
var userdata = {
    username : '',
    roomID : ''
}

function toggleButton(id) {
    let el = document.getElementsByClassName('button-primary-positive');
    console.log('El', el);
    if(el.length !== 0) {
        el[0].classList.toggle('button-primary-positive');
    }
    el = document.getElementById(id);
    el.classList.toggle('button-primary-positive');
}

function setEstimation(estimation) {
    var el = document.getElementById(socket.id);
    el.innerHTML = estimation;
    console.log(el.style.color);
    socket.emit('estimated', estimation);
}

function setUserdata() {
    var url = window.location.href;
    var getQuery = url.split('?')[1];
    var params = getQuery.split('&');
    var username = params[0].split('=')[1];
    var roomID = params[1].split('=')[1];

    userdata.username = username;
    userdata.roomID = roomID;
    console.log('client', userdata);

    document.getElementById('roomID').innerHTML = userdata.roomID;
    socket.emit('joinRoom', userdata);
}

function fillUserList(users) {
    let playerlist = document.getElementById('playerlist');
    playerlist.innerHTML = '';

    for(let i = 0; i < users.length; i++){
        let listRow = document.createElement('tr');
        let player = document.createElement('td');
        let estimation = document.createElement('td');
        player.appendChild(document.createTextNode(users[i].username));
        estimation.appendChild(document.createTextNode(' '));
        estimation.style.color = '#8dcb1a';
        estimation.setAttribute("id", users[i].id);
        listRow.appendChild(player);
        listRow.appendChild(estimation);
        playerlist.appendChild(listRow);
    }
}

function copyToClipboard(content) {
    navigator.clipboard.writeText(content).then(function() {
        console.log('Async: Copying to clipboard was successful!');
    }, function(err) {
    console.error('Async: Could not copy text: ', err);
    });
}

function checkRooms(roomID) {
    socket.emit('checkRoom', roomID);
}

socket.on('bannermessage', (message) => {
    let banner = document.getElementById('banner');
    banner.innerHTML = message;
    banner.style.transition = '4s';
    banner.style.color = 'rgb(255, 255, 255)';
    setTimeout(function(){
        banner.innerHTML = ' ';
        banner.style.color = 'rgb(0, 0, 0)';
    }, 4000);
});

socket.on('newRoom', (newRoom) => {
    userdata.roomID = newRoom;
    Object.freeze(userdata);
    document.getElementById('roomID').innerHTML = userdata.roomID;
});

socket.on('validation', (validation) => {
    console.log('validation', validation);
    if ( validation === false ) {
        location.href='join.html'
        //el = document.getElementById("roomIDInput");
        //el.placeholder = "Please enter an existing room-id.";
        //el.value = "";
        alert('This room-id does not exist.');
    }
});

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
    document.getElementById('playerlist').innerHTML = '';
    fillUserList(users);
});