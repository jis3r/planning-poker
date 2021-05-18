<script>
    import { onMount } from "svelte";
    import { fade } from 'svelte/transition';

    import { setUserdata } from '../main.js';
    import { validateUsername, validateRoomID } from '../utils/validate';
    import { buttonPulse  } from '../utils/animations';



    let userdata = {
        username: "",
        roomID: ""
    }

    onMount(() => {
        let name = localStorage.getItem('username');
        if( name )  userdata.username = name; document.getElementById('submitButton').focus();
	});

    const submit = () => {
        if( validateUsername(userdata.username) && validateRoomID("00000") ) {
            setUserdata(userdata.username, userdata.roomID);
        }
        else {
            buttonPulse();
        }
    }
</script>

<div class="row" style="margin-top: 15%;" in:fade>
    <div class="nine columns">
        <input class="u-full-width" type="text" placeholder="Username" name="username" id="usernameInput" minlength="3" maxlength="20" autocomplete="off" required bind:value={userdata.username}>
        <label id="usernameLabel" for="usernameInput">Please enter your username.</label>
        <input type="hidden" name="room" id="roomIDInput" bind:value={userdata.roomID}>
    </div>
    <div class="three columns">
        <button class="button-primary button-submit u-full-width" type="submit" id="submitButton" style="transition: 500ms" on:click={submit}>submit</button>
    </div>
</div>