# Vue.js Template

The Vue template creates a combined project with a Vue frontend and a Vix C++ backend. The frontend lives in `frontend/` and is managed by Vite. The backend remains a normal Vix application and serves the API that the Vue app can call during development or after deployment.

Use this template when the browser interface should be a Vue application, but the backend should stay in C++ with Vix.

```bash id="vue-template-create"
vix new dashboard --template vue
```

After creation, the normal first workflow is:

```bash id="vue-template-first-workflow"
cd dashboard
npm install --prefix frontend
vix dev
```

## What this template is for

The Vue template is for projects where the frontend and backend are developed together but keep separate responsibilities. Vue owns the browser UI, components, client-side state, and frontend build. Vix owns the C++ backend, API routes, build workflow, and project orchestration.

This is different from the web template. The web template renders HTML directly from the Vix backend using `views/`. The Vue template gives the browser its own frontend application under `frontend/`, and that frontend talks to the backend through API routes.

```txt id="vue-template-responsibility-map"
frontend/  -> Vue application
src/       -> Vix C++ backend
vix.app    -> backend target manifest
vix.json   -> project tasks and Vue/Vix workflow
```

## Generated project shape

A generated Vue project follows this general layout:

```txt id="vue-template-layout"
dashboard/
  src/
    main.cpp

  include/
    app/
      ModuleRegistry.hpp

  frontend/
    package.json
    index.html
    vite.config.js
    src/
      main.js
      App.vue

  tests/
  vix.app
  vix.json
  README.md
```

The exact backend files can follow the application template shape, because the Vue template uses a Vix backend as the server side of the project. The important part is the split: C++ backend files stay at the project root, while Vue files stay under `frontend/`.

## Backend

The backend is a Vix application. It is built and run through the normal Vix workflow.

```bash id="vue-template-backend-run"
vix build
vix run
```

The backend is described by `vix.app`.

```txt id="vue-template-vix-app-file"
vix.app
```

A small backend manifest usually describes one executable target with source files, include roots, linked Vix targets, and an output directory.

```ini id="vue-template-backend-manifest"
name = "dashboard"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
  "src/app/ModuleRegistry.cpp",
]

include_dirs = [
  "include",
  "src",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

The backend should expose API routes that the Vue frontend can call. In the generated starter project, the frontend calls an API route under `/api`.

```txt id="vue-template-api-path"
GET /api/hello
```

## Frontend

The Vue application lives under:

```txt id="vue-template-frontend-dir"
frontend/
```

The generated frontend contains a Vite project.

```txt id="vue-template-frontend-layout"
frontend/
  package.json
  index.html
  vite.config.js
  src/
    main.js
    App.vue
```

The frontend is installed with npm.

```bash id="vue-template-npm-install"
npm install --prefix frontend
```

During development, Vite serves the Vue app and proxies API requests to the Vix backend.

## Vite proxy

The generated Vite config proxies `/api` requests to the Vix backend.

```js id="vue-template-vite-config"
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  clearScreen: false,
  plugins: [vue()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
```

This lets the Vue frontend call the backend with a relative URL.

```js id="vue-template-fetch-api"
const response = await fetch("/api/hello");
```

The browser talks to the Vite dev server, and Vite forwards `/api` requests to the backend running on port `8080`.

```txt id="vue-template-dev-flow"
browser
  -> Vite dev server
      -> Vue frontend
      -> /api proxy
          -> Vix backend on localhost:8080
```

## Vue entry point

The generated frontend entry point is:

```txt id="vue-template-main-js-file"
frontend/src/main.js
```

It creates and mounts the Vue app.

```js id="vue-template-main-js"
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

The HTML entry point contains the mount element.

```html id="vue-template-index-html"
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
```

This is the normal Vite + Vue structure. Vix does not replace the Vue frontend workflow; it provides the backend side of the project.

## Generated App.vue

The starter `App.vue` calls the backend and displays the response.

```vue id="vue-template-app-vue"
<script setup>
import { ref } from "vue";

const message = ref("Loading from Vix...");

async function loadMessage() {
  try {
    const response = await fetch("/api/hello");
    const data = await response.json();
    message.value = data.message || "Hello from Vix";
  } catch (error) {
    message.value = "Could not reach the Vix backend";
  }
}

loadMessage();
</script>

<template>
  <main class="page">
    <section class="card">
      <p class="eyebrow">Vue + Vix</p>
      <h1>Frontend powered by Vue</h1>
      <p class="message">{{ message }}</p>
    </section>
  </main>
</template>
```

The example is intentionally small. Its job is to show the connection between the Vue app and the Vix backend, not to define the final frontend architecture.

## Project metadata

The generated project uses `vix.json` to describe the combined workflow.

```txt id="vue-template-vix-json-file"
vix.json
```

A generated Vue project can include frontend metadata.

```json id="vue-template-vix-json-frontend"
{
  "frontend": {
    "framework": "vue",
    "dir": "frontend",
    "dev": "npm run dev",
    "build": "npm run build",
    "dist": "frontend/dist"
  }
}
```

This tells Vix where the frontend lives, how it is started during development, and how it is built for production.

## Tasks

The Vue template also generates project tasks for frontend and backend workflows.

```json id="vue-template-vix-json-tasks"
{
  "tasks": {
    "frontend:install": {
      "description": "Install Vue dependencies",
      "command": "npm install",
      "cwd": "frontend"
    },
    "frontend:dev": {
      "description": "Start Vue dev server",
      "command": "npm run dev",
      "cwd": "frontend"
    },
    "frontend:build": {
      "description": "Build Vue frontend",
      "command": "npm run build",
      "cwd": "frontend"
    },
    "backend:dev": {
      "description": "Start Vix backend",
      "command": "vix run"
    },
    "backend:build": {
      "description": "Build Vix backend",
      "command": "vix build --preset ${preset}"
    },
    "fmt": "vix fmt",
    "check": {
      "description": "Validate backend project health",
      "command": "vix check --preset ${preset} --tests"
    },
    "test": {
      "description": "Run backend tests",
      "command": "vix tests --preset ${preset} --fail-fast"
    }
  }
}
```

This keeps the project workflow visible. Frontend commands run inside `frontend/`, while backend commands run from the project root.

## Development workflow

A normal development session starts by installing frontend dependencies.

```bash id="vue-template-install"
npm install --prefix frontend
```

Then start the project.

```bash id="vue-template-dev"
vix dev
```

In the generated workflow, `vix dev` is meant to coordinate the backend and frontend development process. The backend runs through Vix, and the Vue frontend runs through Vite.

When working manually, the two sides can also be started separately.

```bash id="vue-template-manual-backend"
vix run
```

```bash id="vue-template-manual-frontend"
npm run dev --prefix frontend
```

The frontend can then call the backend through `/api`.

## Build workflow

The backend and frontend can be built separately.

```bash id="vue-template-build-backend"
vix build
```

```bash id="vue-template-build-frontend"
npm run build --prefix frontend
```

The frontend build output is normally written under:

```txt id="vue-template-frontend-dist"
frontend/dist
```

A production project can later decide how the built frontend is served. Some projects may let a reverse proxy serve the frontend. Others may copy `frontend/dist` into the backend runtime as `public/`.

When the backend should serve the compiled Vue frontend, declare the built frontend as a runtime resource in `vix.app`.

```ini id="vue-template-dist-resource"
resources = [
  "frontend/dist=public",
]
```

That keeps the C++ source list focused on C++ files while allowing the compiled frontend to travel with the backend executable.

## API boundary

The Vue template works best when the frontend and backend communicate through clear API routes.

```txt id="vue-template-api-boundary"
Vue components
  -> fetch("/api/...")
      -> Vix backend route
          -> JSON response
```

The frontend should not depend on backend source files. The backend should not depend on Vue component files. They share an HTTP boundary, not C++ headers or JavaScript imports.

This makes the project easier to reason about. Vue can evolve as a frontend app, and Vix can evolve as a backend service.

## Difference from the web template

The web template renders HTML inside the Vix backend.

```txt id="vue-template-web-difference"
Vix route
  -> template context
  -> views/*.html
  -> HTML response
```

The Vue template uses a separate frontend application.

```txt id="vue-template-vue-difference"
Vue app
  -> API request
  -> Vix backend
  -> JSON response
```

Use the web template when the backend should render HTML directly. Use the Vue template when the browser UI should be a Vue application with its own frontend build process.

## Difference from the backend template

The backend template is API-first and generates a structured backend shell with `AppBootstrap`, route registry, middleware registry, controllers, response helpers, runtime directories, and production metadata.

The Vue template is a combined frontend/backend project. It gives the frontend its own Vue workspace and keeps the backend as the API server. If the backend side later needs the full production backend structure, use the backend template as the base and add a Vue frontend deliberately.

## Difference from the application template

The application template is the smallest Vix app shape. It is a good starting point when there is no separate frontend framework.

The Vue template adds a real frontend workspace. Use it when Vue is part of the project from the beginning, not when the project only needs a simple C++ HTTP application.

## Tests and checks

Backend tests are run through Vix.

```bash id="vue-template-tests"
vix tests
```

A stronger backend validation can use:

```bash id="vue-template-check"
vix check --tests --run
```

The frontend build should also be checked when frontend files change.

```bash id="vue-template-frontend-check"
npm run build --prefix frontend
```

A local CI-style workflow should validate both sides.

```bash id="vue-template-ci"
vix check --tests
vix tests --fail-fast
npm install --prefix frontend
npm run build --prefix frontend
```

The generated `vix.json` can expose a `ci` task that runs the backend checks and frontend build in one workflow.

## Common mistakes

The most common mistake is treating the Vue project as if it were rendered by Vix templates. Vue files under `frontend/` are handled by Vite and the Vue toolchain. Server-rendered views belong to the web template, not to the Vue template.

Another mistake is using `/public/...` URLs when the frontend is served by Vite. In Vue components, use normal frontend asset handling or public paths according to the Vite project structure.

A third mistake is calling the backend with a hard-coded development URL from components. During development, use relative `/api` paths so the Vite proxy can forward requests to the Vix backend.

```js id="vue-template-good-fetch"
fetch("/api/hello");
```

Avoid this in frontend code when the proxy is already configured:

```js id="vue-template-avoid-fetch"
fetch("http://localhost:8080/api/hello");
```

A fourth mistake is adding backend `.cpp` files and forgetting to add them to `vix.app`. The backend remains a Vix application, so its source list must still describe the files compiled into the executable.

## Recommended rule

Use the Vue template when the frontend is a real Vue application and the backend is a Vix API server. Keep Vue code under `frontend/`, keep C++ backend code under the Vix project root, use `/api` as the development boundary, let Vite handle frontend development, and let Vix handle the backend workflow.

## Next step

Continue with the generated layout to see each file created by the Vue template and how the frontend and backend sides fit together.

[Generated Layout](/templates/vue/layout)
