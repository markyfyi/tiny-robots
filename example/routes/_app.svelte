<script>
  import { onMount } from "svelte";
  import Github from "../components/icons/Github.svelte";
  import NPM from "../components/icons/NPM.svelte";

  let ViewSource;

  onMount(() => {
    setTimeout(() => {
      import("tiny-robots/components/ViewSource.svelte").then((m) => {
        ViewSource = m.default;
      });
    }, 100);
  });

  export let pageId;
</script>

{#if ViewSource}
  <svelte:component this="{ViewSource}" pageId="{pageId}" />
{/if}

<main>
  <h1>
    <a href="/">Tiny Robots</a>
  </h1>
  <center>
    <div class="icon">
      <a href="https://github.com/mkshio/tiny-robots/tree/master/tiny-robots">
        <Github />
      </a>
    </div>
    <div class="icon">
      <a href="https://www.npmjs.com/package/tiny-robots">
        <NPM />
      </a>
    </div>
  </center>

  <slot />

  <hr />
  <h3>Sample pages</h3>
  <nav>
    <ul>
      <li><a href="/eager">eager pre-fetch</a></li>
      <li><a href="/blocking?arg=1">blocking pre-fetch</a></li>
      <li><a href="/path/">path</a></li>
      <li><a href="/secondary">secondary</a></li>
      <li><a href="/path/secondary">path secondary</a></li>
    </ul>
  </nav>
</main>

<style>
  h1 {
    text-align: center;
  }

  h1 a {
    color: unset;
    text-decoration: none;
    font-weight: 800;
  }

  main {
    max-width: var(--page-width);
    padding: var(--space-regular);
    margin: 0 auto;
  }

  nav {
    margin-bottom: var(--space-regular);
  }

  ul {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    padding: 0;
  }

  li {
    margin-right: var(--space-regular);
    margin-bottom: var(--space-regular);
    list-style-type: none;
  }

  .icon {
    fill: var(--text-color-primary);
    padding: 0px var(--space-regular);
    height: var(--icon-size);
    width: var(--icon-size);
    display: inline-block;
  }
</style>
