<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  export let pageId;

  const isBrowser = typeof window !== "undefined";

  let openPageId;

  const sources = {};

  async function fetchSource(pageId) {
    if (!pageId) {
      return;
    }

    if (sources[pageId] && !sources[pageId].error) {
      return;
    }

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

{#if openPageId}
  <div transition:fade="{{ duration: 100 }}" class="open">
    <div class="container">
      <div class="content">
        <div class="space">
          <h3 class="nospace-bottom">
            Source code for route: <em>/{pageId}</em>
          </h3>
          <div>
            <em>
              <small
                >This site was built with <a href="https://tinyrobots.mksh.io/"
                  >Tiny Robots</a
                ></small
              >
            </em>
            🤖 <em><small>#bringbackviewsource</small></em>
          </div>
        </div>
        {#if sources[openPageId] && sources[openPageId].source}
          <h4>Route</h4>
          {#if sources[openPageId].source.main}
            <pre>{sources[openPageId].source.main}</pre>
          {/if}
          <h4>Compiled route</h4>
          {#if sources[openPageId].source.compiled}
            <pre>{sources[openPageId].source.compiled}</pre>
          {/if}
          <h4>Generated entry</h4>
          {#if sources[openPageId].source.entry}
            <pre>{sources[openPageId].source.entry}</pre>
          {/if}
        {:else if sources[openPageId] && sources[openPageId].fetching}
          <em>Fetching...</em>
        {:else if sources[openPageId] && sources[openPageId].error}
          <em>Oops! Failed to fetch source code.</em>
        {:else}
          <em>Invalid page</em>
        {/if}
      </div>
      <button class="close-button" on:click="{() => (openPageId = null)}"
        >×</button
      >
    </div>
  </div>
{:else}
  <button class="open-button" on:click="{() => (openPageId = pageId)}"
    >{"<view source>"}</button
  >
{/if}

<style>
  a {
    color: rgb(0, 140, 255);
    text-decoration: none;
    font-weight: 700;
  }

  .open {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    color: #222;
    position: fixed;
    background: #ffffff99;
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
    top: 5px;
    right: 17px;
    border: none;
    background: none;
    cursor: pointer;
    font-weight: 900;
    font-size: 27px;
    border-radius: 50%;
  }

  .open-button {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #ffffff88;
    color: #222;
    backdrop-filter: blur(15px) saturate(2);
    -webkit-backdrop-filter: blur(15px) saturate(2);
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
    background: #ffffffaa;
  }

  pre {
    text-transform: none;
    background-color: #222;
    border-radius: 4px;
    padding: 24px;
    color: #fff;
    overflow: scroll;
    white-space: pre-wrap;
    font-size: 0.7rem;
  }
</style>
