<script>
    import { createEventDispatcher } from "svelte";
    import { setUserdata } from "./main.js";

    const dispatch = createEventDispatcher();

    let userdata = {
        username: "",
        roomID: ""
    }

    const setLobby = (e) => {
        setUserdata(userdata.username, userdata.roomID);
        dispatch("changepage", 3);
        userdata.username = "";
        userdata.roomID = "";
    }

</script>


<div class="row" style="margin-top: 15%;">
    <form on:submit={setLobby} autocomplete="off">
        <div class="nine columns">
            <input class="u-full-width" type="text" placeholder="Username" name="username" id="usernameInput" minlength="3" maxlength="20" required bind:value={userdata.username}>
            <label for="usernameInput">Please enter your username.</label>
            <input type="hidden" name="room" id="roomIDInput" bind:value={userdata.roomID}>
        </div>
        <div class="three columns">
            <button class="button-primary button-submit u-full-width" type="submit">submit</button>
        </div>
    </form>
</div>