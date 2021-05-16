<script>
    import { createEventDispatcher } from "svelte";
    import {    leaveRoom, 
                socket, 
                copyToClipboard   } from "./main.js";

    import Button_Estimation from './Button_Estimation.svelte';
    import Banner from './Banner.svelte';
    import Userdetails from './Userdetails.svelte';

    const dispatch = createEventDispatcher();
    let roomID;
    let firstRowValues = ['0', '1', '2', '3', '5', '8'];
    let secondRowValues = ['13', '20', '40', '100', '?', 'coffee'];
    let bannermessage = '';
    let bannerIsVisible = false;
    let allUsers = [];
    let average = '';

    const leaveLobby = () => {
        leaveRoom();
        dispatch("changepage", 0);
    }

    const resetValues = () => {
        socket.emit('reset', '' );
    }

    const copyRoomID = () => {
        copyToClipboard(roomID.innerHTML);
        newMessage('Copied.');
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
        }, 3000);
    }

    const setEstimation = (e) => {
        let tempUser = allUsers.find(user => user.id === socket.id);
        Object.assign(tempUser, {estimation: e.detail, isReady: true});
        replaceUser(tempUser);
        socket.emit('estimated', e.detail);
    }

    // Recieve Estimation from another User
    socket.on('newEstimation', (user) => {
        replaceUser(user);
    });

    function replaceUser(user) {
        let index = allUsers.findIndex( u => u.id == user.id);
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
            sum = sum / count;
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
        newMessage('Values reseted.');
    }
</script>

<div class="row" style="margin-top: 15%;">
    <div class="four columns">
        <h4 class="u-pull-left">room-id: 
            <span id="roomID" class="readycolor" bind:this={roomID}>00000</span>                        
        </h4>
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
        <button class="button-primary-join u-full-width" on:click={resetValues} style="display: grid; place-items: center;">
            <img class="reloadicon" src="/img/reload.svg" alt="reload">
        </button>
    </div>
    <div class="two columns">
        <button class="button-primary-negative u-full-width" on:click={leaveLobby}>leave</button>
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
                            isReady={user.isReady}/>
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