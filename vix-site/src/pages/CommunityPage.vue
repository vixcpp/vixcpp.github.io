<template>
  <div class="community-page">
    <div class="community-container">
      <RouterLink class="community-back" to="/"> ← Back to Home </RouterLink>

      <!-- ===================================================
           Header
      ==================================================== -->

      <header class="community-header">
        <h1>Community</h1>

        <p>
          The Vix.cpp community is open. Anyone can create a space where people
          using or interested in Vix.cpp can meet, exchange ideas, share
          projects, and help each other.
        </p>

        <p>
          This page lists the community spaces currently known around Vix.cpp.
          New local, language-specific, or online communities can be added as
          they appear.
        </p>
      </header>

      <!-- ===================================================
           General discussion
      ==================================================== -->

      <section class="community-section">
        <h2>General discussion</h2>

        <div class="community-entry">
          <h3>Discord</h3>

          <h4>Vix.cpp Community</h4>

          <p>
            Talk about Vix.cpp, ask questions, share projects, exchange ideas,
            and meet other people interested in C++ development.
          </p>

          <a
            href="https://discord.gg/qmGNmWpeJy"
            target="_blank"
            rel="noreferrer"
          >
            Join the Discord →
          </a>
        </div>
      </section>

      <!-- ===================================================
           Project stewardship
      ==================================================== -->

      <section class="community-section">
        <h2>Project stewardship</h2>

        <div class="community-entry">
          <h3>Softadastra</h3>

          <p>
            Vix.cpp is maintained by Softadastra, the organization responsible
            for its long-term development, infrastructure, and project
            direction.
          </p>

          <p>
            For organizational, partnership, or project-related inquiries,
            contact Softadastra directly.
          </p>

          <div class="community-links">
            <a href="mailto:softadastra@gmail.com"> Email → </a>
          </div>
        </div>
      </section>

      <!-- ===================================================
           Creator
      ==================================================== -->

      <section class="community-section">
        <h2>Creator</h2>

        <div class="community-entry">
          <h3>Gaspard Kirira</h3>

          <p>Vix.cpp was created by Gaspard Kirira.</p>

          <p>
            For personal questions, talks, collaboration, or conversations
            around Vix.cpp and C++ development, you can reach him directly.
          </p>

          <div class="community-links">
            <a
              href="https://github.com/GaspardKirira/"
              target="_blank"
              rel="noreferrer"
            >
              GitHub →
            </a>

            <a
              href="https://wa.me/256790220177"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp →
            </a>

            <a href="mailto:gaspardkirira9@gmail.com"> Email → </a>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.community-page {
  padding: clamp(3rem, 7vw, 5.5rem) 0 clamp(6rem, 10vw, 9rem);
}

.community-container {
  width: min(100% - 48px, 980px);

  margin-inline: auto;
}

/* ==========================================================
   Back
========================================================== */

.community-back {
  display: inline-block;

  margin-bottom: 2.8rem;

  color: var(--color-primary);

  font-size: 0.88rem;

  text-decoration: none;
}

.community-back:hover {
  text-decoration: underline;
}

/* ==========================================================
   Header
========================================================== */

.community-header {
  max-width: 860px;
}

.community-header h1 {
  margin: 0 0 1.6rem;

  color: var(--color-text);

  font-size: clamp(2.8rem, 5vw, 4.2rem);

  font-weight: 670;
  line-height: 1;

  letter-spacing: -0.055em;
}

.community-header p {
  max-width: 820px;

  margin: 0 0 1rem;

  color: var(--color-text-secondary);

  font-size: 1rem;
  line-height: 1.75;
}

/* ==========================================================
   Sections
========================================================== */

.community-section {
  max-width: 820px;

  margin-top: clamp(3.8rem, 7vw, 5.5rem);
}

.community-section h2 {
  margin: 0;

  color: var(--color-text);

  font-size: clamp(1.9rem, 3vw, 2.5rem);

  font-weight: 650;
  line-height: 1.15;

  letter-spacing: -0.04em;
}

/* ==========================================================
   Entries
========================================================== */

.community-entry {
  margin-top: 2rem;
}

.community-entry h3 {
  margin: 0;

  color: var(--color-text);

  font-size: 1.45rem;
  font-weight: 640;
  line-height: 1.25;
}

.community-entry h4 {
  margin: 1.15rem 0 0;

  color: var(--color-text);

  font-size: 1rem;
  font-weight: 620;
  line-height: 1.35;
}

.community-entry p {
  max-width: 720px;

  margin: 0.7rem 0 0;

  color: var(--color-text-secondary);

  font-size: 0.95rem;
  line-height: 1.72;
}

.community-entry > a {
  display: inline-block;

  margin-top: 1rem;

  color: var(--color-primary);

  font-size: 0.9rem;
  font-weight: 600;

  text-decoration: none;
}

.community-entry > a:hover {
  text-decoration: underline;
}

/* ==========================================================
   Links
========================================================== */

.community-links {
  display: flex;
  flex-wrap: wrap;

  gap: 0.8rem 1.5rem;

  margin-top: 1.25rem;
}

.community-links a {
  color: var(--color-primary);

  font-size: 0.9rem;
  font-weight: 600;

  text-decoration: none;
}

.community-links a:hover {
  text-decoration: underline;
}

/* ==========================================================
   Responsive
========================================================== */

@media (max-width: 700px) {
  .community-page {
    padding-top: 2.5rem;
  }

  .community-container {
    width: min(100% - 32px, 980px);
  }

  .community-back {
    margin-bottom: 2.2rem;
  }

  .community-section {
    margin-top: 3.5rem;
  }
}
</style>
