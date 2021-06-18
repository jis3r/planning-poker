<script>
    import { onMount } from "svelte";
    import { fade } from 'svelte/transition';
    import { SpinLine } from 'svelte-loading-spinners';

    import { setUserdata } from '../utils/user';
    import { validateUsername, validateRoomID } from '../utils/validate';
    import { buttonPulse  } from '../utils/animations';
    
    import Checkbox_Spectator from '../components/Checkbox_Spectator.svelte';

    let username = localStorage.getItem('username') || '';
    let roomID = '';
    let role = localStorage.getItem('role') || 'member';
    let isSpectator = false;
    let isLoading = false;

    onMount(() => {
        if( username ) document.getElementById('submitButton').focus();
        if( role === "spectator" ) isSpectator = true;
	});

    const setRole = (e) => {
        if( e.detail ) role = 'spectator';
        if( !e.detail ) role = 'member';
        localStorage.setItem('role', role);
    }

    const submit = () => {
        isLoading = true;
        if( validateUsername(username) && validateRoomID("00000") ) {
            setTimeout(() => setUserdata(username, roomID, role), 1000);
        }
        else {
            buttonPulse();
            isLoading = false;
        }
    }
</script>

<div class="row" style="margin-top: 15%;" in:fade>
    <div class="nine columns">
        <input class="u-full-width" type="text" placeholder="Username" name="username" id="usernameInput" minlength="3" maxlength="12" autocomplete="off" required bind:value={username}>
        <label id="usernameLabel" for="usernameInput">Please enter your username.</label>
        <input type="hidden" name="room" id="roomIDInput" bind:value={roomID}>
    </div>
    <div class="three columns">
        <button class="button-primary button-submit u-full-width" type="submit" id="submitButton" style="transition: 500ms" on:click={submit} onclick="this.blur();" disabled='{isLoading}'>
            {#if isLoading}
                <div style="display: inline-block; vertical-align: middle;">
                    <div class="u-pull-left">
                        <SpinLine size="50" color="#C9D1D9" duration="5s"></SpinLine>
                    </div> 
                </div>
            {:else}
                start
            {/if}
        </button>
        <Checkbox_Spectator isSpectator={isSpectator} on:setRole={setRole}/>
    </div>
</div>
