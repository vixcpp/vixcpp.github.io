---
title: Production Files
description: Describe how Vix uses project metadata to operate C++ applications in production.
---

# Production Files

Production files are the project-level metadata that tell Vix how an application should be operated after it has been built. They describe the service name, runtime environment, health endpoints, proxy settings, logs, deployment steps, database storage, and WebSocket checks that belong to the project.

This part of Vix is useful beyond generated templates. A project created with `vix new --template backend` or `vix new --template web` already includes production-oriented defaults, but the same idea can be used in an existing C++ project, a custom CMake project, or a Vix project that does not follow the generated template layout. The application keeps its own structure; Vix only needs enough metadata to run, check, and maintain it consistently.

## Why production files exist

Building a C++ executable is only one part of preparing an application for production. Once the binary exists, the project still needs a working directory, a service process, runtime variables, a reverse proxy, health checks, logs, and a repeatable deployment path. Without a shared project file, these details often end up spread across server notes, shell history, systemd units, Nginx files, and personal deployment habits.

Vix production files bring those operational details back into the project. The goal is not to hide Linux, systemd, Nginx, or CMake from the developer. The goal is to make the relationship between the application and its production environment explicit enough that Vix can inspect it, generate parts of it, and run checks without guessing.

## The main files

A production-ready Vix project usually works with these files:

```txt
vix.json        Project metadata, tasks, and production configuration
.env            Local runtime values and secrets
.env.example    Documented runtime variables
vix.app         Optional Vix build manifest
```

`vix.json` is the main file used by the production command family. The `.env` and `.env.example` files are used by environment checks, while `vix.app` is only required when the project uses the Vix application manifest workflow. An existing CMake project can still use `vix.json` for production commands without adopting `vix.app`.

## The production section

Production configuration lives under the `production` key in `vix.json`.

```json
{
  "name": "myapp",
  "production": {
    "service": {},
    "proxy": {},
    "health": {},
    "logs": {},
    "deploy": {},
    "env": {},
    "websocket": {}
  }
}
```

Each section is read by a specific command. A project does not need to fill every section immediately. A small application can start with service and health metadata, then add proxy, logs, deploy, environment, database, or WebSocket configuration when those parts become real in the deployment.

## Minimal production configuration

This example describes a C++ application named `myapp`. The binary is expected at `bin/myapp`, the local HTTP server listens on port `8080`, and the application exposes a health endpoint at `/health`.

```json
{
  "name": "myapp",
  "version": "0.1.0",
  "type": "application",

  "production": {
    "service": {
      "name": "myapp",
      "user": "deploy",
      "working_dir": ".",
      "exec": "bin/myapp",
      "restart": "always",
      "restart_sec": 3,
      "limit_nofile": 65535
    },

    "health": {
      "service": "myapp",
      "local": "http://127.0.0.1:8080/health",
      "expected_status": 200,
      "timeout_ms": 2000,
      "max_response_ms": 1000
    },

    "logs": {
      "service": "myapp",
      "nginx_access": "/var/log/nginx/myapp.access.log",
      "nginx_error": "/var/log/nginx/myapp.error.log",
      "lines": 120
    },

    "deploy": {
      "pull": true,
      "branch": "main",
      "build": "vix build",
      "tests": false,
      "test_command": "vix tests",
      "service": "myapp",
      "health_local": true,
      "health_public": false,
      "proxy_check": false,
      "proxy_reload": false,
      "logs_on_failure": true,
      "log_lines": 80,
      "rollback": false
    },

    "env": {
      "required": ["APP_NAME", "APP_ENV", "SERVER_PORT"]
    }
  }
}
```

The values should describe the real deployment. The service name should match the systemd service, the executable path should point to the binary that will actually run, and the health URL should match an endpoint exposed by the application.

## Commands that read production files

The production commands use `vix.json` as their source of project context. Each command reads the section it needs and then performs one focused operation.

```bash
vix env check --production
vix health
vix logs
vix deploy --dry-run
vix production validate
vix production status
```

`vix health` reads `production.health` and checks the configured local, public, or WebSocket endpoint. `vix logs` reads `production.logs` and inspects the application or proxy logs. `vix deploy` reads `production.deploy` and executes the configured deployment steps. `vix production validate` combines deployment, proxy, and health checks to catch configuration problems before a real deployment.

Proxy commands read the proxy configuration:

```bash
vix proxy nginx init
vix proxy nginx check
vix proxy nginx reload
vix proxy nginx certbot
```

These commands are intended for Linux production servers where Nginx and systemd are part of the deployment environment.

## Environment files

`.env` contains runtime values for the local or deployed application. `.env.example` documents the variables the project expects. Vix can compare both files and check that required production variables are present.

```bash
vix env check
vix env check --production
```

A typical `.env.example` should contain names, ports, database settings, public file paths, template paths, logging options, and other values the application reads at runtime.

```dotenv
APP_NAME=myapp
APP_ENV=production
SERVER_PORT=8080
PUBLIC_PATH=public
VIEWS_PATH=views
DATABASE_ENGINE=sqlite
DATABASE_SQLITE_PATH=storage/myapp.db
```

The production environment check can also compare the project requirements with the service environment when systemd information is available.

## Database configuration

Database configuration is read from the top-level `database` object in `vix.json`. It is separate from the `production` object because database operations are useful both locally and in production.

```json
{
  "name": "myapp",

  "database": {
    "engine": "sqlite",
    "sqlite": {
      "path": "storage/myapp.db"
    },
    "storage": "storage",
    "migrations": "migrations"
  }
}
```

With this configuration, Vix can inspect the SQLite storage state, apply file-based migrations, and create backups.

```bash
vix db status
vix db migrate
vix db backup
```

The current database workflow is focused on SQLite. It checks the database path, storage directory, WAL and SHM sidecar files, and migrations directory before running operations that depend on them.

## WebSocket configuration

Projects that expose a WebSocket endpoint can describe the local and public WebSocket settings in `production.websocket`.

```json
{
  "production": {
    "websocket": {
      "host": "127.0.0.1",
      "port": 9090,
      "path": "/ws",
      "local_url": "ws://127.0.0.1:9090/ws",
      "public_url": "wss://example.com/ws",
      "timeout_ms": 3000,
      "heartbeat": true
    }
  }
}
```

The WebSocket checker can then use the configured URL, or a URL passed directly from the command line.

```bash
vix ws check
vix ws check ws://127.0.0.1:9090/ws
```

This is useful when the HTTP application and the WebSocket server are separate processes, or when the WebSocket endpoint is routed through Nginx.

## Using production files with generated templates

The backend and web templates generate production metadata because they are intended to become deployable applications. After creating a project, the usual workflow is to copy the environment file, review the generated values, and check the project before deployment.

```bash
vix new myapp --template backend
cd myapp

cp .env.example .env
vix env check
vix build
vix health
```

The generated configuration is a starting point. Before using it on a server, adjust the service name, user, working directory, executable path, domain, ports, health URLs, log paths, and required environment variables to match the real deployment.

## Using production files with an existing C++ project

An existing C++ project can use Vix production commands without changing its source layout. The project only needs a `vix.json` that describes how it builds and how the deployed process should be operated.

```json
{
  "name": "legacy-api",

  "production": {
    "service": {
      "name": "legacy-api",
      "user": "deploy",
      "working_dir": "/srv/legacy-api",
      "exec": "/srv/legacy-api/build/legacy-api"
    },

    "deploy": {
      "pull": true,
      "branch": "main",
      "build": "cmake --build build --config Release",
      "tests": true,
      "test_command": "ctest --test-dir build --output-on-failure",
      "service": "legacy-api",
      "health_local": true,
      "proxy_check": true,
      "logs_on_failure": true
    },

    "health": {
      "service": "legacy-api",
      "local": "http://127.0.0.1:8080/health"
    }
  }
}
```

In this setup, Vix does not need to own the build system. The deploy step can call CMake, Ninja, Make, a shell script, or any command that correctly builds the project. Vix simply runs the configured workflow and uses the same metadata for health checks, logs, service validation, and proxy checks.

## A practical first workflow

Start with the smallest useful production file. Add the project name, service metadata, and one local health endpoint. Once that works, add logs and deployment. Add proxy configuration only when the domain and Nginx setup are ready.

```bash
vix env check --production
vix deploy --dry-run
vix health local
vix production validate
```

A good production file should describe real infrastructure. Placeholder domains, unused ports, and copied service names make the commands less useful because Vix can only validate what the project tells it. Keep the file close to the way the application actually runs.

## Next step

Continue with the service documentation to define how Vix installs, starts, restarts, and checks the application process.
