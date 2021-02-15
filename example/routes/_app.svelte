<main>
  <h1><a href="/">Tiny Robots 🤖</a></h1>

  <nav>
    <ul>
      <li><a href="/eager">eager pre-fetch</a></li>
      <li><a href="/prefetch">blocking pre-fetch</a></li>
      <li><a href="/path/">path</a></li>
      <li><a href="/secondary">secondary</a></li>
      <li><a href="/path/secondary">path secondary</a></li>
    </ul>
  </nav>

  <slot />
</main>

<style>
  h1 {
    text-align: center;
  }

  h1 a {
    color: unset;
    text-decoration: none;
  }

  main {
    max-width: 640px;
    margin: 0 auto;
    padding: 12px;
  }

  nav {
    margin-bottom: 12px;
  }

  ul {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    padding: 0;
  }

  li {
    margin-right: 12px;
    margin-bottom: 12px;
    list-style-type: none;
  }
</style>
