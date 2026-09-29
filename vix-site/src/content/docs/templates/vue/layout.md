# Generated Layout

The Vue template generates a project with two clear parts: a Vix C++ backend at the project root and a Vue frontend under `frontend/`. The backend is built through the normal Vix workflow, while the frontend is managed by Vite and npm.

A generated project named `dashboard` follows this general shape:

```txt id="vue-layout-root"
dashboard/
  include/
    app/
      ModuleRegistry.hpp

  src/
    main.cpp
    app/
      ModuleRegistry.cpp

  frontend/
    package.json
    index.html
    vite.config.js
    src/
      main.js
      App.vue

  tests/
    test_basic.cpp

  README.md
  vix.app
  vix.json
```

The important point is the separation of responsibilities. Vue owns the browser interface. Vix owns the C++ backend. The two parts communicate through HTTP, usually under `/api`.

## Project root

The project root contains the Vix side of the application.

```txt id="vue-layout-backend-root"
dashboard/
  include/
  src/
  tests/
  vix.app
  vix.json
  README.md
```

This is where you run Vix commands.

```bash id="vue-layout-vix-commands"
vix build
vix run
vix dev
vix tests
```

The backend remains a normal Vix application. The fact that the project also has a Vue frontend does not change how the C++ target is described.

## `src/main.cpp`

The backend entry point lives in:

```txt id="vue-layout-main-cpp"
src/main.cpp
```

In the Vue template, this file starts the Vix backend and exposes API routes for the frontend.

A small generated backend usually includes a route that the Vue app can call.

```txt id="vue-layout-api-route"
GET /api/hello
```

The frontend starter page calls that route with:

```js id="vue-layout-fetch-api"
const response = await fetch("/api/hello");
```

The backend should keep API behavior behind routes like this. Vue components should not depend on C++ source files directly, and the backend should not depend on Vue component internals.

## `include/app/ModuleRegistry.hpp`

The generated project can include a module registry header.

```txt id="vue-layout-module-registry-header"
include/app/ModuleRegistry.hpp
```

The registry gives the backend one stable place for future internal module wiring.

A small Vue project may not need backend modules immediately, but the registry keeps the backend ready to grow without turning `main.cpp` into a long list of feature includes.

```txt id="vue-layout-registry-purpose"
main.cpp
  -> app::ModuleRegistry
      -> backend modules later
```

## `src/app/ModuleRegistry.cpp`

The module registry implementation lives in:

```txt id="vue-layout-module-registry-source"
src/app/ModuleRegistry.cpp
```

The default implementation can be empty or small. Its role is to provide a clean backend extension point when the project later uses app modules.

When backend modules are introduced, the registry can become the place where generated module registration is connected.

```cpp id="vue-layout-generated-modules-call"
vix::app_generated::register_app_modules(app);
```

This keeps module wiring away from the backend entry point.

## `frontend/`

The Vue application lives in:

```txt id="vue-layout-frontend-dir"
frontend/
```

This directory is a normal Vite + Vue workspace.

```txt id="vue-layout-frontend-files"
frontend/
  package.json
  index.html
  vite.config.js
  src/
    main.js
    App.vue
```

Frontend commands run from this directory, either directly or through npm’s `--prefix` option.

```bash id="vue-layout-frontend-install"
npm install --prefix frontend
```

```bash id="vue-layout-frontend-dev"
npm run dev --prefix frontend
```

The Vue frontend has its own dependency graph, dev server, and build output. Vix does not replace the Vue toolchain. It coordinates the project and owns the backend side.

## `frontend/package.json`

The frontend package file lives in:

```txt id="vue-layout-package-json"
frontend/package.json
```

It declares the Vue and Vite dependencies and provides frontend scripts.

```json id="vue-layout-package-json-example"
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
  }
}
```

This file belongs to the frontend. Backend dependencies and Vix project metadata belong in `vix.json`.

## `frontend/index.html`

The Vue HTML entry point lives in:

```txt id="vue-layout-index-html"
frontend/index.html
```

It provides the mount element for the Vue application.

```html id="vue-layout-index-html-example"
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
```

This file is handled by Vite. It is not rendered by the Vix template engine.

That distinction matters. In the Vue template, HTML under `frontend/` belongs to the Vue build. Server-rendered Vix templates belong to the web template, not to this one.

## `frontend/vite.config.js`

The Vite configuration lives in:

```txt id="vue-layout-vite-config-file"
frontend/vite.config.js
```

The generated config enables Vue and proxies API requests to the Vix backend.

```js id="vue-layout-vite-config"
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

The proxy lets Vue code call the backend with relative URLs.

```js id="vue-layout-relative-api"
fetch("/api/hello");
```

During development, the browser talks to the Vite dev server. Vite serves the Vue app and forwards `/api` requests to the Vix backend.

```txt id="vue-layout-dev-proxy-flow"
browser
  -> Vite dev server
      -> Vue app
      -> /api proxy
          -> Vix backend
```

## `frontend/src/main.js`

The Vue entry script lives in:

```txt id="vue-layout-main-js"
frontend/src/main.js
```

It mounts the Vue root component.

```js id="vue-layout-main-js-example"
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

This is standard Vue application wiring. It belongs entirely to the frontend side of the project.

## `frontend/src/App.vue`

The generated root Vue component lives in:

```txt id="vue-layout-app-vue"
frontend/src/App.vue
```

It demonstrates the API boundary by calling the Vix backend.

```vue id="vue-layout-app-vue-example"
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

The example is small because its purpose is to prove that the frontend can reach the backend. Real projects can replace it with normal Vue components, routing, state management, and frontend structure.

## `vix.app`

The root `vix.app` describes the backend executable.

```txt id="vue-layout-vix-app-file"
vix.app
```

A generated Vue project uses the same app-first manifest idea as a normal Vix application.

```ini id="vue-layout-vix-app"
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

The manifest describes the C++ backend target only. Vue files do not belong in `sources`, because they are not compiled by the C++ compiler.

## Frontend build output

When the Vue frontend is built, Vite writes the output under:

```txt id="vue-layout-dist"
frontend/dist/
```

Build it with:

```bash id="vue-layout-build-frontend"
npm run build --prefix frontend
```

The generated template does not have to decide immediately how production will serve that output. A project can serve `frontend/dist` through a reverse proxy, copy it into a deployment artifact, or let the Vix backend serve it as static files.

When the backend should carry the built frontend as a runtime resource, declare it in `vix.app`.

```ini id="vue-layout-dist-resource"
resources = [
  "frontend/dist=public",
]
```

This keeps the separation clear. Vue source files stay in `frontend/`; the compiled frontend output can become a backend runtime resource when the project needs that deployment shape.

## `vix.json`

The root `vix.json` describes the combined project workflow.

```txt id="vue-layout-vix-json-file"
vix.json
```

It can describe the frontend workspace.

```json id="vue-layout-vix-json-frontend"
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

It can also expose tasks for both sides of the project.

```json id="vue-layout-vix-json-tasks"
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
      "command": "vix build"
    }
  }
}
```

This file is where the project describes how Vue and Vix are used together. It is not a replacement for `frontend/package.json`, and it is not the backend target manifest.

## `tests/`

The generated project can include backend tests under:

```txt id="vue-layout-tests"
tests/
  test_basic.cpp
```

These tests belong to the Vix backend side of the project.

Run them with:

```bash id="vue-layout-tests-command"
vix tests
```

For a stronger backend check:

```bash id="vue-layout-check-command"
vix check --tests --run
```

Frontend validation is separate and should use the frontend toolchain.

```bash id="vue-layout-frontend-check"
npm run build --prefix frontend
```

A complete project check should validate both sides.

```bash id="vue-layout-full-check"
vix check --tests
vix tests --fail-fast
npm run build --prefix frontend
```

## `README.md`

The generated README gives the project a local starting guide.

```txt id="vue-layout-readme"
README.md
```

It should explain that the project contains a Vue frontend and a Vix backend, show how to install frontend dependencies, how to start the backend, how to start the frontend, and how the `/api` proxy works.

The README belongs to the generated project itself. These documentation pages explain the template in more detail.

## How the pieces work together

The development flow is:

```txt id="vue-layout-dev-flow"
Vix backend
  -> runs on localhost:8080
  -> exposes /api routes

Vue frontend
  -> runs through Vite
  -> calls /api
  -> Vite proxies /api to the backend
```

The file responsibilities stay separate.

```txt id="vue-layout-responsibilities"
src/                  C++ backend source
include/              C++ backend headers
frontend/src/         Vue source files
frontend/package.json frontend dependencies and scripts
frontend/vite.config.js frontend dev server and API proxy
vix.app               backend executable manifest
vix.json              combined project workflow and tasks
tests/                backend tests
```

This is the main value of the Vue template. It gives the project a real frontend workspace without hiding the backend behind frontend tooling.

## Common mistakes

The most common mistake is adding Vue files to `vix.app`. The manifest describes the C++ backend target. Vue files belong to the frontend build and should stay under `frontend/`.

Another mistake is calling the backend with a hard-coded development URL from Vue components. Use relative `/api` paths so the Vite proxy can forward requests correctly.

```js id="vue-layout-good-fetch"
fetch("/api/hello");
```

Avoid hard-coding the local backend URL in components when the proxy is already configured.

```js id="vue-layout-bad-fetch"
fetch("http://localhost:8080/api/hello");
```

A third mistake is editing Vue files and running only `vix build`. Vix builds the backend. Frontend changes should be checked with npm or through the project tasks that run the frontend build.

A fourth mistake is adding backend `.cpp` files and forgetting to list them in `vix.app`. The backend is still a Vix app, so the source list must stay accurate.

## Recommended rule

Keep the backend and frontend separate, but let them share a simple API boundary. Put C++ code in the Vix project root, put Vue code in `frontend/`, call the backend through `/api`, use Vite for frontend development, and use Vix for the backend workflow.

## Next step

Continue with the development workflow to see how the Vue frontend, Vite proxy, and Vix backend are used together during local development.

[Development Workflow](/templates/vue/frontend-workflow)
