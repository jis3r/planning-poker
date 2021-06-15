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
        <img src="img/logo.svg" alt="logo" class="navbaricon logo u-pull-left" style="">
        <h6 class="header-title u-pull-left" style="margin-bottom: 0">
            <strong>
                Planning Poker
            </strong>
        </h6>

        <div id="darkmodetrigger" class="navbaricon darkmodetrigger u-pull-right" on:click={toggleTheme}>
            {#if darktheme}
            <img id="themeIcon" src="img/sun.svg" alt="sun" in:fly="{{ y: 50, duration: 500 }}">
            {:else}
            <img id="themeIcon" src="img/moon.svg" alt="moon" in:fly="{{ y: 50, duration: 500 }}">
            {/if}
        </div>
        <img src="img/templogo.svg" alt="help" class="navbaricon logo u-pull-right" style="margin-right: 1rem">        
        <img src="img/logo.svg" alt="help" class="navbaricon logo u-pull-right" style="margin-right: 1rem">        
        <a href="https://www.pm.carat.de/doku/display/Trainee/Bedienung" target="_blank">
            <img src="img/help-circle.svg" alt="help" class="navbaricon icon-basic u-pull-right" style="margin-right: 1rem">        
        </a>
    </div>
</div>

<!--

            <div class="container">
            <div class="row">
                <div class="one column navbaricon">
                    <img src="img/logo.svg" alt="logo">
                </div>
                <div class="ten columns title-column">
                    <div on:click={setLanding}>
                        <h3 class="header-title">Planning Poker</h3>
                    </div>
                </div>
                <div class="one column theme-column u-pull-right" style="height: 100%; margin-bottom: 0%;">
                    <div id="darkmodetrigger" class="navbaricon u-pull-right" on:click={toggleTheme}>
                        {#if darktheme}
                        <img id="themeIcon" src="img/sun.svg" alt="sun" in:fly="{{ y: 50, duration: 500 }}">
                        {:else}
                        <img id="themeIcon" src="img/moon.svg" alt="moon" in:fly="{{ y: 50, duration: 500 }}">
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    



-->