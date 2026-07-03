<template>
  <section class="production section">
    <div class="production__inner container">
      <div class="production__copy">
        <SectionTitle
          eyebrow="Production workflow"
          title="Build the binary. Restart the service. Check the real application."
          description="Vix production files keep the operational side of a C++ application close to the project. The service, deploy flow, health endpoints, proxy, logs, environment, database, and WebSocket checks can be described from one place instead of being scattered across server notes."
        />

        <div class="production__text">
          <p>
            A production release is not only a build command. The application
            has to restart correctly, respond locally, work behind the public
            proxy, and leave useful logs when something fails.
          </p>

          <p>
            Vix reads that workflow from <code>vix.json</code>. A generated Vix
            backend can use it directly, and an existing C++ service can use the
            same production metadata without changing its source layout.
          </p>
        </div>

        <div class="production__cards">
          <article
            v-for="item in items"
            :key="item.title"
            class="production-card"
          >
            <span class="production-card__index">{{ item.index }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>
        </div>

        <a
          class="production__link"
          href="https://docs.vixcpp.com/guides/production-files/"
          target="_blank"
          rel="noreferrer"
        >
          Read production files docs
          <span aria-hidden="true">→</span>
        </a>
      </div>

      <aside class="production__panel" aria-label="Vix production workflow">
        <div class="production__panel-head">
          <p class="production__label">vix deploy</p>
          <strong>A release path declared in the project.</strong>
        </div>

        <div class="production__commands">
          <CommandLine command="vix deploy --dry-run" />
          <CommandLine command="vix deploy" />
          <CommandLine command="vix health" />
          <CommandLine command="vix production status" />
        </div>

        <div class="production__flow">
          <p class="production__flow-label">Deploy flow</p>

          <div
            v-for="(step, index) in flow"
            :key="step.title"
            class="production__flow-item"
          >
            <span class="production__flow-index">
              {{ String(index + 1).padStart(2, "0") }}
            </span>

            <div>
              <strong>{{ step.title }}</strong>
              <p>{{ step.text }}</p>
            </div>
          </div>
        </div>

        <div class="production__checks">
          <div v-for="check in checks" :key="check" class="production__check">
            <span aria-hidden="true" />
            {{ check }}
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import CommandLine from "@/components/common/CommandLine.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";

const items = [
  {
    index: "01",
    title: "Service",
    text: "Describe the systemd service name, user, working directory, executable path, restart policy, and runtime limits.",
  },
  {
    index: "02",
    title: "Health and proxy",
    text: "Check the local endpoint, public endpoint, WebSocket path, and Nginx proxy before treating a release as healthy.",
  },
  {
    index: "03",
    title: "Logs and diagnostics",
    text: "Read application logs, proxy logs, repeated errors, and deployment failure output from the same project metadata.",
  },
];

const flow = [
  {
    title: "Pull",
    text: "Fetch the configured branch when the deploy file enables it.",
  },
  {
    title: "Build",
    text: "Run the production build command for the current project.",
  },
  {
    title: "Restart",
    text: "Restart the configured service and confirm that systemd sees it as active.",
  },
  {
    title: "Verify",
    text: "Run health checks, proxy checks, and failure diagnostics before calling the deploy successful.",
  },
];

const checks = [
  "local and public health endpoints",
  "Nginx proxy configuration",
  "service status after restart",
  "recent repeated errors on failure",
];
</script>

<style scoped>
.production {
  position: relative;
  overflow: hidden;
}

.production::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 16% 10%,
      rgba(34, 197, 94, 0.1),
      transparent 26rem
    ),
    radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size:
    auto,
    24px 24px;
  opacity: 0.45;
  mask-image: linear-gradient(#000, transparent 88%);
}

.production__inner {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) 430px;
  gap: clamp(36px, 5vw, 72px);
  align-items: start;
}

.production__copy {
  min-width: 0;
}

.production__text {
  margin-top: 28px;
  display: grid;
  gap: 18px;
  max-width: 720px;
}

.production__text p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.25vw, 1.08rem);
  line-height: 1.82;
}

.production__text code {
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.92em;
}

.production__cards {
  margin-top: 32px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.production-card {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.025);
  transition:
    border-color var(--speed) var(--ease),
    background var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}

.production-card:hover {
  border-color: var(--green-line);
  background: rgba(34, 197, 94, 0.035);
  transform: translateY(-2px);
}

.production-card__index {
  display: inline-block;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.production-card h3 {
  margin-top: 14px;
  color: var(--text);
  font-size: 0.94rem;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.production-card p {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.58;
}

.production__link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 30px;
  color: var(--green-strong);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 650;
  text-decoration: none;
}

.production__link:hover {
  color: var(--green);
}

.production__panel {
  position: sticky;
  top: 84px;
  overflow: hidden;
  border: 1px solid rgba(34, 197, 94, 0.16);
  border-radius: var(--radius-lg);
  background: var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

.production__panel-head {
  padding: 24px 24px 20px;
  border-bottom: 1px solid rgba(34, 197, 94, 0.14);
}

.production__label {
  margin: 0 0 8px;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.production__panel-head strong {
  display: block;
  color: var(--text);
  font-size: 1.15rem;
  line-height: 1.28;
  letter-spacing: -0.03em;
}

.production__commands {
  display: grid;
  gap: 8px;
  padding: 22px 24px;
  border-bottom: 1px solid var(--line-soft);
}

.production__flow {
  padding: 22px 24px;
  border-bottom: 1px solid var(--line-soft);
}

.production__flow-label {
  margin: 0 0 14px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.production__flow-item {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line-soft);
}

.production__flow-item:last-child {
  border-bottom: 0;
}

.production__flow-index {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
}

.production__flow-item strong {
  display: block;
  color: var(--text);
  font-size: 0.94rem;
  font-weight: 850;
}

.production__flow-item p {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.55;
}

.production__checks {
  display: grid;
  gap: 10px;
  padding: 22px 24px 24px;
}

.production__check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--text-soft);
  font-size: 0.84rem;
  line-height: 1.5;
}

.production__check span {
  width: 7px;
  height: 7px;
  margin-top: 0.45em;
  border-radius: 999px;
  background: var(--green);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.08);
  flex: 0 0 auto;
}

@media (max-width: 980px) {
  .production__inner {
    grid-template-columns: 1fr;
  }

  .production__panel {
    position: relative;
    top: auto;
    max-width: 680px;
  }
}

@media (max-width: 760px) {
  .production__cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .production__panel-head,
  .production__commands,
  .production__flow,
  .production__checks {
    padding-inline: 20px;
  }
}
</style>
