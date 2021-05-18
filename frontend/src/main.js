import App from './App.svelte';
import io from '../node_modules/socket.io/client-dist/socket.io';

const socket = io( {autoConnect: false} );
const app = new App({
	target: document.body,
	props: { socket }
});


let userdata = {
    username: "",
    roomID: ""
}
function setUserdata(name, id) {
    userdata.username = name;
    userdata.roomID = id;
    console.log(userdata);
    socket.connect();
    socket.emit('joinRoom', userdata);
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

/*socket.on('newRoom', (newRoom) => {
    document.getElementById('roomID').innerHTML = newRoom;
});*/

export {
    app,
    socket,
    setUserdata,
    leaveRoom,
    changeThemeStyle,
    validateInput
}