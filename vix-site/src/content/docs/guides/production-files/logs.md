---
title: Production Logs
description: Configure and inspect application, proxy, and repeated error logs in production.
---

# Production Logs

The production logs section tells Vix where to read runtime information when a deployed application needs to be inspected. In production, a C++ application usually has two important log sources: the service logs produced by systemd and the proxy logs produced by Nginx. Vix groups both under one command so you can inspect the application, the public edge, or only the errors without remembering several server commands.

The logs configuration lives in `production.logs` inside `vix.json`. It is used by `vix logs`, by deployment failure diagnostics, and by `vix production status` when Vix checks the current production state.

## Why logs matter

A production check can tell you that something failed, but logs usually explain why. A service may fail to start because an environment variable is missing. A health endpoint may return an error because the database path is wrong. A public request may fail because Nginx cannot reach the local upstream. These problems live in different places, and reading only one log source often gives an incomplete picture.

Vix keeps the log metadata in the project because the service name and proxy log paths are part of the deployment contract. When those values are declared in `vix.json`, the same project can be deployed, checked, and inspected consistently.

## Basic configuration

Logs configuration lives under `production.logs`.

```json
{
  "name": "myapp",

  "production": {
    "logs": {
      "service": "myapp",
      "nginx_access": "/var/log/nginx/myapp.access.log",
      "nginx_error": "/var/log/nginx/myapp.error.log",
      "lines": 120
    }
  }
}
```

The `service` field is the systemd service name used for application logs. The Nginx paths should match the access and error log files used by the proxy configuration. The `lines` value controls how much output Vix reads by default when a command does not specify another limit.

## Fields

| Field          | Purpose                                             |
| -------------- | --------------------------------------------------- |
| `service`      | systemd service name used for application logs.     |
| `nginx_access` | Nginx access log file for public requests.          |
| `nginx_error`  | Nginx error log file for proxy and upstream errors. |
| `lines`        | Default number of log lines to show.                |

If `production.logs.service` is not set, Vix tries to resolve the service name from other production sections such as `production.deploy.service` or `production.service.name`. It is still better to set it explicitly when preparing a production project.

## Commands

Show the default production logs:

```bash
vix logs
```

Show only application logs from systemd:

```bash
vix logs app
```

Show Nginx access and error logs:

```bash
vix logs proxy
```

Show error-focused logs:

```bash
vix logs errors
```

Follow logs live:

```bash
vix logs --follow
```

Limit the number of lines:

```bash
vix logs -n 200
```

Filter application logs by a systemd time expression:

```bash
vix logs --since "1 hour ago"
```

## Application logs

Application logs are read from systemd using the configured service name.

```bash
vix logs app
```

This is the first place to look when the binary fails to start, crashes after restart, cannot read `.env`, cannot open a database, or exits during boot. Vix reads from `journalctl` and uses the service name declared in `production.logs.service`.

A matching configuration looks like this:

```json
{
  "production": {
    "logs": {
      "service": "myapp",
      "lines": 120
    }
  }
}
```

The service name should match the installed systemd unit. If the unit is named `myapp.service`, the value can usually be written as `myapp`.

## Proxy logs

Proxy logs are read from the Nginx access and error log files.

```bash
vix logs proxy
```

Access logs help confirm whether public requests are reaching the server. Error logs are more useful when Nginx cannot connect to the upstream application, when TLS is misconfigured, when the WebSocket proxy fails, or when the client connection is closed unexpectedly.

```json
{
  "production": {
    "logs": {
      "nginx_access": "/var/log/nginx/myapp.access.log",
      "nginx_error": "/var/log/nginx/myapp.error.log"
    }
  }
}
```

These paths should match the log files created by the proxy configuration used for the application. If the files do not exist, Vix reports the missing path and points you back to the production log configuration.

## Error logs

The error target focuses on the lines that usually matter during an incident.

```bash
vix logs errors
```

This target reads application errors from systemd and proxy errors from Nginx. It filters for common error words such as failed operations, exceptions, timeouts, refused connections, denied requests, and critical failures.

Use it after a failed deploy or a failed health check:

```bash
vix health
vix logs errors
```

This keeps the first investigation short. When you need more context, go back to the full application or proxy logs.

## Repeated error analysis

Repeated errors are often more useful than raw logs. A production service may print thousands of lines, but the real issue is usually a small number of repeated messages. Vix can group repeated errors and show the patterns that appear most often.

```bash
vix logs errors --repeated
```

For machine-readable output:

```bash
vix logs errors --repeated --json
```

The repeated error analyzer normalizes values that change from line to line, such as timestamps, IP addresses, numbers, and long quoted values. This lets Vix group messages that are logically the same even when each line contains a different request id, port, address, or timestamp.

Vix also detects common network disconnect families such as client disconnects, connection resets, timeouts, refused connections, upstream disconnects, and WebSocket disconnects. Normal network noise, such as a browser closing a connection, is separated from more useful repeated error groups so the report stays readable.

## Logs during deployment

`vix deploy` can print recent error logs when a deployment step fails.

```json
{
  "production": {
    "deploy": {
      "pull": true,
      "branch": "main",
      "build": "vix build --preset release",
      "tests": false,
      "service": "myapp",
      "health_local": true,
      "proxy_check": true,
      "logs_on_failure": true,
      "log_lines": 80
    }
  }
}
```

With `logs_on_failure` enabled, Vix reads recent repeated errors when a build, test, service restart, health check, or proxy check fails. This is useful because the command that fails is not always the command that explains the failure. A health check may fail, but the useful message may be in the service logs.

## Logs and production status

`vix production status` uses logs as the final part of the production inspection.

```bash
vix production status
```

That command checks the service, health endpoints, proxy configuration, and repeated error logs. The log step is not meant to replace full debugging, but it gives a quick signal about whether the deployed service is producing repeated errors.

## Using logs with an existing C++ project

An existing C++ project can use Vix production logs without using Vix templates. The project only needs a `vix.json` file that describes the service and proxy log paths.

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

    "logs": {
      "service": "legacy-api",
      "nginx_access": "/var/log/nginx/legacy-api.access.log",
      "nginx_error": "/var/log/nginx/legacy-api.error.log",
      "lines": 120
    }
  }
}
```

The application can still be built with CMake, Make, Ninja, or a custom script. Vix only needs the production metadata so it can inspect the deployed process and its proxy logs.

## Common options

| Option           | Purpose                                               |
| ---------------- | ----------------------------------------------------- |
| `--follow`, `-f` | Follow logs live.                                     |
| `--errors`       | Filter logs by common error keywords.                 |
| `--repeated`     | Group repeated errors and common network disconnects. |
| `--json`         | Print supported output as JSON.                       |
| `--since`        | Filter systemd logs by time expression.               |
| `--lines`, `-n`  | Show the last N lines.                                |

Examples:

```bash
vix logs app --since "30 minutes ago"
vix logs proxy -n 300
vix logs errors --repeated -n 200
vix logs errors --repeated --json
```

## Common problems

If application logs are missing, check that the service name is correct.

```bash
vix service status
vix logs app
```

If proxy logs are missing, check the Nginx log paths in `production.logs`.

```bash
vix logs proxy
vix proxy nginx check
```

If the logs are noisy, use repeated error analysis instead of reading everything line by line.

```bash
vix logs errors --repeated
```

If the local health check fails but the logs show no useful application errors, the service may be starting under a different user, working directory, or environment than expected. In that case, inspect the service and environment configuration before changing application code.

```bash
vix service status
vix env check --production
```

## Practical workflow

A useful production debugging flow starts with the service, then health, then logs.

```bash
vix service status
vix health
vix logs errors --repeated
```

When the public endpoint fails but the local endpoint works, inspect the proxy logs.

```bash
vix proxy nginx check
vix logs proxy
```

When the application fails after deployment, read the application logs first.

```bash
vix logs app --since "10 minutes ago"
```

Logs are most useful when the project metadata points to the real service and the real proxy files. Keep the service name, Nginx log paths, and line limits accurate, and Vix can give you a clear production picture without forcing you to remember every server command.

## Next step

Continue with the deploy documentation to understand how Vix uses service, health, proxy, and logs metadata during a production release.
