import App from './App.svelte';
import io from '../node_modules/socket.io/client-dist/socket.io';

const app = new App({
	target: document.body,
	props: {
	}
});

const socket = io('http://localhost:3000', {autoConnect: false});

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

function setUserdata(username, roomID) {
    userdata.username = username;
    userdata.roomID = roomID;
    console.log('client', userdata);
    socket.connect();
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
        estimation.appendChild(document.createTextNode(users[i].estimation));
        estimation.classList.add('estimation');
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

function showBannermessage(message) {
    let oldBanner = document.getElementById('newBanner');
    if( oldBanner !== null || undefined ) {
        oldBanner.remove();
    }
    let bannerfield = document.getElementById('bannerfield');
    let banner = createBanner(message, 'newBanner');
    
    bannerfield.appendChild(banner);

    setTimeout(function(){
        newBanner.classList.add('banner-invisible');
    }, 2000);
}

function createBanner(message, id) {
    let newBanner = document.createElement('h4');
    newBanner.setAttribute('id', id);
    newBanner.appendChild(document.createTextNode(message));
    newBanner.classList.add('banner-red');
    setTimeout(function(){
        newBanner.classList.add('banner-visible');
    }, 20);
    return newBanner;
}

function revealEstimations() {
    let est = document.getElementsByClassName('estimation');
    //console.log('all esti', est);
    for(let i = 0; i < est.length; i++) {
        est[i].style.opacity = 1;
    }
}

function clearList() {
    let est = document.getElementsByClassName('estimation');
    //console.log('all esti', est);
    for(let i = 0; i < est.length; i++) {
        est[i].style.opacity = 0;
        est[i].innerHTML = '';
    }

    let button = document.getElementsByClassName('button-primary-positive');
    if(button[0] !== undefined) {
        button[0].classList.remove('button-primary-positive');
    }
    showBannermessage('Values reseted.');
}

function getTheme() {
    document.getElementById('themeStyle').setAttribute('href', localStorage.getItem('theme'));
    document.body.style.visibility = 'visible';

    if(location.pathname.split("/").slice(-1)[0] === 'index.html' ) {
        if(localStorage.getItem('theme') === 'css/dark.css') {
            changeThemeIcon('dark');
        }
        else {
            changeThemeIcon('light');
        }
    }
}

function toggleTheme(theme) {
    changeThemeStyle(theme);
    changeThemeIcon(theme);
}

function changeThemeIcon(theme) {
    let trigger = document.getElementById('darkmodetrigger');
    let icon = document.createElement("IMG");
    let oldIcon = document.getElementById('themeIcon');
    let src = 'img/sun.svg';
    let alt = 'sun';
    let param = 'light';
    let style = 'svgsun';
    let animation = 'animation';
    oldIcon.style.transform = 'translateY(-62px)';

    setTimeout(function(){
        while (trigger.firstChild) {
            trigger.removeChild(trigger.firstChild);
        }
        if( theme === 'light' ) {
            src = 'img/moon.svg';
            alt = 'moon';
            param = 'dark';
            style = 'svgmoon';
        }
        icon.setAttribute("src", src);
        icon.setAttribute("alt", alt);
        icon.setAttribute("id", 'themeIcon');
        icon.onclick=function(){toggleTheme(param)};
        icon.classList.add(style);
        icon.classList.add(animation);
        trigger.appendChild(icon);
        setTimeout(function(){
            icon.classList.remove(animation);
        }, 10);
    }, 500);
}

function changeThemeStyle(theme) {
    let themeStyle = document.getElementById('themeStyle');
    if(localStorage.getItem('theme') === undefined) {
        localStorage.setItem('theme', 'css/light.css');
    }
    if( theme === 'light') {
        themeStyle.setAttribute('href', 'css/light.css');
        localStorage.setItem('theme', 'css/light.css');
    } else {
        themeStyle.setAttribute('href', 'css/dark.css')
        localStorage.setItem('theme', 'css/dark.css');
    }
}

function leaveRoom() {
    socket.disconnect();
}


//////////////////////////////////////////////////////////////////////
//socket communication////////////////////////////////////////////////
socket.on('bannermessage', (message) => {
    showBannermessage(message);
});

socket.on('newRoom', (newRoom) => {
    userdata.roomID = newRoom;
    //Object.freeze(userdata);
    document.getElementById('roomID').innerHTML = userdata.roomID;
});

socket.on('validation', (validation) => {
    console.log('validation', validation);
    if ( validation === true ) {
        setLobby();
    }
    else {
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

// Recieve Validation from another User
socket.on('newEstimation', (user) => {
    console.log(user.estimation);
    document.getElementById(user.id).innerHTML = user.estimation;
});

socket.on('reveal', (foo) => {
    revealEstimations();
});

socket.on('emptyList', (foo) => {
    clearList();
});

export {
    socket,
    setUserdata,
    getTheme,
    checkRooms,
    leaveRoom
}
export default app;