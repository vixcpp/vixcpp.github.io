---
title: Vue frontend with a Vix C++ backend
description: How Vix.cpp v2.6.0 introduces a full-stack development workflow with Vue, Vite, and a Vix-powered C++ backend.
date: 2026-05-21
---

# Vue frontend with a Vix C++ backend

C++ is usually seen as a systems language.
That is true, but it does not mean C++ should stay far away from modern web development workflows.
With Vix.cpp v2.6.0, we started experimenting with a full-stack development workflow where a Vue frontend can run next to a Vix-powered C++ backend.
The idea is simple:

```txt
Vue frontend
Vix C++ backend
One development workflow
```

## The problem

Modern frontend developers already have a strong workflow.
They use tools like Vue, Vite, hot reload, browser devtools, and fast feedback loops.
C++ developers often have something very different:

```txt
CMake
manual setup
build directories
compiler flags
runtime configuration
```

Both worlds are powerful, but they are usually separated.
Vix is trying to reduce that gap.

## The new workflow

A Vue + Vix project can be created with:

```bash
vix new shop --template vue
```

This generates a project with:

```txt
src/main.cpp          Vix C++ backend
frontend/             Vue frontend
frontend/src/App.vue  Vue application
vix.app               Vix application manifest
vix.json              project metadata and tasks
```

Then development starts with:

```bash
vix dev
```

In this mode, Vix starts the backend and the Vue/Vite frontend together.
The frontend runs with Vite.
The backend runs with Vix.
The API stays powered by C++.

## Why Vue?

Vue is simple, progressive, and approachable.
That matters because the goal is not to force frontend developers to abandon what they already know.
The goal is to give them a path into C++ without destroying their existing frontend experience.
A developer can keep writing Vue components while using Vix for backend APIs, performance-sensitive logic, local-first systems, networking, storage, or runtime features.

## Why not put this in vix run?

`vix run` should stay focused.
It runs the Vix application or target.
For a full development environment, the right command is:

```bash
vix dev
```

That keeps the mental model clean:

```txt
vix run    run the Vix app
vix dev    run the development environment
vix build  build the project
```

So for Vue + Vix projects:

```txt
vix run
  runs the Vix backend

vix dev
  runs the Vix backend and Vue frontend

vix build
  builds the application
```

## API proxy

During development, the Vue frontend can call:

```txt
/api/*
```

Vite proxies those requests to the Vix backend:

```txt
http://localhost:8080
```

So frontend code can stay simple:

```js
const response = await fetch("/api/hello");
const data = await response.json();
```

The browser talks to Vue.
Vue talks to `/api`.
Vix handles the backend.

## What this means for Vix.cpp

This is not about replacing Vue.
This is not about replacing Vite.
This is about making Vix a better bridge between modern frontend workflows and C++ backend development.
The long-term direction is clear:

```txt
Keep the frontend experience developers love.
Bring C++ closer to application development.
Make the workflow simple enough to try in minutes.
```

Vix.cpp v2.6.0 is a step in that direction.
