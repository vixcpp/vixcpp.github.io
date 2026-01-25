<template>
  <section class="page">
    <h1>Blog</h1>

    <p class="intro">
      Updates, design notes and technical insights about Vix.cpp.
    </p>

    <div class="post">
      <h3>Why Vix.cpp exists</h3>
      <p>
        Most backend runtimes assume perfect networks.
        Vix.cpp starts from the opposite assumption.
      </p>
    </div>

    <div class="post">
      <h3>Offline-first as a systems principle</h3>
      <p>
        Offline-first is not a UX trick. It is a correctness requirement.
      </p>
    </div>
  </section>
</template>

<style scoped>
.page {
  max-width: 800px;
  margin: 0 auto;
}

.intro {
  margin-bottom: 2rem;
  color: #555;
}

.post {
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.post h3 {
  margin-bottom: 0.3rem;
}
</style>
