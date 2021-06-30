<script>
    import { fade } from "svelte/transition";

</script>


<div class="row card" style="margin-top: 6%;" in:fade>
    <div class="six columns">
        <img src="/img/startsession.gif" alt="how to start a session" style="width:100%">
    </div>
    <div class="six columns card-text">
        <h5 style="margin-bottom: 0;"><strong>Start a session</strong></h5>
        <hr style="margin-top: 0; margin-bottom: 3%;">
        <p>To start a session, klick 'start' on the landingpage, enter your username and click 'start' again.
        <p>If you use the tool regularly, it is helpful to save the created session as a bookmark. This way you can use the same session over and over again without having to create a new one each time.</p>
    </div>
</div>

<div class="row card" in:fade>
    <div class="six columns">
        <img src="/img/joinsession.gif" alt="how to join a session" style="width:100%">
    </div>
    <div class="six columns card-text">
        <h5 style="margin-bottom: 0;"><strong>Join a session</strong></h5>
        <hr style="margin-top: 0; margin-bottom: 3%;">
        <p>To join a session manually, click 'join' on the landingpage, enter your username and a room ID and click on 'join' again. If the entered ID does not exist, a new session will be created with this ID.</p>
        <p>An existing session can not only be joined manually, but also via an invitation link. With the link you only have to enter your username to join directly.</p>
        <p>If the tool has already been used, the last used username will be pre-filled. However, you can change it every time you start or join a session.</p>
    </div>
</div>

<div class="row card" in:fade>
    <div class="six columns">
        <img src="/img/copyinvitationlink.gif" alt="how to copy an invitation link" style="width:100%">
    </div>
    <div class="six columns card-text">
        <h5 style="margin-bottom: 0;"><strong>Copy invitation link</strong></h5>
        <hr style="margin-top: 0; margin-bottom: 3%;">
        <p>To copy the invitation link for a session to the clipboard, click the copy icon next to the 'room-id'. The link can then be sent directly to team members.</p>
    </div>
</div>

<div class="row card" in:fade>
    <div class="six columns">
        <img src="/img/estimationsandreset.gif" alt="how to estimate and reset" style="width:100%">
    </div>
    <div class="six columns card-text">
        <h5 style="margin-bottom: 0;"><strong>Set and reset estimations</strong></h5>
        <hr style="margin-top: 0; margin-bottom: 3%;">
        <p>To submit an estimation, click one of the estimaiton-buttons. Until all participants have submitted their estimate, a tick appears instead of the estimation to show who is ready.</p>
        <p>As soon as each participant has made an estimation, all values ​​are revealed at the same time. The average of all numerical values ​​is displayed in orange at the bottom of the list. If there is a highest/lowest estimaiton, it will be highlighted with an arrow. If a participant joins after the reveal, all values ​​are hidden so that the new participant can submit his estimate unaffected.</p>
        <p>To reset all estimations, press the 'reset' button.</p>
    </div>
</div>

<div class="row card" in:fade>
    <div class="six columns">
        <img src="/img/joinasspectator.gif" alt="how to join as spectator" style="width:100%">
    </div>        
    <div class="six columns card-text">
        <h5 style="margin-bottom: 0;"><strong>Join as spectator</strong></h5>
        <hr style="margin-top: 0; margin-bottom: 3%;">
        <p>If you want to participate in the session without estimating, you have the opportunity to join as a spectator. To do this, simply activate the 'Join as spectator' option when joining. As a viewer you are listed separately and can only reset the estimations.</p>
    </div>
</div>

<div class="row card" in:fade>
    <div class="six columns" style="box-sizing: border-box;">
        <img src="/img/changetheme.gif" alt="how to change the theme" style="width:100%">
    </div>        
    <div class="six columns card-text">
        <h5 style="margin-bottom: 0;"><strong>Change theme</strong></h5>
        <hr style="margin-top: 0; margin-bottom: 3%;">
        <p>The theme can be changed via the theme icon (moon / sun) in the top right corner. The set preferences are saved.</p>
    </div>
</div>


<style>
    p {
        margin-bottom: 2%;
    }
    img {
        border-radius: 4px 4px 0px 0px;
    }
    .card {
        margin-bottom: 6%;
        border-radius: 4px;
        /*border: 1px solid #bbb;*/
    }
    .card-text {
        padding: 2%;
    }
    @media (min-width: 750px) {
        img {
            border-radius: 4px 0px 0px 4px;
            margin: 0;
            padding: 0;
        }

        p { 
            margin-bottom: 2%;
        }

        .card {
            padding: 1% 1% .5% 1%;
        }

        .card-text {
            padding: 0;
        }
    }

</style>