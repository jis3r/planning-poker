const socket = io();
var userdata = {
    username : '',
    roomID : ''
}
var blockedRooms = ['00000', '12345', '54321', '99999'];


function init () {
    setHeight("rulecard", 0.45);
    setHeight("rolecard1", 1.5);
    setHeight("rolecard2", 1.5);
    setHeight("rolecard3", 1.5);
    setHeight("rolecard4", 1.5);
    setHeight("rolecard5", 1.5);
    setHeight("rolecard6", 1.5);
    setHeight("rolecard7", 1.5);
    setHeight("rolecard8", 1.5);
}

function flip(id) {
    console.log(id);
    let element = document.getElementById(id)    
    element.classList.toggle('is-flipped');
}

function setHeight(id, proportion) {
    let el = document.getElementById(id);
    //console.log(el.clientWidth);
    let newHeight = (Math.ceil( el.clientWidth * proportion )).toString();
    newHeight = newHeight + "px";
    //console.log(newHeight);
    el.style.height = newHeight;
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

function generateRoomID() {
    let roomID = '';
    for(let i = 0; i < 5; i++) {
        roomID += Math.floor(Math.random() * 10).toString();
    }
    if( blockedRooms.includes(roomID) === false ) {
        blockedRooms.push(roomID);
    }
    else {
        generateRoomID();
    }
    console.log('Generator Output: ', roomID);
    return roomID;
}

function setUserdata() {
    var url = window.location.href;
    var getQuery = url.split('?')[1];
    var params = getQuery.split('&');
    var username = params[0].split('=')[1];
    var roomID = params[1].split('=')[1];

    userdata.username = username;
    userdata.roomID = roomID;
    Object.freeze(userdata);
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
	if (blockedRooms.includes(roomID) === false )
	{
        el = document.getElementById("roomIDInput");
        el.placeholder = "Please enter an existing room-id.";
        el.value = "";
        alert('This room-id does not exist.');
		return false;
	}
    else {
        return true;
    }
}


socket.on('message', message => {
    console.log(message);
});