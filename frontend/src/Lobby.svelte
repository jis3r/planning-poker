<script>
    import { createEventDispatcher } from "svelte";
    import {    leaveRoom, 
                socket, 
                copyToClipboard   } from "./main.js";

    import Button_Estimation from './Button_Estimation.svelte';
    import Banner from './Banner.svelte';


    const dispatch = createEventDispatcher();

    let roomID;

    let firstRowValues = ['0', '1', '2', '3', '5', '8'];

    let secondRowValues = ['13', '20', '40', '100', '?', 'coffee'];

    let bannermessage = "";
    let bannerIsVisible = false;


    const leaveLobby = () => {
        leaveRoom();
        dispatch("changepage", 0);
    }

    const resetValues = () => {
        socket.emit('reset', '' );
        newMessage('Values reseted.');
    }

    const copyRoomID = () => {
        copyToClipboard(roomID.innerHTML);
        //showBannermessage('Copied.');
        newMessage('Copied.');
    }

    socket.on('bannermessage', (message) => {
        newMessage(message)
    });

    function newMessage(msg) {
        bannermessage = msg;
        bannerIsVisible = true;

        setTimeout(function(){
            bannerIsVisible = false;
    }, 3000);
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
            <tbody id="playerlist"></tbody>
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