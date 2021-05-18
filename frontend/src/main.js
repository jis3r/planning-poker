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
    localStorage.setItem('username', name);
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

//////////////////////////////////////////////////////////////////////
//socket communication////////////////////////////////////////////////


export {
    app,
    socket,
    setUserdata,
    leaveRoom,
    changeThemeStyle,
}