# Production Files

The web template generates a server-rendered Vix application, but the generated project is not only a group of C++ files and HTML templates. It also includes the files that describe how the application is configured, checked, served, and prepared for production workflows.

A web application needs a clear separation between the files used by the running process and the files used by Vix to operate the project. Runtime values belong in `.env`. Expected variables are documented in `.env.example`. The C++ target is described in `vix.app`. Project tasks and production metadata live in `vix.json`.

```txt id="web-production-files-map"
.env.example  -> documented runtime variables
.env          -> local runtime values and secrets
vix.app       -> C++ web target manifest
vix.json      -> Vix workflow and production metadata
views/        -> server-rendered HTML templates
public/       -> browser assets
storage/      -> runtime data
```

## `.env.example`

The generated web project includes an example environment file.

```txt id="web-production-env-example-file"
.env.example
```

This file documents the runtime variables expected by the application. It should be committed because it helps another developer or deployment environment understand what values the app needs.

A generated web environment file includes values such as the app name, template type, server settings, logging settings, public path, views path, template settings, storage path, and production diagnostics.

```dotenv id="web-production-env-example"
APP_NAME=site
APP_ENV=development
APP_TEMPLATE=web

SERVER_HOST=0.0.0.0
SERVER_PORT=8080
SERVER_REQUEST_TIMEOUT=5000
SERVER_IO_THREADS=0
SERVER_SESSION_TIMEOUT_SEC=20
SERVER_BENCH_MODE=false

SERVER_TLS_ENABLED=false
SERVER_TLS_CERT_FILE=
SERVER_TLS_KEY_FILE=

VIX_LOG_LEVEL=info
VIX_LOG_FORMAT=kv
LOGGING_ASYNC=true
LOGGING_QUEUE_MAX=20000
LOGGING_DROP_ON_OVERFLOW=true

PUBLIC_PATH=public
VIEWS_PATH=views
TEMPLATE_AUTO_ESCAPE_HTML=true
TEMPLATE_CACHE=true

STORAGE_PATH=storage

VIX_SERVICE_NAME=site
VIX_HEALTH_LOCAL=http://127.0.0.1:8080/health
VIX_HEALTH_PUBLIC=
VIX_PROXY_DOMAIN=
```

Before running the project locally, copy the example file.

```bash id="web-production-copy-env"
cp .env.example .env
```

The `.env` file contains the real local values. It can also contain machine-specific settings or secrets, so it should not be treated like `.env.example`.

## Runtime configuration

The generated web application loads runtime configuration from `.env`.

```cpp id="web-production-load-config"
vix::config::Config cfg{".env"};
```

The web bootstrap then creates the Vix application, configures views, mounts public files, registers middleware and routes, then starts the server.

```cpp id="web-production-bootstrap-flow"
vix::config::Config cfg{".env"};
vix::App app;

app.templates("views");
app.static_dir("public", "/");

presentation::middleware::MiddlewareRegistry::register_all(app);
presentation::routes::RouteRegistry::register_all(app);

app.run(cfg);
```

The generated template keeps the bootstrap simple. A web app needs the template directory, the public directory, the middleware stack, the route registry, and the server runtime. Values such as the server port and logging behavior should come from configuration instead of being scattered through the source tree.

## `vix.json`

The generated web project includes `vix.json`.

```txt id="web-production-vix-json-file"
vix.json
```

This file describes project metadata, common tasks, and production workflow settings used by Vix commands. It is not the C++ target manifest. The C++ target belongs in `vix.app`.

A generated web project can expose tasks such as:

```json id="web-production-vix-json-tasks"
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
    "deploy": "vix deploy"
  }
}
```

This gives the project a repeatable workflow. The command names stay short, while the actual Vix commands remain visible in the project file.

```bash id="web-production-task-commands"
vix task build
vix task check
vix task test
```

## Production metadata

The web template uses `vix.json` to keep production metadata close to the project. This can include service settings, port settings, proxy information, health checks, deploy behavior, logs, required environment variables, and web runtime defaults.

A generated service section can look like this:

```json id="web-production-service"
{
  "production": {
    "service": {
      "name": "site",
      "user": "",
      "working_dir": ".",
      "exec": "bin/site",
      "restart": "always",
      "restart_sec": 3,
      "limit_nofile": 65535
    }
  }
}
```

This does not install or start the service by itself. It gives Vix production commands a project-local description of how the service should be treated when production tooling is used.

## Ports

The generated web template uses one HTTP port by default.

```json id="web-production-ports"
{
  "production": {
    "ports": {
      "http": 8080
    }
  }
}
```

For a server-rendered web app, this is usually enough at the beginning. If the project later adds WebSocket support or another service process, the production metadata can grow when the architecture actually needs it.

## Proxy settings

A web application is often served behind a reverse proxy. The generated production metadata gives the project a place to describe that proxy.

```json id="web-production-proxy"
{
  "production": {
    "proxy": {
      "type": "nginx",
      "domain": "",
      "tls": false,
      "certificate": "",
      "certificate_key": ""
    }
  }
}
```

The domain and certificate paths are empty because the template cannot know the deployment environment. Fill them when the project has a real domain and production host.

Keep deployment-specific secrets and machine-only values out of committed files when they do not belong in the repository.

## Health checks

The web template generates a health route.

```txt id="web-production-health-route"
GET /health
```

The production metadata can describe how Vix should check the running service.

```json id="web-production-health-json"
{
  "production": {
    "health": {
      "service": "site",
      "local": "http://127.0.0.1:8080/health",
      "public": "",
      "expected_status": 200,
      "timeout_ms": 2000,
      "max_response_ms": 1000
    }
  }
}
```

During local development, check the route manually.

```bash id="web-production-curl-health"
curl http://localhost:8080/health
```

The health route is intentionally JSON, even though the web template is page-oriented. It exists for tools, deployments, reverse proxies, and monitoring systems, not for normal browser navigation.

## Deploy settings

The generated `vix.json` can include a deploy section.

```json id="web-production-deploy"
{
  "production": {
    "deploy": {
      "pull": true,
      "branch": "main",
      "build": "vix build",
      "tests": false,
      "test_command": "vix tests",
      "service": "site",
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

This section describes the intended deployment workflow. It keeps deployment behavior visible instead of hiding it in a local shell script that only one machine knows about.

The generated defaults should still be reviewed before a real deployment. A production project should confirm the branch, service name, build command, test behavior, health check settings, proxy behavior, log settings, and rollback policy.

## Logs

The generated production metadata can describe log locations.

```json id="web-production-logs"
{
  "production": {
    "logs": {
      "service": "site",
      "nginx_access": "/var/log/nginx/site.access.log",
      "nginx_error": "/var/log/nginx/site.error.log",
      "lines": 120
    }
  }
}
```

This gives log-related Vix commands a predictable source of information. It also documents where the project expects service and proxy logs to be found on a production host.

## Required environment variables

The web template can list required runtime variables in `vix.json`.

```json id="web-production-required-env"
{
  "production": {
    "env": {
      "required": [
        "APP_NAME",
        "APP_ENV",
        "SERVER_PORT",
        "PUBLIC_PATH",
        "VIEWS_PATH"
      ]
    }
  }
}
```

This allows the project to check that important runtime values exist before the app is deployed or started in a production-like environment.

```bash id="web-production-env-check"
vix env check
```

It is better to catch a missing `SERVER_PORT`, `PUBLIC_PATH`, or `VIEWS_PATH` during an environment check than after the service has already been started.

## Web defaults

The generated `vix.json` can include web-specific defaults.

```json id="web-production-web-defaults"
{
  "production": {
    "web": {
      "views": "views",
      "public": "public",
      "auto_escape_html": true,
      "cache_templates": true
    }
  }
}
```

These values describe the expected web runtime shape from the Vix workflow point of view. The running application still reads its runtime values from `.env` and the bootstrap configuration path.

A practical rule is:

```txt id="web-production-config-rule"
vix.json      -> Vix workflow and production metadata
.env          -> runtime values and secrets
.env.example  -> documented expected variables
```

## `vix.app`

The web executable target is described by the root `vix.app`.

```txt id="web-production-vix-app-file"
vix.app
```

This file tells Vix which C++ files to compile, which include roots to use, which Vix targets to link, which resources to copy, and where the output should be placed.

```ini id="web-production-vix-app"
name = "site"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
  "src/site/app/AppBootstrap.cpp",
  "src/site/presentation/routes/RouteRegistry.cpp",
  "src/site/presentation/middleware/MiddlewareRegistry.cpp",
  "src/site/presentation/controllers/PageController.cpp",
  "src/site/presentation/controllers/HealthController.cpp",
]

include_dirs = [
  "include",
  "src",
]

defines = [
  "VIX_WEB_APP=1",
  "VIX_APP_NAME=site",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]

resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

The separation is important. `vix.app` describes the C++ target and runtime resources. It should not become the place for service metadata, proxy settings, deploy behavior, or production log paths. Those belong in `vix.json`.

## Runtime resources

The web template depends on runtime resources.

```txt id="web-production-runtime-resources"
views/
public/
storage/
.env
```

These resources are declared in `vix.app`.

```ini id="web-production-resources"
resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

A built web application needs those files beside the executable.

```txt id="web-production-runtime-layout"
bin/
  site
  .env
  public/
    app.css
    app.js
  views/
    base.html
    header.html
    index.html
    dashboard.html
  storage/
```

If a page cannot render or a stylesheet cannot load after building, check the runtime output first. The file may exist in the source tree but still be missing from the directory where the executable runs.

## No separate production config by default

The web template keeps the production shape simple. It uses `vix.json` for Vix workflow and production metadata, and `.env` for runtime values.

Some internal template code may support a structured production JSON document, but the generated web project should avoid creating two competing production configuration files by default. A web project should not make developers guess whether production behavior comes from `vix.json`, `.env`, or another config file unless the project has a clear reason for that split.

The recommended rule is:

```txt id="web-production-no-extra-config-rule"
vix.json      -> project workflow and Vix production metadata
.env          -> runtime values and secrets
.env.example  -> documented runtime variables
```

This keeps the generated project easier to understand.

## Local workflow

A normal local workflow starts with the environment file.

```bash id="web-production-local-env"
cp .env.example .env
```

Then start the project.

```bash id="web-production-local-run"
vix dev
```

Open the app in the browser.

```txt id="web-production-local-url"
http://127.0.0.1:8080
```

Check the health route.

```bash id="web-production-local-health"
curl http://localhost:8080/health
```

Run validation commands when needed.

```bash id="web-production-local-checks"
vix build
vix tests
vix check --tests --run
```

## Production workflow

The generated web project exposes production-oriented commands through `vix.json`.

```bash id="web-production-commands"
vix health
vix logs
vix service status
vix proxy nginx check
vix doctor production
vix deploy
```

The exact availability of these commands depends on the installed Vix version and the production tools available on the machine. The template’s responsibility is to give the project a place to describe those workflows clearly.

Before using generated production settings for a real service, review:

```txt id="web-production-review-list"
service name
service user
working directory
exec path
domain
TLS settings
proxy settings
health URLs
log paths
required environment variables
public path
views path
template caching behavior
```

Generated values are starting points. Real production values should be reviewed by the project owner.

## Common mistakes

The most common mistake is putting secrets into committed files. Keep real secrets in `.env` or in the deployment environment, not in `.env.example` or `vix.json`.

Another mistake is treating `vix.json` as the C++ target manifest. The web executable is described by `vix.app`. Project workflow and production metadata are described by `vix.json`.

A third mistake is forgetting that `views/` and `public/` are runtime resources. If they are not copied beside the executable, page rendering and static assets can fail even when the source tree looks correct.

A fourth mistake is creating another production configuration file without a clear rule. The generated web template is easier to maintain when `vix.json` owns Vix workflow metadata and `.env` owns runtime values.

## Recommended rule

Keep the production files explicit and boring. Use `.env.example` to document runtime variables, `.env` for local and deployment values, `vix.app` for the C++ target and resources, and `vix.json` for Vix tasks and production metadata. Keep `views/` and `public/` as runtime resources so the built web app can render pages and serve assets from the output directory.

## Next step

Continue with the Vue template to see how Vix generates a combined project with a Vue frontend and a Vix C++ backend.

[Vue Template](/templates/vue)
