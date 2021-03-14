<script>
    import { createEventDispatcher } from "svelte";
    import {    leaveRoom, 
                socket, 
                copyToClipboard, 
                showBannermessage   } from "./main.js";

    import Button_Estimation from './Button_Estimation.svelte';

    const dispatch = createEventDispatcher();

    let roomID;

    let firstRowValues = ['0', '1', '2', '3', '5', '8'];

    let secondRowValues = ['13', '20', '40', '100', '?', 'coffee'];


    const leaveLobby = () => {
        leaveRoom();
        dispatch("changepage", 0);
    }

    const resetValues = () => {
        socket.emit('reset', '' );
    }

    const copyRoomID = () => {
        copyToClipboard(roomID.innerHTML);
        showBannermessage('Copied.');
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
        <h4 id="newBanner" style="text-align: center; transition-timing-function: ease-in;"> </h4>
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
    <Estimation value={currentValue}/>
    {/each}
</div>
<div class="row lowerrow">
    {#each secondRowValues as currentValue}
        <Estimation value={currentValue}/>
    {/each}
</div>