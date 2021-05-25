<script>
    import { onMount, onDestroy } from "svelte";
    import { fade } from "svelte/transition";
    import { replace } from 'svelte-spa-router';

    import { userdata, setUserdata } from "../utils/user";
    import { copyToClipboard } from '../utils/clipboard';

    import Button_Estimation from '../components/Button_Estimation.svelte';
    import Banner from '../components/Banner.svelte';
    import Userdetails from '../components/Userdetails.svelte';
    import Modal_Leave from '../components/Modal_Leave.svelte';
    import RoomID from '../components/RoomID.svelte';

    export let params = {}

    let url = process.env.PORT || 'http://localhost:3000'
    let id;
    let firstRowValues = ['0', '1', '2', '3', '5', '8'];
    let secondRowValues = ['13', '20', '40', '100', '?', 'coffee'];
    let bannermessage = '';
    let bannerIsVisible = false;
    let members = [];
    let spectators = [];
    let average = '';
    let readyUsers = 0;
    let modal = false;
    let preReveal = true;

    onMount(() => {
        id = params.id;
        if(!socket.connected) {
            let name = localStorage.getItem('username');
            let role = localStorage.getItem('role');
            //if( name ) setUserdata(name, id, role);
            replace('/join/' + id);
        }
        socket.emit('ready');
	});

    onDestroy(() => {
        socket.disconnect();
	});

    const openModal = () => {
        bannerIsVisible = false;
        toggleModal();
    }

    const toggleModal = () => {
        let blurr = document.getElementsByClassName("content");
        for(let i = 0; i < blurr.length; i++) {
            blurr[i].classList.toggle("is-blurred");
        }
        modal = !modal;
    }

    const leaveLobby = (e) => {
        toggleModal();
        if(e.detail) {
            setTimeout(function(){
                replace('/');
            }, 10);
        }
    }

    const resetValues = () => {
        socket.emit('reset', '' );
    }

    socket.on('resetReveal', function(){
        preReveal = true;
        average = '';
    });

    socket.on('bannermessage', (message) => {
        newMessage(message)
    });

    // Get room and users
    socket.on('roomUsers', ({ /*room,*/ users }) => {
        members = [];
        spectators = [];
        members = users.filter(user => user.role === 'member');
        spectators = users.filter(user => user.role === 'spectator');
    });

    function newMessage(msg) {
        bannermessage = msg;
        bannerIsVisible = true;
        setTimeout(function(){
            bannerIsVisible = false;
        }, 1);
    }

    const setEstimation = (e) => {
        let tempUser = members.find(user => user.id === socket.id);
        let user = Object.assign( {}, tempUser );
        if( user.estimation !== e.detail ) {
            user.estimation = e.detail;
            replaceUser(user);
            socket.emit('estimated', e.detail);
        }
    }

    // Recieve Estimation from another User
    socket.on('newEstimation', (user) => {
        replaceUser(user);
    });

    function replaceUser(user) {
        let index = members.findIndex( u => u.id == user.id);
        if(members[index].estimation === '') {
            if( (members.length - 1) !== readyUsers ) user.isReady = true;
            readyUsers++; 
        } 
        members[index] = user;
    }

    socket.on('reveal', (foo) => {
        averageCalc();
        revealEstimations();
    });

    function revealEstimations() {
        preReveal = false;
    }

    function averageCalc() {
        let sum = 0;
        let count = 0;
        average = '';
        for(let i = 0; i < members.length; i++) {
            let estimation = members[i].estimation;
            if( estimation !== '' && estimation !== '?' && estimation !== 'coffee' ) {
                sum = sum + parseInt(members[i].estimation);
                count++;
            }
        }
        if(count !== 0) {
            sum = Math.round( (sum / count) * 100 ) / 100;
            average = sum.toString();
        }
    }

    socket.on('emptyList', (foo) => {
        clearList();
    });

    function clearList() {
        for(let i = 0; i < members.length; i++) {
            members[i].estimation = '';
        }
        preReveal = true;
        let button = document.getElementsByClassName('button-primary-positive');
        if(button[0] !== undefined) {
            button[0].classList.remove('button-primary-positive');
        }
        average = '';
        readyUsers = 0;
        newMessage('Estimations reseted.');
    }

    const copyRoomID = () => {
        copyToClipboard(url + '/#/room/' + id);
        newMessage('Invitation link copied.');
    }
</script>

<div class="content" in:fade>
    <div class="row" style="margin-top: 15%;">
        <div class="four columns">
            <RoomID id={id || '00000'} on:copy={copyRoomID}/>
        </div>
        <div class="four columns" id="bannerfield">
            {#if bannerIsVisible}
            <Banner msg={bannermessage} transition={true}/>
            {:else}
            <Banner msg={" "} transition={false}/>
            {/if}
        </div>
        <div class="two columns">
            <button class="button-primary-join u-full-width" style="display: grid; place-items: center;" on:click={resetValues} onclick="this.blur();">
                <!--img class="reloadicon" src="/img/rotate-cw.svg" alt="reset"-->
                reset
            </button>
        </div>
        <div class="two columns">
            <button class="button-primary-negative u-full-width" on:click={openModal}>leave</button>
        </div>
    </div>

    <div class="row" style="margin-top: 5%;">
        <div class="four columns">
            {#if members.length === 0}
                <h4> </h4>
            {:else}
                <table class="u-full-width">
                    <thead>
                        <tr>
                            <th>Members</th>
                            <th>Estimation</th>
                        </tr>
                    </thead>
                    <tbody id="playerlist">
                        {#each members as member}
                            <Userdetails name={member.username}
                                id={member.id}
                                estimation={member.estimation}
                                isReady={preReveal}
                                socketid={socket.id}/>
                        {/each}
                        <tr>
                            <td>Average</td>
                            <td id="AuMgIVUHfSHpDpgMAAAB" style="color: #FCA311">{average}</td>
                        </tr>
                    </tbody>
                </table>
            {/if}
        </div>
        <div class="six columns">
            <h4> </h4>
        </div>
        <div class="two columns">
            {#if spectators.length === 0}
                <h4> </h4>
            {:else}
                <table class="u-full-width">
                    <thead>
                        <tr>
                            <th>Spectators</th>
                        </tr>
                    </thead>
                    <tbody id="spectatorlist">
                        {#each spectators as spectator}
                            <Userdetails name={spectator.username}
                                id={spectator.id}
                                estimation={'spectator'}
                                socketid={socket.id}/>
                        {/each}
                    </tbody>
                </table>
            {/if}
        </div>
    </div>

    {#if userdata.role === 'member'}
        <div class="row" style="margin-top: 5%;">
            {#each firstRowValues as currentValue}
                <Button_Estimation value={currentValue} on:setEstimation={setEstimation}/>
            {/each}
        </div>
        <div class="row lowerrow">
            {#each secondRowValues as currentValue}
                <Button_Estimation value={currentValue} on:setEstimation={setEstimation}/>
            {/each}
        </div>
    {/if}

</div>

{#if modal}
    <Modal_Leave on:leave={leaveLobby}/>
{/if}
