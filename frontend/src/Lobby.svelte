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
        allUsers = users;
    });

    function newMessage(msg) {
        bannermessage = msg;
        bannerIsVisible = true;

        setTimeout(function(){
            bannerIsVisible = false;
        }, 3000);
    }

    // Recieve Validation from another User
    socket.on('newEstimation', (user) => {
        document.getElementById(user.id).innerHTML = user.estimation;
    });

    socket.on('reveal', (foo) => {
        averageCalc();
        revealEstimations();
    });

    function revealEstimations() {
        let est = document.getElementsByClassName('estimation');
        for(let i = 0; i < est.length; i++) {
            est[i].style.opacity = 1;
        }
    }

    function averageCalc() {
        let sum = 0;
        let count = 0;
        let el = document.getElementsByClassName('estimation');
        average = '';
        for(let i = 0; i < el.length; i++) {
            let estimation = el[i].innerHTML;
            if( estimation !== '' && estimation !== '?' && estimation !== 'coffee' ) {
                sum = sum + parseInt(el[i].innerHTML);
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
        let est = document.getElementsByClassName('estimation');
        for(let i = 0; i < est.length; i++) {
            est[i].style.opacity = 0;
            est[i].innerHTML = '';
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
                            estimation={user.estimation}/>
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
    <Button_Estimation value={currentValue}/>
    {/each}
</div>
<div class="row lowerrow">
    {#each secondRowValues as currentValue}
        <Button_Estimation value={currentValue}/>
    {/each}
</div>