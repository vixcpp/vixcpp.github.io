---
title: Production Environment
description: Configure and check the environment files and production variables used by a Vix application.
---

# Production Environment

The production environment section describes the runtime variables a deployed application expects. These values are usually not part of the compiled binary. They live in `.env`, are documented in `.env.example`, and, in production, may also be exposed through the systemd service environment.

Vix uses this information to check whether the project environment is complete before deployment and during production diagnostics. The goal is simple: the application should not fail in production because a required variable was missing, undocumented, or different from the value used by the running service.

## Why environment checks matter

A C++ service can compile correctly and still fail at runtime because the environment is incomplete. The server port may be missing, the database path may be wrong, the public directory may not be configured, or the service may be running with different values than the local `.env` file suggests.

Environment checks make those problems visible before they become confusing production errors. Vix reads the project files, compares expected variables with real values, and warns when the runtime environment does not match what the project documents.

## Files involved

A normal production-ready project should have both files:

```txt
.env
.env.example
```

`.env` contains the local runtime values used by the application. It can contain secrets and machine-specific values, so it should normally stay outside version control.

`.env.example` documents the variables the project expects. It should be committed to the repository so another developer, a server setup, or a deployment workflow can see which keys must exist without exposing real secrets.

## Basic `.env.example`

```dotenv
APP_NAME=myapp
APP_ENV=production

SERVER_HOST=0.0.0.0
SERVER_PORT=8080
SERVER_REQUEST_TIMEOUT=5000

PUBLIC_PATH=public
PUBLIC_MOUNT=/
PUBLIC_INDEX=index.html
PUBLIC_CACHE_CONTROL=public, max-age=3600
PUBLIC_SPA_FALLBACK=false

DATABASE_ENGINE=sqlite
DATABASE_SQLITE_PATH=storage/myapp.db

VIX_LOG_LEVEL=info
VIX_LOG_FORMAT=kv
LOGGING_ASYNC=true
```

This file should describe the shape of the environment. It does not need to contain real production secrets. For sensitive values, leave the value empty or use a safe placeholder.

## Basic `.env`

```dotenv
APP_NAME=myapp
APP_ENV=production

SERVER_HOST=0.0.0.0
SERVER_PORT=8080
SERVER_REQUEST_TIMEOUT=5000

PUBLIC_PATH=public
PUBLIC_MOUNT=/
PUBLIC_INDEX=index.html
PUBLIC_CACHE_CONTROL=public, max-age=3600
PUBLIC_SPA_FALLBACK=false

DATABASE_ENGINE=sqlite
DATABASE_SQLITE_PATH=storage/myapp.db

VIX_LOG_LEVEL=info
VIX_LOG_FORMAT=kv
LOGGING_ASYNC=true
```

The `.env` file is the file the application reads at runtime when it starts from the project directory. In production, the same values may also be passed through systemd, depending on how the service is installed.

## Production-required variables

Production-required variables are declared in `vix.json` under `production.env.required`.

```json
{
  "name": "myapp",

  "production": {
    "env": {
      "required": [
        "APP_NAME",
        "APP_ENV",
        "SERVER_PORT",
        "PUBLIC_PATH",
        "PUBLIC_MOUNT",
        "PUBLIC_INDEX",
        "PUBLIC_CACHE_CONTROL",
        "PUBLIC_SPA_FALLBACK",
        "DATABASE_ENGINE",
        "DATABASE_SQLITE_PATH"
      ]
    }
  }
}
```

This list tells Vix which variables must exist when production checks are enabled. It is stricter than only comparing `.env` and `.env.example`, because it marks the keys that are required for the deployed application to run correctly.

## Commands

Check the normal project environment:

```bash
vix env check
```

Check production requirements and systemd environment values:

```bash
vix env check --production
```

Show values while keeping secrets masked:

```bash
vix env check --production --show-values
```

Show non-secret values without masking:

```bash
vix env check --production --show-values --no-mask
```

Secrets are still masked even when `--no-mask` is used.

## What Vix checks

`vix env check` compares `.env` and `.env.example`. If a key exists in `.env.example` but not in `.env`, Vix reports it as missing from the runtime file. If a key exists in `.env` but not in `.env.example`, Vix reports it as undocumented.

With `--production`, Vix also reads `production.env.required` from `vix.json`. Required variables must exist either in `.env` or in the systemd environment for the configured service. When both `.env` and systemd provide the same key, Vix can detect values that differ.

This helps catch a common production problem: the project file says one thing, but the service is actually running with another value.

## Service environment comparison

In production mode, Vix tries to resolve the service name from the production configuration.

```json
{
  "production": {
    "service": {
      "name": "myapp"
    }
  }
}
```

or from the deploy section:

```json
{
  "production": {
    "deploy": {
      "service": "myapp"
    }
  }
}
```

When a service name is available, Vix can inspect the systemd environment and compare it with the project environment.

```bash
vix env check --production
```

This is useful after changing `.env`, regenerating a service file, or restarting the application. If systemd still has old values, Vix reports the difference and points you toward reloading and restarting the service.

## Value masking

Environment output is masked by default because environment variables often contain secrets. Vix treats keys as sensitive when their names contain words such as `secret`, `password`, `passwd`, `token`, `api_key`, `apikey`, `private_key`, or `credential`.

For normal checks, Vix prints the status of each variable without showing the value:

```bash
vix env check
```

To show values safely:

```bash
vix env check --show-values
```

Secret values stay masked. Non-secret values are also masked by default when values are shown. To display non-secret values plainly, use:

```bash
vix env check --show-values --no-mask
```

Use that only when the terminal output is safe to display or copy.

## Dotenv format

Vix reads simple dotenv-style files.

```dotenv
APP_NAME=myapp
SERVER_PORT=8080
DATABASE_SQLITE_PATH=storage/myapp.db
```

It also accepts `export` prefixes:

```dotenv
export APP_ENV=production
```

Quoted values are supported:

```dotenv
PUBLIC_CACHE_CONTROL="public, max-age=3600"
```

Inline comments are handled when they are outside quotes:

```dotenv
SERVER_PORT=8080 # local application port
```

Keep environment files simple. They should be easy to read, easy to compare, and safe to copy between local and production setups.

## Environment and deployment

The deploy workflow depends on a correct runtime environment. A build can succeed while the service restart fails because the process cannot read the configuration it expects.

A good production configuration usually connects deploy and environment checks:

```json
{
  "production": {
    "deploy": {
      "build": "vix build --preset release",
      "service": "myapp",
      "health_local": true,
      "logs_on_failure": true
    },

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

Before deploying, run:

```bash
vix env check --production
vix deploy --dry-run
```

This checks the runtime variables before the service is restarted.

## Environment and service files

When a service is installed through Vix production files, the systemd unit may expose environment values to the running process. That means the production check should not only look at `.env`; it should also compare the values systemd is using.

After changing environment values on the server, reload systemd and restart the service:

```bash
sudo systemctl daemon-reload
vix service restart
vix env check --production
```

This confirms that the service manager and the project files agree.

## Using environment checks with an existing C++ project

An existing C++ project can use Vix environment checks without using Vix templates. The project only needs `.env`, `.env.example`, and a small `vix.json` production section.

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

    "env": {
      "required": ["APP_ENV", "SERVER_PORT", "DATABASE_URL", "API_TOKEN"]
    }
  }
}
```

The application can still use its own CMake files, its own configuration loader, and its own directory structure. Vix only checks whether the runtime variables declared by the project are present and documented.

## Common problems

If Vix reports variables missing from `.env`, copy them from `.env.example` and set real values.

```bash
cp .env.example .env
vix env check
```

If Vix reports variables missing from `.env.example`, document them so the project remains understandable to another developer or server setup.

```bash
vix env check
```

If production-required variables are missing, add them to `.env` or configure them in the systemd service environment.

```bash
vix env check --production
```

If systemd values differ from `.env`, reload the service configuration and restart the service.

```bash
sudo systemctl daemon-reload
vix service restart
vix env check --production
```

## Practical workflow

A clean production workflow checks the environment before touching the running service.

```bash
vix env check
vix env check --production
```

Then validate the deployment plan:

```bash
vix deploy --dry-run
```

After the service has been restarted, check the environment again if the application behaves differently from expected.

```bash
vix service status
vix env check --production
vix logs errors --repeated
```

The environment files should describe the runtime contract of the application. Keep `.env.example` complete, keep secrets out of documentation, and make `production.env.required` strict enough to catch missing values before they reach production.

## Next step

Continue with the database documentation to configure SQLite storage, migrations, status checks, and backups for production projects.
