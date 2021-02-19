<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  const isBrowser = typeof window !== "undefined";

  export let pageId;

  let openTo;

  const sources = {};

  async function fetchSource(pageId) {
    sources[pageId] = { fetching: true };

    try {
      const source = await (
        await fetch("/view-source/entries/" + pageId + ".json")
      ).json();
      sources[pageId] = { source, fetching: false };
    } catch (error) {
      sources[pageId] = { fetching: false, error: true };
    }
  }

  onMount(() => fetchSource(pageId));

  $: isBrowser && fetchSource(pageId);
</script>

{#if sources[openTo]}
  <div transition:fade="{{ duration: 100 }}" class="open">
    <div class="container">
      <div class="content">
        <h3>🤖 source code of <em>/{pageId}</em></h3>
        <h4>Route</h4>
        {#if sources[openTo].source}
          {#if sources[openTo].source.main}
            <pre>{sources[openTo].source.main}</pre>
          {/if}
          <h4>Generated entry</h4>
          {#if sources[openTo].source.entry}
            <pre>{sources[openTo].source.entry}</pre>
          {/if}
        {:else if sources[openTo].fetching}
          <em>Fetching...</em>
        {:else if sources[openTo].error}
          <em>Failed to fetch source.</em>
        {/if}
      </div>
      <button class="close-button" on:click="{() => (openTo = null)}">×</button>
    </div>
  </div>
{:else}
  <div>
    <button class="open-button" on:click="{() => (openTo = pageId)}"
      >{"<view source>"}</button
    >
  </div>
{/if}

<style>
  .open {
    position: fixed;
    background: #ffffff66;
    backdrop-filter: blur(15px) saturate(2);
    -webkit-backdrop-filter: blur(15px) saturate(2);
    border-radius: 4px;
    top: 48px;
    left: 12px;
    bottom: 48px;
    right: 12px;
    margin: 0 auto;
    max-width: 640px;
    overflow: hidden;
  }

  .container {
    position: relative;
  }

  .content {
    overflow: scroll;
    height: calc(100vh - 144px);
    padding: 24px;
  }

  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 21px;
    width: 25px;
    height: 25px;
    line-height: 25px;
    border-radius: 50%;
    background: #ffffff99;
    backdrop-filter: blur(15px) saturate(2);
    -webkit-backdrop-filter: blur(15px) saturate(2);
  }

  .open-button {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #ffffff66;
    backdrop-filter: blur(15px) saturate(2);
    border-radius: 4px;
    padding: 6px;
    font-weight: 900;
    font-size: 0.7em;
    border: none;
    cursor: pointer;
    font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
    transition: background 200ms;
  }

  .open-button:hover {
    background: #ffffff99;
  }

  pre {
    background-color: #222;
    border-radius: 4px;
    padding: 24px;
    color: #fff;
    overflow: scroll;
    white-space: pre-wrap;
    font-size: 0.7rem;
  }
</style>
