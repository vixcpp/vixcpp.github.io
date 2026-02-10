<script setup>
import DefaultTheme from "vitepress/theme";
const { Layout } = DefaultTheme;

const links = [
  { text: "Docs", href: "/docs" },
  { text: "Guides", href: "/docs/guide" },
  { text: "Registry", href: "/registry" },
  { text: "Examples", href: "/docs/examples" },
  { text: "Services", href: "/services" },
];
</script>

<template>
  <Layout>
    <template #layout-bottom>
      <footer class="vix-footerbar" role="contentinfo">
        <div class="vix-footerbar__inner">
          <div class="vix-footerbar__brand">Vix.cpp</div>

          <nav class="vix-footerbar__nav" aria-label="Footer">
            <a
              v-for="item in links"
              :key="item.text"
              class="vix-footerbar__link"
              :href="item.href"
            >
              {{ item.text }}
            </a>
          </nav>

          <div class="vix-footerbar__social" aria-label="Social links">
            <a class="vix-footerbar__icon" href="https://github.com/vixcpp" target="_blank" rel="noreferrer" aria-label="GitHub">
              <!-- GitHub -->
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path
                  d="M12 2C6.48 2 2 6.58 2 12.26c0 4.54 2.87 8.39 6.84 9.75.5.1.68-.22.68-.48
                  0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49
                  -.9-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.86
                  .09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.04 1.03-2.76
                  -.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.2 9.2 0 0 1 12 7.07c.85 0 1.71.12
                  2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.64 1.03 2.76
                  0 3.93-2.34 4.79-4.57 5.05.36.32.68.95.68 1.92 0 1.38-.01 2.5-.01 2.84
                  0 .27.18.59.69.48A10.04 10.04 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"
                />
              </svg>
            </a>

            <a class="vix-footerbar__icon" href="https://discord.gg/XXXX" target="_blank" rel="noreferrer" aria-label="Discord">
              <!-- Discord -->
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path
                  d="M20 4.5a16.3 16.3 0 0 0-4-1.3l-.2.4a15.5 15.5 0 0 1 3 1.2
                  11.9 11.9 0 0 0-3.7-1.1c-.6.8-1 1.7-1.2 2.1a14.5 14.5 0 0 0-3.8 0
                  c-.2-.4-.6-1.3-1.2-2.1A11.9 11.9 0 0 0 5.2 4.8a15.5 15.5 0 0 1 3-1.2l-.2-.4
                  a16.3 16.3 0 0 0-4 1.3C2.4 7 1.8 9.4 2 12c1.3 2 3.3 3.2 5.6 3.7
                  l.4-.6a9.4 9.4 0 0 1-1.8-.9l.4-.3c1.1.5 2.3.9 3.5 1.1a13 13 0 0 0 4.8 0
                  c1.2-.2 2.4-.6 3.5-1.1l.4.3c-.6.4-1.2.7-1.8.9l.4.6c2.3-.5 4.3-1.7 5.6-3.7
                  .3-2.6-.4-5-2-7.5ZM9.2 12.9c-.7 0-1.3-.6-1.3-1.4s.6-1.4 1.3-1.4
                  1.3.6 1.3 1.4-.6 1.4-1.3 1.4Zm5.6 0c-.7 0-1.3-.6-1.3-1.4s.6-1.4 1.3-1.4
                  1.3.6 1.3 1.4-.6 1.4-1.3 1.4Z"
                />
              </svg>
            </a>

            <a class="vix-footerbar__icon" href="https://x.com/vixcpp" target="_blank" rel="noreferrer" aria-label="X">
              <!-- X -->
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path
                  d="M18.9 2H22l-6.8 7.8L23 22h-6.7l-5.2-6.8L5.3 22H2l7.3-8.4L1.7 2h6.9l4.7 6.1L18.9 2Zm-1.2 18h1.7L7.7 3.9H5.9L17.7 20Z"
                />
              </svg>
            </a>

            <a class="vix-footerbar__icon" href="https://www.youtube.com/@vixcpp" target="_blank" rel="noreferrer" aria-label="YouTube">
              <!-- YouTube -->
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path
                  d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.9 12 4.9 12 4.9s-6 0-7.7.4
                  A2.7 2.7 0 0 0 2.4 7.2 28.3 28.3 0 0 0 2 12a28.3 28.3 0 0 0 .4 4.8
                  2.7 2.7 0 0 0 1.9 1.9c1.7.4 7.7.4 7.7.4s6 0 7.7-.4a2.7 2.7 0 0 0 1.9-1.9
                  A28.3 28.3 0 0 0 22 12a28.3 28.3 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z"
                />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </template>
  </Layout>
</template>
