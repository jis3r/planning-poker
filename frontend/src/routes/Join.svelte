<script>
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";

    import { setUserdata } from '../utils/user';
    import { validateUsername, validateRoomID } from '../utils/validate';
    import { buttonPulse  } from '../utils/animations';
    
    import Checkbox_Spectator from '../components/Checkbox_Spectator.svelte';

    export let params = {}

    let username = '';
    let roomID = '';
    let role = 'member';
    let isSpectator = false;
    let hasID = false;

    onMount(() => {
        let localname = localStorage.getItem('username');
        //isSpectator = localStorage.getItem('role');
        if( localname )  username = localname; document.getElementById('submitButton').focus();
        if( params.id ) hasID = validateRoomID(params.id);
        if( hasID ) roomID = params.id;
	});

    const setRole = (e) => {
        if( e.detail ) role = 'spectator';
        if( !e.detail ) role = 'member';
    }

    const submit = () => {
        if( validateUsername(username) && validateRoomID(roomID) ) {
            setUserdata(username, roomID, role);
        }
        else {
            buttonPulse();
        }
    }
</script>

{#if hasID}
    <div class="row" style="margin-top: 15%;" in:fade>
        <div class="nine columns">
            <input class="u-full-width" type="text" placeholder="Username" name="username" id="usernameInput" minlength="3" maxlength="20" autocomplete="off" required bind:value={username}>
            <label id="usernameLabel" for="usernameInput">Please enter your username.</label>
            <input type="hidden" name="room" id="roomIDInput" bind:value={roomID}>
        </div>
        <div class="three columns">
            <button class="button-primary button-submit u-full-width" type="submit" id="submitButton" style="transition: 500ms" on:click={submit}>submit</button>
            <Checkbox_Spectator isSpectator={isSpectator} on:setRole={setRole}/>
        </div>
    </div>
{:else}
    <div class="row" style="margin-top: 15%;" in:fade>
        <div class="five columns">
            <input class="u-full-width" type="text" placeholder="Username" name="username" id="usernameInput" minlength="3" maxlength="20" autocomplete="off" required bind:value={username}>
            <label for="usernameInput">Please enter your username.</label>
        </div>
        <div class="four columns">
            <input class="u-full-width" type="text" placeholder="12345" name="room" id="roomIDInput" minlength="5" maxlength="5" autocomplete="off" required bind:value={roomID}>
            <label for="roomIdInput">Please enter the room-id.</label>
        </div>
        <div class="three columns">
            <button class="button-primary button-submit u-full-width" type="submit" id="submitButton" style="transition: 500ms" on:click={submit}>submit input</button>
            <Checkbox_Spectator isSpectator={isSpectator} on:setRole={setRole}/>
        </div>
    </div>
{/if}