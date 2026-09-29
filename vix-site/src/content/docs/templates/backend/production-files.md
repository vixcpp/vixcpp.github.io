# Production Files

The backend template does more than create C++ source files. It also generates the files that describe how the backend is configured, checked, served, deployed, and operated. These files are not all part of the compiled target, but they are part of the project workflow.

A backend usually needs two kinds of configuration. The first kind is runtime configuration: values the process reads when it starts, such as ports, paths, database settings, logging options, and local secrets. The second kind is Vix project configuration: tasks, service metadata, proxy settings, health checks, deploy behavior, logs, and production defaults used by Vix commands.

The backend template keeps those responsibilities separated.

```txt
.env.example  -> documented runtime variables
.env          -> local runtime values and secrets
vix.json      -> Vix project workflow and production metadata
vix.app       -> C++ backend target manifest
public/       -> static runtime files in the standard backend scaffold
views/        -> template runtime files in the standard backend scaffold
storage/      -> local runtime data
```

## `.env.example`

The generated backend includes an example environment file.

```txt
.env.example
```

This file documents the variables expected by the backend at runtime. It should be committed to the repository because it explains what a developer or deployment environment needs to provide.

A generated backend environment file includes sections for the application, server, TLS, logging, storage, database, ORM, WebSocket settings, and production diagnostics. Standard backend projects also include public file and template settings. API-only backend projects omit those frontend-serving variables.

```dotenv
APP_NAME=api
APP_ENV=development

SERVER_HOST=0.0.0.0
SERVER_PORT=8080
SERVER_REQUEST_TIMEOUT=5000
SERVER_IO_THREADS=0
SERVER_SESSION_TIMEOUT_SEC=20

STORAGE_PATH=storage

DATABASE_ENGINE=sqlite
DATABASE_SQLITE_PATH=storage/api.db
DATABASE_DEFAULT_HOST=127.0.0.1
DATABASE_DEFAULT_PORT=3306
DATABASE_DEFAULT_USER=root
DATABASE_DEFAULT_PASSWORD=
DATABASE_DEFAULT_NAME=api
```

Before running the backend locally, copy the example file.

```bash
cp .env.example .env
```

The `.env` file is the local runtime file. It can contain machine-specific values and secrets, so it should not be treated the same way as `.env.example`.

## Runtime configuration

`AppBootstrap` loads runtime configuration from `.env`.

```cpp
vix::config::Config cfg{".env"};
```

The generated backend reads values from configuration when it starts. Standard backend projects read the template path, public path, public mount point, static cache settings, SPA fallback setting, and static compression settings. API-only backend projects skip those settings because they do not configure templates or static file serving.

```cpp
const std::string viewsPath = cfg.getString("templates.path", "views");
const std::string publicPath = cfg.getString("public.path", "public");
const std::string publicMount = cfg.getString("public.mount", "/");
const std::string publicIndex = cfg.getString("public.index", "index.html");
const std::string publicCacheControl =
    cfg.getString("public.cache_control", "public, max-age=3600");
const bool publicSpaFallback =
    cfg.getBool("public.spa_fallback", false);
```

The backend should not hard-code local runtime values in `main.cpp` or in random source files. Keep those values in `.env`, document them in `.env.example`, and let the bootstrap read them through configuration.

When generated with `--api-only`, the backend still reads server, storage, database, WebSocket, and diagnostics settings, but it does not read public file or view settings.

## `vix.json`

The generated backend also includes a `vix.json` file.

```txt
vix.json
```

This file describes project metadata, tasks, and production-oriented settings used by Vix commands. It is not the C++ target manifest. The C++ target belongs to `vix.app`. The project workflow belongs to `vix.json`.

A generated backend can include tasks like this:

```json
{
  "tasks": {
    "dev": "vix dev",
    "build": "vix build",
    "check": "vix check --tests --run",
    "test": "vix tests",
    "env": "vix env check",
    "health": "vix health",
    "logs": "vix logs",
    "service": "vix service status",
    "proxy": "vix proxy nginx check",
    "doctor": "vix doctor production",
    "deploy": "vix deploy",
    "orm:status": "vix orm status",
    "orm:migrate": "vix orm migrate",
    "orm:rollback": "vix orm rollback --steps 1"
  }
}
```

These tasks give the backend a repeatable project workflow. A developer does not need to remember every command shape; the project can expose common actions through named tasks.

```bash
vix task build
vix task check
vix task test
```

## Production metadata

The backend template uses `vix.json` to describe production metadata for Vix tooling. This can include service settings, ports, WebSocket settings, proxy configuration, health checks, deploy behavior, logs, required environment variables, and database defaults.

A service section can describe the process that should run in production.

```json
{
  "production": {
    "service": {
      "name": "api",
      "user": "",
      "working_dir": ".",
      "exec": "bin/api",
      "restart": "always",
      "restart_sec": 3,
      "limit_nofile": 65535
    }
  }
}
```

This does not start the service by itself. It gives Vix production commands a project-local source of information when generating or checking service configuration.

The same file can describe production ports.

```json
{
  "production": {
    "ports": {
      "http": 8080,
      "websocket": 9090
    }
  }
}
```

These values help keep production tooling consistent with the backend that was generated.

## Proxy settings

A backend often sits behind a reverse proxy such as Nginx. The generated production metadata can include proxy settings.

```json
{
  "production": {
    "proxy": {
      "type": "nginx",
      "domain": "",
      "tls": false,
      "websocket_path": "/ws",
      "certificate": "",
      "certificate_key": ""
    }
  }
}
```

The empty fields are intentional. The template cannot know the production domain, certificate paths, deployment user, or TLS setup for a real project. It gives the project a place to fill them in when deployment becomes real.

Keep local secrets and machine-specific values out of committed files when they do not belong in the repository.

## Health checks

The backend template gives health checks a first-class place in the generated workflow.

The generated controllers expose health routes.

```txt
GET /health
GET /api/health
```

The production metadata can describe how Vix should check the running service.

```json
{
  "production": {
    "health": {
      "service": "api",
      "local": "http://127.0.0.1:8080/health",
      "public": "",
      "websocket": "",
      "expected_status": 200,
      "timeout_ms": 2000,
      "max_response_ms": 1000
    }
  }
}
```

During local development, you can check the backend manually.

```bash
curl http://localhost:8080/health
```

When production tooling is used, the same project metadata can guide automated checks.

## Deploy settings

The generated `vix.json` can include a deploy section.

```json
{
  "production": {
    "deploy": {
      "pull": true,
      "branch": "main",
      "build": "vix build",
      "tests": false,
      "test_command": "vix tests",
      "service": "api",
      "health_local": true,
      "health_public": false,
      "proxy_check": true,
      "proxy_reload": false,
      "logs_on_failure": true,
      "log_lines": 80,
      "rollback": false
    }
  }
}
```

This section describes the intended deployment workflow. It keeps deployment behavior visible in the repository instead of hiding it in a one-off shell command.

The generated defaults are conservative. A real production project should review them before relying on them.

## Logs

The backend template can also describe log locations.

```json
{
  "production": {
    "logs": {
      "service": "api",
      "nginx_access": "/var/log/nginx/api.access.log",
      "nginx_error": "/var/log/nginx/api.error.log",
      "lines": 120
    }
  }
}
```

This gives Vix log-related commands a predictable source of information. It also documents where the project expects service and proxy logs to be found in production.

## Required environment variables

The generated production metadata can list required environment variables.

```json
{
  "production": {
    "env": {
      "required": [
        "APP_NAME",
        "APP_ENV",
        "SERVER_PORT",
        "DATABASE_ENGINE",
        "DATABASE_SQLITE_PATH"
      ]
    }
  }
}
```

This helps the project validate its runtime environment before deployment or production checks. Standard backend projects can also require public file variables. API-only backend projects do not require them.

```bash
vix env check
```

A backend should fail early when required runtime values are missing. It is better to catch a missing `SERVER_PORT` or database path during an environment check than after the service is already deployed.

## Database defaults

The generated backend uses SQLite defaults for local development.

```dotenv
DATABASE_ENGINE=sqlite
DATABASE_SQLITE_PATH=storage/api.db
```

The production metadata can repeat the database shape.

```json
{
  "production": {
    "database": {
      "engine": "sqlite",
      "sqlite_path": "storage/api.db",
      "migrations": "migrations"
    }
  }
}
```

This does not prevent the project from using MySQL or another database later. It gives the generated backend a simple local database story while leaving environment variables available for real deployments.

When ORM support is selected during project creation, the backend manifest can link `vix::orm`, and `.env.example` includes ORM-related variables.

```dotenv
VIX_ORM_HOST=tcp://127.0.0.1:3306
VIX_ORM_USER=root
VIX_ORM_PASS=
VIX_ORM_DB=api
VIX_ORM_DIR=migrations
VIX_ORM_TOOL=
```

## WebSocket settings

The backend template can include WebSocket configuration in `.env.example` and `vix.json`, even when WebSocket support is disabled by default.

```dotenv
WEBSOCKET_ENABLED=false
WEBSOCKET_HOST=0.0.0.0
WEBSOCKET_PORT=9090
WEBSOCKET_MAX_MESSAGE_SIZE=65536
WEBSOCKET_IDLE_TIMEOUT=60
WEBSOCKET_ENABLE_DEFLATE=true
WEBSOCKET_PING_INTERVAL=30
WEBSOCKET_AUTO_PING_PONG=true
```

The production metadata can describe how a WebSocket endpoint should be exposed.

```json
{
  "production": {
    "websocket": {
      "host": "127.0.0.1",
      "port": 9090,
      "path": "/ws",
      "local_url": "ws://127.0.0.1:9090/ws",
      "public_url": "",
      "timeout_ms": 5000,
      "heartbeat": true
    }
  }
}
```

This gives the backend a place to grow when WebSocket support becomes part of the service, without forcing it into the first running version.

## Runtime directories

The backend template creates runtime directories.

```txt
public/
views/
storage/
```

In API-only mode, only `storage/` is generated from that list because the backend does not serve static frontend files or templates.

These directories are declared as resources in `vix.app`.

```ini
resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

The resource declaration matters because the executable runs from the build output. The standard backend needs `.env`, public files, views, and storage to be available beside the built target.

API-only backends use a smaller resource list:

```ini
resources = [
  ".env=.env",
  "storage=storage",
]
```

A typical runtime output can look like this:

```txt
bin/
  api
  .env
  public/
  views/
  storage/
```

If the backend cannot find `.env` or `storage/`, check the `resources` list first. In standard backend projects, also check `public/` and `views/`. In API-only projects, those directories are intentionally absent.

## Optional production config file

Some backend template versions include a structured production configuration file.

```txt
config/production.json
```

When present, it records production defaults such as the app name, environment, server settings, logging settings, public file settings, templates path, storage path, database path, health paths, and WebSocket defaults.

This file is useful when the backend wants a structured runtime configuration document in addition to environment variables.

```json
{
  "app": {
    "name": "api",
    "env": "production"
  },
  "server": {
    "host": "0.0.0.0",
    "port": 8080
  },
  "database": {
    "engine": "sqlite",
    "sqlite_path": "storage/api.db"
  }
}
```

Avoid creating two competing sources of truth. If the project uses `config/production.json`, keep a clear rule for what belongs there and what belongs in `.env`.

A practical rule is:

```txt
config/production.json  -> structured non-secret defaults
.env                    -> local values, deployment values, and secrets
vix.json                -> Vix workflow and production orchestration metadata
```

## `vix.app` and production files

The backend target manifest remains separate from production metadata.

```txt
vix.app
```

It describes what is compiled and what runtime files are copied.

```ini
name = "api"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
  "src/api/support/HttpResponses.cpp",
  "src/api/presentation/routes/RouteRegistry.cpp",
  "src/api/presentation/middleware/MiddlewareRegistry.cpp",
  "src/api/presentation/controllers/HomeController.cpp",
  "src/api/presentation/controllers/HealthController.cpp",
]

resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

API-only backends omit `public` and `views` from this list.

```ini
resources = [
  ".env=.env",
  "storage=storage",
]
```

Do not put service metadata, proxy settings, deploy settings, or environment requirements into `vix.app`. Those belong to `vix.json` or the runtime environment.

## Local workflow

A normal local backend session starts by preparing the environment file.

```bash
cp .env.example .env
```

Then build and run.

```bash
vix build
vix run
```

Check the generated health route.

```bash
curl http://localhost:8080/health
```

Run environment and project checks when needed.

```bash
vix env check
vix check --tests --run
```

For module-based backends, run module checks before the full project check.

```bash
vix modules check
vix check --tests --run
```

## Production workflow

The generated backend exposes production-oriented tasks through `vix.json`.

```bash
vix health
vix logs
vix service status
vix proxy nginx check
vix doctor production
vix deploy
```

The exact availability of these commands depends on the installed Vix version and the production tools available on the machine. The important point is that the template gives the project a place to describe the production workflow from the start.

Before using generated production settings for a real service, review:

```txt
service name
working directory
exec path
deployment user
domain
TLS settings
proxy settings
health URLs
database values
log paths
required environment variables
```

Generated defaults are useful starting points. Production values should still be reviewed by the project owner.

## Common mistakes

The most common mistake is putting secrets into committed project files. Keep real secrets in `.env` or in the deployment environment, not in `vix.json`, `.env.example`, or committed configuration.

Another mistake is treating `vix.json` as the C++ target manifest. The backend executable is described by `vix.app`; `vix.json` describes the project workflow around it.

A third mistake is forgetting to copy `.env.example` to `.env` before running the backend. If the application cannot find configuration values or runtime paths, start by checking the local `.env` file.

A fourth mistake is removing runtime directories from `resources`. If `storage/` is needed at runtime, it must be copied beside the built target. In standard backend projects, the same applies to `public/` and `views/`; in API-only projects, those directories should not be added unless the project later starts serving files or templates.

## Recommended rule

Keep production files boring and explicit. Use `.env.example` to document runtime variables, `.env` for local and deployment values, `vix.json` for Vix workflow and production metadata, `vix.app` for the backend target, and `resources` for runtime files that must travel with the executable.

## Next step

Continue with the web template to see how Vix generates a server-rendered application with views, public assets, page routes, and a simpler production shape.

[Web Template](/templates/web)
