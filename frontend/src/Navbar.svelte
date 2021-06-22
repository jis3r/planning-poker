<script>
    import { onMount } from "svelte";
    import { fly } from "svelte/transition";
    import { replace } from 'svelte-spa-router';


    let darktheme = true;

    const setLanding = (e) => {
        e.preventDefault();
        replace('/');
    }

    function toggleTheme() {
        darktheme = !darktheme;
        changeThemeStyle( darktheme );
    }

    onMount(() => {
        if(localStorage.getItem('theme') === 'css/light.css') {
            darktheme = false;
            changeThemeStyle( darktheme );
        }
	});

    function changeThemeStyle(darktheme) {
        let themeStyle = document.getElementById('themeStyle');
        if( localStorage.getItem('theme') === undefined ) {
            localStorage.setItem('theme', 'css/dark.css');
        }
        if( darktheme ) {
            themeStyle.setAttribute('href', 'css/dark.css');
            localStorage.setItem('theme', 'css/dark.css');
        } else {
            themeStyle.setAttribute('href', 'css/light.css')
            localStorage.setItem('theme', 'css/light.css');
        }
    }
</script>

<div class="content">
    <div id="header" class="header">
        <div on:click={setLanding} style="cursor: pointer;">
            <img src="img/logo.svg" alt="logo" class="navbaricon logo u-pull-left" style="">
            <h6 class="header-title u-pull-left" style="margin-bottom: 0">
                <strong>
                    Planning Poker
                </strong>
            </h6>
        </div>

        <div id="darkmodetrigger" class="navbaricon darkmodetrigger u-pull-right" on:click={toggleTheme}>
            {#if darktheme}
            <img id="themeIcon" src="img/sun.svg" alt="sun" in:fly="{{ y: 50, duration: 500 }}">
            {:else}
            <img id="themeIcon" src="img/moon.svg" alt="moon" in:fly="{{ y: 50, duration: 500 }}">
            {/if}
        </div>    
        <a href="https://planning-poker-qs.herokuapp.com/#/tutorial" target="_blank">
            <img src="img/help-circle.svg" alt="help" class="navbaricon icon-basic u-pull-right" style="margin-right: 1rem">        
        </a>
    </div>
</div>