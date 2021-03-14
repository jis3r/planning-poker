<script>
    import { createEventDispatcher } from "svelte";
    import { setUserdata, checkRooms } from "./main.js";

    const dispatch = createEventDispatcher();

    let userdata = {
        username: "",
        roomID: ""
    }

    const validate = () => {
        //checkRooms(userdata.roomID);
        setUserdata(userdata.username, userdata.roomID);
        dispatch("changepage", 3);
        userdata.username = "";
        userdata.roomID = "";
    }
</script>

<div class="row" style="margin-top: 15%;">
    <form id="form" on:submit={validate} autocomplete="off">
        <div class="five columns">
            <input class="u-full-width" type="text" placeholder="Username" name="username" id="usernameInput" minlength="3" maxlength="20" required bind:value={userdata.username}>
            <label for="usernameInput">Please enter your username.</label>
        </div>
        <div class="four columns">
            <input class="u-full-width" type="text" placeholder="12345" name="room" id="roomIDInput" minlength="5" maxlength="5" required bind:value={userdata.roomID}>
            <label for="roomIdInput">Please enter the room-id.</label>
        </div>
        <div class="three columns">
            <button class="button-primary button-submit u-full-width" type="submit">submit input</button>
        </div>
    </form>
</div>