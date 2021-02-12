<main>
  <a href="/"><h1>hyperlab template</h1></a>

  <nav>
    <ul>
      <li><a href="/prefetch">prefetch</a></li>
      <li><a href="/eager">eager prefetch</a></li>
      <li><a href="/path/">path</a></li>
      <li><a href="/secondary">secondary</a></li>
      <li><a href="/path/secondary">path secondary</a></li>
    </ul>
  </nav>

  <slot />
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 12px;
  }

  nav {
    margin-bottom: 24px;
  }

  ul {
    display: flex;
    justify-content: space-between;
  }

  li {
    list-style-type: none;
  }
</style>
