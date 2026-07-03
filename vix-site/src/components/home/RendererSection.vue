<template>
  <section class="renderer section">
    <div class="renderer__inner container">
      <div class="renderer__copy">
        <SectionTitle
          eyebrow="Template renderer"
          title="Render pages from C++ without adding a frontend framework first."
          description="Vix includes a server-side template renderer for C++ web applications. It supports variables, expressions, conditions, loops, includes, layouts, blocks, HTML escaping, caching, and streaming render paths."
        />

        <div class="renderer__text">
          <p>
            The renderer is made for projects that want server-rendered HTML
            directly from the Vix backend. A web application can keep its
            routes, controllers, views, public assets, and runtime configuration
            inside the C++ project without starting with a separate frontend
            framework.
          </p>

          <p>
            Templates are parsed into a real structure, not treated as simple
            string replacement. Vix understands variables, member access,
            arithmetic and logical expressions, filters, includes, inheritance,
            blocks, cache signatures, and automatic HTML escaping.
          </p>
        </div>

        <div class="renderer__cards">
          <article
            v-for="item in items"
            :key="item.title"
            class="renderer-card"
          >
            <span class="renderer-card__index">{{ item.index }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>
        </div>

        <a
          class="renderer__link"
          href="https://docs.vixcpp.com/modules/template"
          target="_blank"
          rel="noreferrer"
        >
          Read renderer docs
          <span aria-hidden="true">→</span>
        </a>
      </div>

      <aside class="renderer__panel" aria-label="Vix template renderer preview">
        <div class="renderer__panel-head">
          <p class="renderer__label">server-side HTML</p>
          <strong>Templates that stay inside the C++ application.</strong>
        </div>

        <div class="renderer__code">
          <pre v-pre><code>{% extends "base.html" %}
{% block content %}
  &lt;h1&gt;Hello {{ user.name }}&lt;/h1&gt;

  {% if user.admin %}
    &lt;p&gt;Admin panel enabled.&lt;/p&gt;
  {% endif %}

  {% for item in items %}
    &lt;span&gt;{{ item | upper }}&lt;/span&gt;
  {% endfor %}
{% endblock %}</code></pre>
        </div>

        <div class="renderer__flow">
          <p class="renderer__flow-label">Render path</p>

          <div
            v-for="step in flow"
            :key="step.title"
            class="renderer__flow-row"
          >
            <span>{{ step.index }}</span>

            <div>
              <strong>{{ step.title }}</strong>
              <p>{{ step.text }}</p>
            </div>
          </div>
        </div>

        <div class="renderer__checks">
          <div v-for="check in checks" :key="check" class="renderer__check">
            <span aria-hidden="true" />
            {{ check }}
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";

const items = [
  {
    index: "01",
    title: "Templates",
    text: "Render variables, conditions, loops, includes, blocks, and layouts from server-side C++ routes.",
  },
  {
    index: "02",
    title: "Expressions",
    text: "Use member access, arithmetic, comparisons, logical operators, parentheses, and filters inside templates.",
  },
  {
    index: "03",
    title: "Runtime safety",
    text: "Escape HTML by default, support safe and raw output deliberately, and invalidate cached templates when sources change.",
  },
];

const flow = [
  {
    index: "01",
    title: "Load",
    text: "Read templates from memory or from the filesystem through a loader.",
  },
  {
    index: "02",
    title: "Parse",
    text: "Build template nodes for text, variables, if blocks, loops, includes, extends, and blocks.",
  },
  {
    index: "03",
    title: "Render",
    text: "Evaluate the context, apply filters, escape output, and write the final HTML.",
  },
];

const checks = [
  "HTML escape by default",
  "include and extends support",
  "cache with source signatures",
  "classic and streaming render paths",
];
</script>

<style scoped>
.renderer {
  position: relative;
  overflow: hidden;
}

.renderer::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 18% 14%,
      rgba(34, 197, 94, 0.1),
      transparent 28rem
    ),
    radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size:
    auto,
    24px 24px;
  opacity: 0.42;
  mask-image: linear-gradient(#000, transparent 88%);
}

.renderer__inner {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.16fr) 470px;
  gap: clamp(36px, 5vw, 72px);
  align-items: center;
}

.renderer__copy {
  min-width: 0;
}

.renderer__text {
  margin-top: 28px;
  display: grid;
  gap: 18px;
  max-width: 720px;
}

.renderer__text p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.25vw, 1.08rem);
  line-height: 1.82;
}

.renderer__cards {
  margin-top: 32px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.renderer-card {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.025);
  transition:
    border-color var(--speed) var(--ease),
    background var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}

.renderer-card:hover {
  border-color: var(--green-line);
  background: rgba(34, 197, 94, 0.035);
  transform: translateY(-2px);
}

.renderer-card__index {
  display: inline-block;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.renderer-card h3 {
  margin-top: 14px;
  color: var(--text);
  font-size: 0.94rem;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.renderer-card p {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.58;
}

.renderer__link {
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

.renderer__link:hover {
  color: var(--green);
}

.renderer__panel {
  overflow: hidden;
  border: 1px solid rgba(34, 197, 94, 0.16);
  border-radius: var(--radius-lg);
  background: var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

.renderer__panel-head {
  padding: 24px 24px 20px;
  border-bottom: 1px solid rgba(34, 197, 94, 0.14);
}

.renderer__label {
  margin: 0 0 8px;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.renderer__panel-head strong {
  display: block;
  color: var(--text);
  font-size: 1.15rem;
  line-height: 1.28;
  letter-spacing: -0.03em;
}

.renderer__code {
  padding: 22px 24px;
  border-bottom: 1px solid var(--line-soft);
}

.renderer__code pre {
  margin: 0;
  overflow: auto;
  padding: 18px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.025);
  color: var(--text-soft);
  font-family: var(--font-mono);
  font-size: 0.76rem;
  line-height: 1.65;
}

.renderer__code code {
  font-family: inherit;
  white-space: pre;
}

.renderer__flow {
  display: grid;
  gap: 14px;
  padding: 22px 24px;
  border-bottom: 1px solid var(--line-soft);
}

.renderer__flow-label {
  margin: 0 0 2px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.renderer__flow-row {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 12px;
  align-items: flex-start;
}

.renderer__flow-row > span {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
}

.renderer__flow-row strong {
  display: block;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 850;
}

.renderer__flow-row p {
  margin-top: 5px;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.5;
}

.renderer__checks {
  display: grid;
  gap: 10px;
  padding: 22px 24px 24px;
}

.renderer__check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--text-soft);
  font-size: 0.84rem;
  line-height: 1.5;
}

.renderer__check span {
  width: 7px;
  height: 7px;
  margin-top: 0.45em;
  border-radius: 999px;
  background: var(--green);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.08);
  flex: 0 0 auto;
}

@media (max-width: 980px) {
  .renderer__inner {
    grid-template-columns: 1fr;
  }

  .renderer__panel {
    max-width: 720px;
  }
}

@media (max-width: 760px) {
  .renderer__cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .renderer__panel-head,
  .renderer__code,
  .renderer__flow,
  .renderer__checks {
    padding-inline: 20px;
  }

  .renderer__code pre {
    font-size: 0.72rem;
  }

  .renderer__flow-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
