<script>
    export let name;
    export let id;
    export let estimation;
    export let isReady = false;
    export let socketid;
    export let outliers;
</script>


<tr>
    <td class:isSelf="{id === socketid}">{name}</td>

    {#if estimation !== 'spectator'}
        <td class="estimation">
            {#if isReady && estimation !== ''}
                <img src="/img/check.svg" alt="ready" style="vertical-align: middle;">
            {:else}
                <div class="u-pull-left">
                    {estimation}
                </div>
                {#if id === outliers.lowest.id}
                    <div class="u-pull-right">
                        <img src="/img/arrow-down.svg" alt="lowest" style="vertical-align: middle; margin-right: 2.5rem;">
                    </div>
                {:else if id === outliers.highest.id}
                    <div class="u-pull-right">
                        <img src="/img/arrow-up.svg" alt="highest" style="vertical-align: middle; margin-right: 2.5rem;">
                    </div>
                {/if}
            {/if}
        </td>
    {/if}
</tr>