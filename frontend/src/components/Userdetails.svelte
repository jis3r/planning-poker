<script>
    export let name;
    export let id;
    export let estimation;
    export let isReady = false;
    export let socketid;
    export let outliers;

</script>

<tr>
    {#if id === socketid}
        <td id="{id}" style="color: #33C3F0">{name}</td>
    {:else}
        <td id="{id}">{name}</td>
    {/if}
    {#if estimation !== 'spectator'}
        {#if isReady && estimation !== ''}
            <td class="estimation">
                <img src="/img/check.svg" alt="ready" style="vertical-align: middle;">
            </td>
        {:else}
            <td class="estimation">
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
            </td>
        {/if}
    {/if}
</tr>