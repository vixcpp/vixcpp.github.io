<template>
  <svg
    class="community-illustration"
    viewBox="0 0 520 360"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- ==================================================
         Background construction lines
    =================================================== -->

    <path d="M260 67V293" class="community-line community-line--ghost" />

    <path d="M118 180H402" class="community-line community-line--ghost" />

    <!-- ==================================================
         Community branches
    =================================================== -->

    <path
      d="M260 180
         C220 180 213 121 175 109"
      class="community-line"
    />

    <path
      d="M260 180
         C300 180 307 121 345 109"
      class="community-line"
    />

    <path
      d="M260 180
         C215 180 204 236 161 251"
      class="community-line"
    />

    <path
      d="M260 180
         C305 180 316 236 359 251"
      class="community-line"
    />

    <path d="M260 180V82" class="community-line" />

    <path d="M260 180V278" class="community-line" />

    <!-- ==================================================
         Branch joints
    =================================================== -->

    <circle
      cx="260"
      cy="180"
      r="7"
      class="community-joint community-joint--main"
    />

    <circle cx="175" cy="109" r="4" class="community-joint" />

    <circle cx="345" cy="109" r="4" class="community-joint" />

    <circle cx="161" cy="251" r="4" class="community-joint" />

    <circle cx="359" cy="251" r="4" class="community-joint" />

    <!-- ==================================================
         Central Vix.cpp project
    =================================================== -->

    <rect
      x="207"
      y="145"
      width="106"
      height="70"
      rx="8"
      class="community-core"
    />

    <path d="M207 166H313" class="community-core-divider" />

    <circle cx="220" cy="156" r="3" class="community-window-dot" />

    <circle
      cx="230"
      cy="156"
      r="3"
      class="community-window-dot community-window-dot--soft"
    />

    <circle
      cx="240"
      cy="156"
      r="3"
      class="community-window-dot community-window-dot--soft"
    />

    <text x="260" y="190" text-anchor="middle" class="community-core-title">
      Vix.cpp
    </text>

    <!-- ==================================================
         Developer node - top left
    =================================================== -->

    <g class="community-person">
      <circle cx="154" cy="86" r="13" class="community-head" />

      <path
        d="M132 120
           C136 103 145 97 154 97
           C163 97 172 103 176 120"
        class="community-body"
      />

      <rect
        x="121"
        y="120"
        width="67"
        height="34"
        rx="5"
        class="community-terminal"
      />

      <path d="M133 132L139 138L133 144" class="community-terminal-line" />

      <path d="M145 144H164" class="community-terminal-line" />
    </g>

    <!-- ==================================================
         Developer node - top right
    =================================================== -->

    <g class="community-person">
      <circle cx="366" cy="86" r="13" class="community-head" />

      <path
        d="M344 120
           C348 103 357 97 366 97
           C375 97 384 103 388 120"
        class="community-body"
      />

      <rect
        x="333"
        y="120"
        width="67"
        height="34"
        rx="5"
        class="community-terminal"
      />

      <path d="M345 132L351 138L345 144" class="community-terminal-line" />

      <path d="M357 144H376" class="community-terminal-line" />
    </g>

    <!-- ==================================================
         Contributor node - bottom left
    =================================================== -->

    <g class="community-person">
      <circle cx="141" cy="272" r="13" class="community-head" />

      <path
        d="M119 306
           C123 289 132 283 141 283
           C150 283 159 289 163 306"
        class="community-body"
      />

      <path d="M171 280H192" class="community-small-code" />

      <path
        d="M171 290H184"
        class="community-small-code community-small-code--soft"
      />

      <path
        d="M171 300H196"
        class="community-small-code community-small-code--soft"
      />
    </g>

    <!-- ==================================================
         Contributor node - bottom right
    =================================================== -->

    <g class="community-person">
      <circle cx="379" cy="272" r="13" class="community-head" />

      <path
        d="M357 306
           C361 289 370 283 379 283
           C388 283 397 289 401 306"
        class="community-body"
      />

      <path d="M326 280H347" class="community-small-code" />

      <path
        d="M334 290H347"
        class="community-small-code community-small-code--soft"
      />

      <path
        d="M322 300H347"
        class="community-small-code community-small-code--soft"
      />
    </g>

    <!-- ==================================================
         Open source nodes
    =================================================== -->

    <g>
      <circle cx="260" cy="66" r="18" class="community-open-node" />

      <path d="M252 66L257 71L268 60" class="community-check" />
    </g>

    <g>
      <circle cx="260" cy="294" r="18" class="community-open-node" />

      <path d="M251 294H269" class="community-terminal-line" />

      <path d="M260 285V303" class="community-terminal-line" />
    </g>
  </svg>
</template>

<style scoped>
.community-illustration {
  display: block;

  width: 100%;
  max-width: 520px;

  overflow: visible;
}

.community-line {
  stroke: rgba(74, 222, 128, 0.48);
  stroke-width: 1.7;
  stroke-linecap: round;
}

.community-line--ghost {
  stroke: rgba(74, 222, 128, 0.055);
  stroke-dasharray: 3 8;
}

.community-joint {
  fill: #07110c;

  stroke: #4ade80;
  stroke-width: 2;
}

.community-joint--main {
  fill: #22c55e;

  stroke: #86efac;

  filter: drop-shadow(0 0 7px rgba(34, 197, 94, 0.35));
}

/* core */

.community-core {
  fill: #080d0a;

  stroke: rgba(74, 222, 128, 0.45);
  stroke-width: 1.5;
}

.community-core-divider {
  stroke: rgba(255, 255, 255, 0.07);
}

.community-core-title {
  fill: #e9fff0;

  font-family: var(--font-sans);

  font-size: 17px;
  font-weight: 700;

  letter-spacing: -0.5px;
}

.community-window-dot {
  fill: #4ade80;
}

.community-window-dot--soft {
  fill: rgba(212, 252, 212, 0.22);
}

/* people */

.community-head {
  fill: #0a1510;

  stroke: #d4fcd4;
  stroke-width: 2;
}

.community-body {
  fill: none;

  stroke: rgba(212, 252, 212, 0.6);
  stroke-width: 2;
  stroke-linecap: round;
}

.community-terminal {
  fill: #080c09;

  stroke: rgba(74, 222, 128, 0.32);
  stroke-width: 1.5;
}

.community-terminal-line {
  fill: none;

  stroke: #86efac;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.community-small-code {
  stroke: #86efac;
  stroke-width: 2;
  stroke-linecap: round;
}

.community-small-code--soft {
  stroke: rgba(134, 239, 172, 0.28);
}

/* outer nodes */

.community-open-node {
  fill: #08100b;

  stroke: rgba(74, 222, 128, 0.42);
  stroke-width: 1.7;
}

.community-check {
  fill: none;

  stroke: #4ade80;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* subtle life, not constant movement */

.community-person {
  transition: opacity 180ms ease;
}

@media (prefers-reduced-motion: no-preference) {
  .community-joint--main {
    animation: community-signal 4.5s ease-in-out infinite;
  }
}

@keyframes community-signal {
  0%,
  100% {
    opacity: 0.72;
  }

  50% {
    opacity: 1;
  }
}
</style>
