import App from './App.svelte';
import io from '../node_modules/socket.io/client-dist/socket.io';

const app = new App({
	target: document.body,
	props: {
	}
});

const socket = io( {autoConnect: false} );

var userdata = {
    username : '',
    roomID : ''
}

function toggleButton(id) {
    let el = document.getElementsByClassName('button-primary-positive');
    if(el.length !== 0) {
        el[0].classList.toggle('button-primary-positive');
    }
    el = document.getElementById(id);
    el.classList.toggle('button-primary-positive');
}

function setEstimation(estimation) {
    var el = document.getElementById(socket.id);
    el.innerHTML = estimation;
    socket.emit('estimated', estimation);
}

function setUserdata(username, roomID) {
    userdata.username = username;
    userdata.roomID = roomID;
    socket.connect();
    socket.emit('joinRoom', userdata);
}

function copyToClipboard(content) {
    navigator.clipboard.writeText(content).then(function() {
        //console.log('Async: Copying to clipboard was successful!');
    }, function(err) {
    console.error('Async: Could not copy text: ', err);
    });
}

function checkRooms(roomID) {
    socket.emit('checkRoom', roomID);
}

function changeThemeStyle(darktheme) {
    let themeStyle = document.getElementById('themeStyle');
    if( localStorage.getItem('theme') === undefined ) {
        localStorage.setItem('theme', 'css/dark.css');
    }
    if( darktheme ) {
        themeStyle.setAttribute('href', 'css/dark.css');
        localStorage.setItem('theme', 'css/dark.css');
    } else {
        themeStyle.setAttribute('href', 'css/light.css')
        localStorage.setItem('theme', 'css/light.css');
    }
}

function leaveRoom() {
    socket.disconnect();
}

function validateInput(usernameInput, roomidInput) {
    if( usernameInput !== "" && usernameInput.length > 2 && usernameInput.length < 21 && roomidInput !== "" && roomidInput.length === 5 && roomidInput.match(/^[0-9]+$/) !== null ) {
            return true;
    }
    else {
        buttonPulse();
    }
}

function buttonPulse() {
    let btn = document.getElementById("submitButton")
    btn.classList.add("button-primary-negative");
    setTimeout(function(){
        btn.classList.remove("button-primary-negative");
    }, 300);
}

//////////////////////////////////////////////////////////////////////
//socket communication////////////////////////////////////////////////

socket.on('newRoom', (newRoom) => {
    userdata.roomID = newRoom;
    document.getElementById('roomID').innerHTML = userdata.roomID;
});

socket.on('validation', (validation) => {
    if( validation === true ) {
        setLobby();
    }
    else {
        //el = document.getElementById("roomIDInput");
        //el.placeholder = "Please enter an existing room-id.";
        //el.value = "";
        alert('This room-id does not exist.');
    }
});

export {
    app,
    socket,
    setUserdata,
    checkRooms,
    leaveRoom,
    copyToClipboard,
    toggleButton,
    setEstimation,
    changeThemeStyle,
    validateInput
}