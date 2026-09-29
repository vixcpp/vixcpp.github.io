# Frontend Workflow

The Vue template keeps the frontend workflow inside `frontend/`. That directory is a normal Vite + Vue project, with its own `package.json`, development server, build command, source files, and output directory. Vix does not replace the Vue toolchain. It gives the whole project a common workflow while the frontend remains a real Vue application.

The backend stays at the project root and is managed by Vix. The frontend stays under `frontend/` and is managed by npm and Vite.

```txt id="vue-frontend-workflow-map"
project/
  src/          Vix C++ backend
  include/      backend headers
  frontend/     Vue application
  vix.app       backend target manifest
  vix.json      shared project workflow
```

## Install frontend dependencies

After creating a Vue project, install the frontend dependencies.

```bash id="vue-frontend-install"
npm install --prefix frontend
```

This command runs npm inside the `frontend/` directory without requiring you to leave the project root.

The generated `frontend/package.json` contains the Vue and Vite dependencies.

```json id="vue-frontend-package-json"
{
  "name": "dashboard-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@vitejs/plugin-vue": "latest",
    "vite": "latest",
    "vue": "latest"
  },
  "devDependencies": {}
}
```

The frontend dependencies belong to `frontend/package.json`. Backend dependencies and Vix project metadata belong to `vix.json`.

## Start the frontend during development

The generated project is designed so the frontend can be started from the project root.

```bash id="vue-frontend-dev-prefix"
npm run dev --prefix frontend
```

When using the Vix workflow, the project can also be started with:

```bash id="vue-frontend-vix-dev"
vix dev
```

In this template, `vix dev` is the command that should coordinate the development experience. The backend runs through Vix, while the Vue frontend runs through Vite. The exact behavior depends on the installed Vix version and the project tasks, but the project structure is built around that idea.

For manual debugging, the two sides can be started separately.

```bash id="vue-frontend-manual-backend"
vix run
```

```bash id="vue-frontend-manual-frontend"
npm run dev --prefix frontend
```

This is useful when you want to see backend logs and frontend logs in separate terminals.

## Vite dev server

The Vue frontend is served by Vite during development.

```txt id="vue-frontend-vite-server"
frontend/
  vite.config.js
```

The generated Vite config enables the Vue plugin and exposes the dev server on `0.0.0.0`.

```js id="vue-frontend-vite-config"
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

The important part is the API proxy. During development, requests that start with `/api` are forwarded to the Vix backend running on port `8080`.

```txt id="vue-frontend-proxy-flow"
browser
  -> Vite dev server
      -> Vue app
      -> /api request
          -> Vix backend on localhost:8080
```

This lets frontend code call the backend with relative URLs.

```js id="vue-frontend-relative-fetch"
const response = await fetch("/api/hello");
```

Do not hard-code the backend development URL inside Vue components when the proxy is already configured. Relative `/api` paths keep the frontend portable across local development and deployment setups.

## Vue source files

The generated Vue source lives under:

```txt id="vue-frontend-src-layout"
frontend/src/
  main.js
  App.vue
```

`main.js` mounts the Vue application.

```js id="vue-frontend-main-js"
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

The HTML entry point is `frontend/index.html`.

```html id="vue-frontend-index-html"
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
```

This is Vite’s frontend entry flow. It is separate from Vix server-rendered views. Files under `frontend/` are handled by the frontend toolchain, not by the Vix template engine.

## Starter component

The generated `App.vue` demonstrates the connection between Vue and the Vix backend.

```vue id="vue-frontend-app-vue"
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

This file is only a starting point. A real project can add Vue Router, stores, components, layouts, forms, API clients, and design systems in the normal Vue way. The important rule is that the frontend talks to the backend through HTTP, usually under `/api`.

## API boundary

The Vue template works best when the boundary between the frontend and backend stays clear.

```txt id="vue-frontend-api-boundary"
Vue component
  -> fetch("/api/...")
      -> Vix backend route
          -> JSON response
```

The frontend should not import backend files. The backend should not depend on Vue component internals. They can live in the same repository, but they should communicate through routes and responses.

This keeps both sides easier to change. Vue can evolve as a frontend application, and Vix can evolve as the backend API.

## Frontend tasks in `vix.json`

The generated project can expose frontend commands through `vix.json`.

```json id="vue-frontend-vix-json-tasks"
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
    }
  }
}
```

This gives the project one place to describe the common frontend workflow, while still letting npm own the actual frontend commands.

You can run the commands directly:

```bash id="vue-frontend-direct-commands"
npm install --prefix frontend
npm run dev --prefix frontend
npm run build --prefix frontend
```

Or through Vix tasks when the project uses them:

```bash id="vue-frontend-task-commands"
vix task frontend:install
vix task frontend:dev
vix task frontend:build
```

## Build the frontend

The production frontend build is created with:

```bash id="vue-frontend-build"
npm run build --prefix frontend
```

Vite writes the generated files to:

```txt id="vue-frontend-dist-dir"
frontend/dist/
```

That directory contains the compiled HTML, JavaScript, CSS, and assets produced by the Vue build.

```txt id="vue-frontend-dist-layout"
frontend/dist/
  index.html
  assets/
```

The source files in `frontend/src/` are not what should be served in production. The production artifact is `frontend/dist/`.

## Serving the built frontend

The Vue template does not force one production shape. A project can serve `frontend/dist/` with a reverse proxy, a static host, a CDN, or the Vix backend.

When the Vix backend should carry the compiled frontend as a runtime directory, declare the built output as a resource in `vix.app`.

```ini id="vue-frontend-dist-resource"
resources = [
  "frontend/dist=public",
]
```

This copies the built frontend into the backend runtime output as `public/`.

A runtime layout can then look like this:

```txt id="vue-frontend-runtime-layout"
bin/
  dashboard
  public/
    index.html
    assets/
```

This is a deployment decision. During development, the frontend is served by Vite. For production, decide how the compiled frontend should be served and make that shape explicit.

## Backend build is separate

Building the Vue frontend does not build the C++ backend.

```bash id="vue-frontend-backend-build"
vix build
```

The backend is still controlled by `vix.app`.

```ini id="vue-frontend-backend-manifest"
sources = [
  "src/main.cpp",
  "src/app/ModuleRegistry.cpp",
]
```

When you add a new backend `.cpp` file, add it to `vix.app`. When you add a new Vue component, add it under `frontend/src/` and let Vite handle it.

## Checking both sides

A complete local check should validate the backend and the frontend.

```bash id="vue-frontend-check-backend"
vix check --tests
vix tests --fail-fast
```

Then build the frontend.

```bash id="vue-frontend-check-frontend"
npm run build --prefix frontend
```

A project can expose a combined task in `vix.json`.

```json id="vue-frontend-ci-task"
{
  "tasks": {
    "ci": {
      "description": "Local CI pipeline",
      "commands": [
        "vix check --tests",
        "vix tests --fail-fast",
        "cd frontend && npm install",
        "cd frontend && npm run build"
      ]
    }
  }
}
```

This keeps the local validation path visible and repeatable.

## Adding frontend files

Vue components belong under `frontend/src/`.

```txt id="vue-frontend-components-layout"
frontend/src/
  components/
    AppHeader.vue
    UserCard.vue
  pages/
    HomePage.vue
    DashboardPage.vue
```

CSS can live inside Vue single-file components, in imported CSS files, or in a frontend asset structure chosen by the project.

```txt id="vue-frontend-assets-layout"
frontend/src/
  assets/
    main.css
    logo.svg
```

These files do not need to be listed in `vix.app`. They are part of the frontend build, not the C++ backend target.

## Adding backend API routes

When the frontend needs new data, add an API route on the backend side.

```txt id="vue-frontend-api-route-example"
GET /api/projects
```

The Vue component can call it with a relative path.

```js id="vue-frontend-api-call"
const response = await fetch("/api/projects");
const data = await response.json();
```

If the backend route is implemented in a new `.cpp` file, add that file to `vix.app`.

```ini id="vue-frontend-new-backend-source"
sources = [
  "src/main.cpp",
  "src/app/ModuleRegistry.cpp",
  "src/api/ProjectsController.cpp",
]
```

The frontend and backend stay connected through the API, but each side keeps its own build rules.

## Environment values

Frontend environment values should follow the frontend toolchain rules. Vite exposes frontend environment variables through its own conventions, usually from files such as:

```txt id="vue-frontend-vite-env-files"
frontend/.env
frontend/.env.local
```

Backend runtime values belong to the Vix backend environment.

```txt id="vue-frontend-backend-env-files"
.env
.env.example
```

Keep the distinction clear. Browser-exposed values are not secrets. Backend secrets should stay on the backend side and should not be bundled into the Vue app.

## Common mistakes

The most common mistake is adding Vue files to `vix.app`. The manifest describes the C++ backend target. Vue source files belong under `frontend/` and are compiled by Vite.

Another mistake is hard-coding `http://localhost:8080` in Vue components. Use `/api` paths so the Vite proxy can forward requests during development.

A third mistake is running only `vix build` after changing Vue files. `vix build` builds the backend. Frontend changes should be checked with the frontend build.

A fourth mistake is serving `frontend/src/` in production. The production frontend output is `frontend/dist/`.

## Recommended rule

Use npm and Vite for the Vue frontend. Use Vix for the C++ backend. Keep frontend source in `frontend/src/`, call the backend through relative `/api` routes, build the frontend into `frontend/dist/`, and only make `frontend/dist` a backend resource when the backend is responsible for serving the compiled Vue app.

## Next step

Continue with the API proxy page to understand how the generated Vite proxy connects Vue requests to the Vix backend during development.

[API Proxy](/templates/vue/backend-integration)
