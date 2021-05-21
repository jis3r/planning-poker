<script>
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";

    import { setUserdata } from '../utils/user';
    import { validateUsername, validateRoomID } from '../utils/validate';
    import { buttonPulse  } from '../utils/animations';


    export let params = {}

    let userdata = {
        username: "",
        roomID: ""
    }

    let hasID = false;

    onMount(() => {
        let name = localStorage.getItem('username');
        if( name )  userdata.username = name; document.getElementById('submitButton').focus();
        if( params.id ) hasID = validateRoomID(params.id);
        if( hasID ) userdata.roomID = params.id;
	});

    const submit = () => {
        if( validateUsername(userdata.username) && validateRoomID(userdata.roomID) ) {
            setUserdata(userdata.username, userdata.roomID);
        }
        else {
            buttonPulse();
        }
    }
</script>

{#if hasID}
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
{:else}
    <div class="row" style="margin-top: 15%;" in:fade>
        <div class="five columns">
            <input class="u-full-width" type="text" placeholder="Username" name="username" id="usernameInput" minlength="3" maxlength="20" autocomplete="off" required bind:value={userdata.username}>
            <label for="usernameInput">Please enter your username.</label>
        </div>
        <div class="four columns">
            <input class="u-full-width" type="text" placeholder="12345" name="room" id="roomIDInput" minlength="5" maxlength="5" autocomplete="off" required bind:value={userdata.roomID}>
            <label for="roomIdInput">Please enter the room-id.</label>
        </div>
        <div class="three columns">
            <button class="button-primary button-submit u-full-width" type="submit" id="submitButton" style="transition: 500ms" on:click={submit}>submit input</button>
        </div>
    </div>
{/if}