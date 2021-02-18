const socket = io();
var userdata = {
    username : '',
    roomID : ''
}

function toggleButton(id) {
    el = document.getElementById(id);
    el.classList.toggle('button-primary-ready');
}

function toggleState() {
    var el = document.getElementById(userdata.username);
    if (el.innerHTML === "") {
      el.innerHTML = "ready";
    } else {
      el.innerHTML = "";
    }
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
    addPlayer(userdata.username);

    socket.emit('joinRoom', userdata);
}

function addPlayer(playername) {
    let playerlist = document.getElementById('playerlist');
    let listRow = document.createElement('tr');
    let player = document.createElement('td');
    let state = document.createElement('td');
    player.appendChild(document.createTextNode(playername));
    state.className = "readycolor";
    state.setAttribute("id", playername); //anpassen um doppelte ids zu vermeiden
    listRow.appendChild(player);
    listRow.appendChild(state);
    playerlist.appendChild(listRow);
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

socket.on('message', (message) => {
    console.log(message);
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