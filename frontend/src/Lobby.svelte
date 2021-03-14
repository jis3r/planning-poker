<script>
    import { createEventDispatcher } from "svelte";
    import { leaveRoom, socket, copyToClipboard, showBannermessage } from "./main.js";


    const dispatch = createEventDispatcher();

    let roomID;

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
    <div class="two columns">
        <button id="0" class="u-full-width" onclick="toggleButton(id); setEstimation('0');">0</button>
    </div>
    <div class="two columns">
        <button id="1" class="u-full-width" onclick="toggleButton(id); setEstimation('1');">1</button>
    </div>
    <div class="two columns">
        <button id="2" class="u-full-width" onclick="toggleButton(id); setEstimation('2');">2</button>
    </div>
    <div class="two columns">
        <button id="3" class="u-full-width" onclick="toggleButton(id); setEstimation('3');">3</button>
    </div>
    <div class="two columns">
        <button id="5" class="u-full-width" onclick="toggleButton(id); setEstimation('5');">5</button>
    </div>
    <div class="two columns">
        <button id="8" class="u-full-width" onclick="toggleButton(id); setEstimation('8');">8</button>
    </div>
</div>
<div class="row lowerrow">
    <div class="two columns">
        <button id="13" class="u-full-width" onclick="toggleButton(id); setEstimation('13');">13</button>
    </div>
    <div class="two columns">
        <button id="20" class="u-full-width" onclick="toggleButton(id); setEstimation('20');">20</button>
    </div>
    <div class="two columns">
        <button id="40" class="u-full-width" onclick="toggleButton(id); setEstimation('40');">40</button>
    </div>
    <div class="two columns">
        <button id="100" class="u-full-width" onclick="toggleButton(id); setEstimation('100');">100</button>
    </div>
    <div class="two columns">
        <button id="?" class="u-full-width" onclick="toggleButton(id); setEstimation('?');">?</button>
    </div>
    <div class="two columns">
        <button id="Coffee" class="u-full-width" onclick="toggleButton(id); setEstimation('coffee');">Coffee</button>
    </div>
</div>