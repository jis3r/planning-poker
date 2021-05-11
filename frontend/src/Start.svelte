<script>
    import { createEventDispatcher } from "svelte";
    import { setUserdata, validateInput } from "./main.js";

    const dispatch = createEventDispatcher();

    let userdata = {
        username: "",
        roomID: ""
    }
    const setLobby = (e) => {
        if( validateInput(userdata.username, "00000") ) {
            setUserdata(userdata.username, userdata.roomID);
            dispatch("changepage", 3);
            userdata.username = "";
            userdata.roomID = "";
        }
    }

</script>


<div class="row" style="margin-top: 15%;">
    <div class="nine columns">
        <input class="u-full-width" type="text" placeholder="Username" name="username" id="usernameInput" minlength="3" maxlength="20" autocomplete="off" required bind:value={userdata.username}>
        <label id="usernameLabel" for="usernameInput">Please enter your username.</label>
        <input type="hidden" name="room" id="roomIDInput" bind:value={userdata.roomID}>
    </div>
    <div class="three columns">
        <button class="button-primary button-submit u-full-width" type="submit" id="submitButton" style="transition: 500ms" on:click={setLobby}>submit</button>
    </div>
</div>