<template>
  <section class="page">
    <h1>Vix.cpp</h1>
    <p class="tagline">
      Modern C++ backend runtime.<br />
      Offline-first. Deterministic. Built for real networks.
    </p>

    <div class="features">
      <div class="card">
        <h3>⚡ Performance</h3>
        <p>90k+ req/s with a clean, modular C++ architecture.</p>
      </div>

      <div class="card">
        <h3>🌍 Real-world networks</h3>
        <p>Designed to survive latency, packet loss and disconnections.</p>
      </div>

      <div class="card">
        <h3>🧱 Foundation first</h3>
        <p>Not a framework. A runtime and a long-term foundation.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page {
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.tagline {
  font-size: 1.2rem;
  color: #555;
  margin-bottom: 2.5rem;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.2rem;
}

.card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
  background: #fafafa;
}

.card h3 {
  margin-top: 0;
}
</style>
