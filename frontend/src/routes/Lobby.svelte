<script>
    import { onMount, onDestroy } from "svelte";
    import { fade } from "svelte/transition";
    import { replace } from 'svelte-spa-router';

    import {    setUserdata    } from "../utils/user";
    import { copyToClipboard } from '../utils/clipboard';

    import Button_Estimation from '../components/Button_Estimation.svelte';
    import Banner from '../components/Banner.svelte';
    import Userdetails from '../components/Userdetails.svelte';
    import Modal_Leave from '../components/Modal_Leave.svelte';
    import RoomID from '../components/RoomID.svelte';

    export let params = {}

    //let url = 'http://localhost:3000'; 
    let url = 'https://planning-poker-test.herokuapp.com'
    let id;
    let firstRowValues = ['0', '1', '2', '3', '5', '8'];
    let secondRowValues = ['13', '20', '40', '100', '?', 'coffee'];
    let bannermessage = '';
    let bannerIsVisible = false;
    let allUsers = [];
    let average = '';
    let readyUsers = 0;
    let modal = false;

    onMount(() => {
        id = params.id;
        if(!socket.connected) {
            let name = localStorage.getItem('username');
            if( name ) setUserdata(name, id);
            if( !name ) replace('/join/' + id);
        }
        socket.emit('ready');
	});

    onDestroy(() => {
        socket.disconnect();
	});

    const openModal = () => {
        bannerIsVisible = false;
        toggleModal();
    }

    const toggleModal = () => {
        let blurr = document.getElementsByClassName("content");
        for(let i = 0; i < blurr.length; i++) {
            blurr[i].classList.toggle("is-blurred");
        }
        modal = !modal;
    }

    const leaveLobby = (e) => {
        toggleModal();
        if(e.detail) {
            setTimeout(function(){
                replace('/');
            }, 10);
        }
    }

    const resetValues = () => {
        socket.emit('reset', '' );
    }

    socket.on('bannermessage', (message) => {
        newMessage(message)
    });

    // Get room and users
    socket.on('roomUsers', ({ /*room,*/ users }) => {
        average = '';
        allUsers = [];
        allUsers = users;
    });

    function newMessage(msg) {
        bannermessage = msg;
        bannerIsVisible = true;
        setTimeout(function(){
            bannerIsVisible = false;
        }, 1);
    }

    const setEstimation = (e) => {
        let tempUser = allUsers.find(user => user.id === socket.id);
        let user = Object.assign( {}, tempUser );
        if( user.estimation !== e.detail ) {
            user.estimation = e.detail;
            replaceUser(user);
            socket.emit('estimated', e.detail);
        }
    }

    // Recieve Estimation from another User
    socket.on('newEstimation', (user) => {
        replaceUser(user);
    });

    function replaceUser(user) {
        let index = allUsers.findIndex( u => u.id == user.id);
        if(allUsers[index].estimation === '') {
            if( (allUsers.length - 1) !== readyUsers ) user.isReady = true;
            readyUsers++; 
        } 
        allUsers[index] = user;
    }

    socket.on('reveal', (foo) => {
        averageCalc();
        revealEstimations();
    });

    function revealEstimations() {
        for(let i = 0; i < allUsers.length; i++) {
            allUsers[i].isReady = false;
        }
    }

    function averageCalc() {
        let sum = 0;
        let count = 0;
        average = '';
        for(let i = 0; i < allUsers.length; i++) {
            let estimation = allUsers[i].estimation;
            if( estimation !== '' && estimation !== '?' && estimation !== 'coffee' ) {
                sum = sum + parseInt(allUsers[i].estimation);
                count++;
            }
        }
        if(count !== 0) {
            sum = Math.round( (sum / count) * 100 ) / 100;
            average = sum.toString();
        }
    }

    socket.on('emptyList', (foo) => {
        clearList();
    });

    function clearList() {
        for(let i = 0; i < allUsers.length; i++) {
            allUsers[i].estimation = '';
            allUsers[i].isReady = false;
        }
        let button = document.getElementsByClassName('button-primary-positive');
        if(button[0] !== undefined) {
            button[0].classList.remove('button-primary-positive');
        }
        average = '';
        readyUsers = 0;
        newMessage('Values reseted.');
    }

    const copyRoomID = () => {
        copyToClipboard(url + '/#/room/' + id);
        newMessage('Copied.');
    }
</script>

<div class="content" in:fade>
    <div class="row" style="margin-top: 15%;">
        <div class="four columns">
            <RoomID id={id || '00000'}/>
            <div class="copyicon u-pull-left">
                <img src="/img/copy.svg" alt="copy" on:click={copyRoomID}>
            </div>
        </div>
        <div class="four columns" id="bannerfield">
            {#if bannerIsVisible}
            <Banner msg={bannermessage} transition={true}/>
            {:else}
            <Banner msg={" "} transition={false}/>
            {/if}
        </div>
        <div class="two columns">
            <button class="button-primary-join u-full-width" style="display: grid; place-items: center;" on:click={resetValues} onclick="this.blur();">
                <img class="reloadicon" src="/img/reload.svg" alt="reload">
            </button>
        </div>
        <div class="two columns">
            <button class="button-primary-negative u-full-width" on:click={openModal}>leave</button>
        </div>
    </div>

    <div class="row" style="margin-top: 5%;">
        <div class="four columns">
            <table class="u-full-width">
                <thead>
                    <tr>
                        <th>Members</th>
                        <th>Estimation</th>
                    </tr>
                </thead>
                <tbody id="playerlist">
                    {#each allUsers as user}
                        <Userdetails name={user.username}
                                id={user.id}
                                estimation={user.estimation}
                                isReady={user.isReady}
                                socketid={socket.id}/>
                    {/each}
                    <tr>
                        <td>Average</td>
                        <td id="AuMgIVUHfSHpDpgMAAAB" style="color: #FCA311">{average}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="four columns">
            <h4> </h4>
        </div>
        <div class="three columns">
            <h4> </h4>
        </div>
    </div>

    <div class="row" style="margin-top: 5%;">
        {#each firstRowValues as currentValue}
        <Button_Estimation value={currentValue} on:setEstimation={setEstimation}/>
        {/each}
    </div>
    <div class="row lowerrow">
        {#each secondRowValues as currentValue}
            <Button_Estimation value={currentValue} on:setEstimation={setEstimation}/>
        {/each}
    </div>
</div>

{#if modal}
    <Modal_Leave on:leave={leaveLobby}/>
{/if}
