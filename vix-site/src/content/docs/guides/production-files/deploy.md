---
title: Production Deploy
description: Configure the production deployment workflow used by Vix to pull, build, restart, check, and diagnose a deployed application.
---

---

# Production Deploy

The production deploy section describes how Vix should release an application on a Linux server. It connects the steps that usually happen during a small production deployment: pulling the latest code, building the project, optionally running tests, restarting the service, checking health, validating the proxy, and showing useful logs when something fails.

Vix reads this workflow from `production.deploy` in `vix.json`. The project can be a Vix-generated backend, a server-rendered web app, or an existing C++ service that already has its own structure. The important part is that the production file describes how the application is built, which service should be restarted, and which checks must pass before the deploy is considered successful.

## Why deploy metadata matters

A deployment is not only a build command. In production, the build is only one part of the release path. The service must restart correctly, the application must respond locally, the public proxy must still point to the right upstream, and the logs should be available when a step fails. If these values live only in shell history or server notes, the deployment becomes hard to repeat and harder to trust.

Vix keeps those values in `vix.json` so the release workflow is attached to the project. This makes deployment more explicit: the branch, build command, service name, health checks, proxy validation, and failure diagnostics are all visible before the command runs.

## Basic configuration

A minimal production deploy configuration looks like this:

```json
{
  "name": "myapp",

  "production": {
    "deploy": {
      "pull": true,
      "branch": "main",
      "build": "vix build --preset release",
      "tests": false,
      "test_command": "vix tests",
      "service": "myapp",
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

This tells Vix to pull from `main`, build the project, restart the `myapp` service, run local health checks, validate the Nginx proxy, and print recent repeated errors if something fails.

## Fields

| Field             | Purpose                                                                   |
| ----------------- | ------------------------------------------------------------------------- |
| `pull`            | Runs `git pull origin <branch>` before building.                          |
| `branch`          | Git branch used when `pull` is enabled.                                   |
| `build`           | Command used to build the application.                                    |
| `tests`           | Enables the test step during deploy.                                      |
| `test_command`    | Command used when tests are enabled.                                      |
| `service`         | systemd service restarted after a successful build.                       |
| `health_local`    | Enables local health checks after service restart.                        |
| `health_public`   | Enables public health checks after service restart.                       |
| `proxy_check`     | Runs `vix proxy nginx check` during deploy.                               |
| `proxy_reload`    | Runs `vix proxy nginx reload` during deploy.                              |
| `logs_on_failure` | Prints recent repeated errors when a deploy step fails.                   |
| `log_lines`       | Number of log lines used for failure diagnostics.                         |
| `rollback`        | Attempts to return to the previous Git revision when a deploy step fails. |

The `service` field is required for the deploy workflow because Vix needs to know which systemd unit to restart and verify. The value can be written without the `.service` suffix.

## Commands

Run the deployment:

```bash
vix deploy
```

Print the deployment steps without executing them:

```bash
vix deploy --dry-run
```

Skip the pull step even when `pull` is enabled in `vix.json`:

```bash
vix deploy --no-pull
```

Skip tests even when `tests` is enabled:

```bash
vix deploy --no-tests
```

Show additional execution details:

```bash
vix deploy --verbose
```

The dry run should be used before the first production deployment or after changing the production file. It shows the workflow Vix will execute without restarting services or changing the server.

## Deployment flow

The deploy command follows a fixed order because each step depends on the previous one.

```txt
load production.deploy
  -> optionally capture current Git revision for rollback
  -> git pull
  -> build command
  -> test command
  -> restart service
  -> service status
  -> health checks
  -> proxy check
  -> optional proxy reload
  -> success
```

This order keeps the workflow predictable. Vix does not restart the service before the build succeeds, does not run health checks before the service has been restarted, and does not reload the proxy until the proxy configuration has passed validation.

## Build command

The build command should match the real production build for the project.

```json
{
  "production": {
    "deploy": {
      "build": "vix build --preset release"
    }
  }
}
```

For a project that does not use Vix as its build layer, the command can be different:

```json
{
  "production": {
    "deploy": {
      "build": "cmake --build build --config Release"
    }
  }
}
```

Vix does not need the project to use a generated Vix template. It only needs a command that can be executed from the project directory and that produces the binary used by the configured service.

## Tests

Tests are optional during deployment. For small services, they can be enabled directly in the deploy flow.

```json
{
  "production": {
    "deploy": {
      "tests": true,
      "test_command": "vix tests"
    }
  }
}
```

When tests are enabled, Vix runs them after the build and before the service restart. This prevents a failing test build from replacing a running production process.

A deployment can temporarily skip tests from the command line:

```bash
vix deploy --no-tests
```

This should be used carefully. The option exists for operational situations where the configured deploy file is correct, but a specific release must bypass the test step.

## Service restart

After the build and optional tests pass, Vix restarts the configured service.

```json
{
  "production": {
    "deploy": {
      "service": "myapp"
    }
  }
}
```

Internally, the deploy workflow uses the service command group:

```bash
vix service restart
vix service status
```

The restart step changes the running process. The status step confirms that systemd sees the service as active before Vix continues to health and proxy checks.

## Health checks

Health checks should be enabled when the project has a stable endpoint.

```json
{
  "production": {
    "deploy": {
      "health_local": true,
      "health_public": true
    },

    "health": {
      "service": "myapp",
      "local": "http://127.0.0.1:8080/health",
      "public": "https://example.com/health",
      "expected_status": 200,
      "timeout_ms": 2000,
      "max_response_ms": 1000
    }
  }
}
```

When either `health_local` or `health_public` is enabled, deploy runs:

```bash
vix health
```

The health configuration decides which endpoints are checked. Local health is usually the first check to enable because it verifies that the application responds before the public proxy is involved. Public health is useful once the domain, TLS, and proxy are configured.

## Proxy checks and reloads

A deploy can validate the Nginx proxy configuration after the service has restarted.

```json
{
  "production": {
    "deploy": {
      "proxy_check": true,
      "proxy_reload": false
    }
  }
}
```

When `proxy_check` is enabled, Vix runs:

```bash
vix proxy nginx check
```

When `proxy_reload` is enabled, Vix runs:

```bash
vix proxy nginx reload
```

The reload command validates the proxy before reloading Nginx. Keep `proxy_reload` disabled unless the deployment is expected to update or reapply the proxy configuration as part of the release. For many applications, checking the proxy is enough.

## Failure logs

When `logs_on_failure` is enabled, Vix prints recent repeated errors after a failed deploy step.

```json
{
  "production": {
    "deploy": {
      "logs_on_failure": true,
      "log_lines": 80
    }
  }
}
```

The diagnostic command is:

```bash
vix logs errors --repeated -n 80
```

This is useful because the failing step does not always contain the real reason. A health check may fail because the application could not open a database. A service restart may fail because the environment is incomplete. The repeated error report gives a shorter view of the logs without forcing the developer to read every line manually.

## Rollback

Rollback can be enabled for Git-based deployments.

```json
{
  "production": {
    "deploy": {
      "rollback": true
    }
  }
}
```

When rollback is enabled, Vix captures the current Git revision before the deploy starts. If a later step fails, Vix attempts to reset the repository to that previous revision, rebuild the application, restart the service, and check the service status.

Rollback is helpful, but it should not be treated as a replacement for careful releases. It assumes the server repository is clean enough to reset safely, the previous revision can still build, and the service command can restart the older binary. Use it only when that workflow matches how the server is managed.

## Using deploy with an existing C++ project

An existing C++ project can use the deploy workflow without adopting Vix templates. The project only needs a `vix.json` file that describes the production release steps.

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
      "health_public": true,
      "proxy_check": true,
      "proxy_reload": false,
      "logs_on_failure": true,
      "log_lines": 120,
      "rollback": false
    },

    "health": {
      "service": "legacy-api",
      "local": "http://127.0.0.1:8080/health",
      "public": "https://api.example.com/health"
    },

    "logs": {
      "service": "legacy-api",
      "nginx_access": "/var/log/nginx/legacy-api.access.log",
      "nginx_error": "/var/log/nginx/legacy-api.error.log",
      "lines": 120
    }
  }
}
```

The application can keep its own directory layout, build presets, and CMake files. Vix only coordinates the production steps around it.

## Production validation before deploy

Before running a real deployment, validate the production configuration.

```bash
vix deploy --dry-run
vix production validate
```

`vix deploy --dry-run` shows the deploy steps without executing them. `vix production validate` checks the production configuration by using the real production commands: deploy dry run, proxy check, and health checks.

After the service is already deployed, use:

```bash
vix production status
```

This checks service status, health, proxy configuration, and repeated errors.

## Common problems

If Vix reports a missing service name, add `production.deploy.service` to `vix.json`.

```json
{
  "production": {
    "deploy": {
      "service": "myapp"
    }
  }
}
```

If the pull step fails, check the repository state and branch on the server.

```bash
git status
git pull origin main
```

If the build step fails, run the configured build command manually from the project directory.

```bash
vix build --preset release
```

If the service restart fails, inspect the service configuration and recent logs.

```bash
vix service status
vix logs app --since "10 minutes ago"
```

If health fails after the service restart, debug from inside to outside: service status first, local health second, proxy third, public health last.

```bash
vix service status
vix health local
vix proxy nginx check
vix health public
```

## Practical workflow

A safe first deployment flow is to validate the commands before changing the running service.

```bash
vix deploy --dry-run
vix production validate
```

Then run the deploy:

```bash
vix deploy
```

After deployment, check production status:

```bash
vix production status
```

Keep the deploy section close to the real server workflow. The build command should be the command used on the server, the service name should match the installed unit, and the health and logs sections should describe the endpoints and files that actually exist in production.

## Next step

Continue with the environment documentation to define the `.env`, `.env.example`, and production-required variables that the deployed service needs at runtime.
