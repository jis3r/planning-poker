<script>
    import { fade } from 'svelte/transition';

    import { setUserdata, validateInput } from '../main.js';

    
    let userdata = {
        username: "",
        roomID: ""
    }
    const setLobby = () => {
        if( validateInput(userdata.username, "00000") ) {
            setUserdata(userdata.username, userdata.roomID);
            userdata.username = "";
            userdata.roomID = "";
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
        <button class="button-primary button-submit u-full-width" type="submit" id="submitButton" style="transition: 500ms" on:click={setLobby}>submit</button>
    </div>
</div>