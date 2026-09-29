---
title: Production Health
description: Configure the local, public, and WebSocket health checks used by Vix production commands.
---

# Production Health

The production health section tells Vix how to verify that a deployed application is actually reachable. A service can be installed, started, and visible in systemd while the application behind it is still failing. Health checks close that gap by making real requests to the endpoints that matter.

Vix reads health metadata from `production.health` in `vix.json`. The same configuration is used by `vix health`, `vix deploy`, and `vix production status`, so the project has one place to describe what “healthy” means in production.

## Why health checks matter

A production deployment should not stop at “the process started.” A C++ backend can start successfully and still be unusable because it cannot read its environment, cannot open its database, is bound to the wrong port, or is hidden behind a broken proxy. The health section gives Vix a concrete way to test the running application instead of only checking the service manager.

The checks are intentionally simple. Vix does not need to know your internal business logic. It only needs stable endpoints that answer quickly and return the expected status. For most applications, this means a local endpoint such as `http://127.0.0.1:8080/health` and, when a proxy is configured, a public endpoint such as `https://example.com/health`.

## Basic configuration

Health configuration lives under `production.health`.

```json
{
  "name": "myapp",

  "production": {
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

The `service` field is optional, but it is useful in production because Vix can check that the configured service is running before sending health requests. The local endpoint should point directly to the application process. The public endpoint should point to the domain served through Nginx or another public edge.

## Fields

| Field             | Purpose                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `service`         | Optional systemd service name checked before local health requests.  |
| `local`           | Internal HTTP endpoint, usually on `127.0.0.1`.                      |
| `public`          | Public HTTP or HTTPS endpoint exposed through the proxy.             |
| `websocket`       | WebSocket endpoint checked through an upgrade request.               |
| `expected_status` | Expected HTTP status for local and public checks. Defaults to `200`. |
| `timeout_ms`      | Request timeout in milliseconds.                                     |
| `max_response_ms` | Maximum accepted response time in milliseconds.                      |

For WebSocket checks, Vix expects a successful upgrade response. The default expected status for the WebSocket target is `101`.

## Commands

Run all configured checks:

```bash
vix health
```

Run only the local application check:

```bash
vix health local
```

Run only the public endpoint check:

```bash
vix health public
```

Run the WebSocket check:

```bash
vix health websocket
```

The shorter alias also works:

```bash
vix health ws
```

## Local health

The local health endpoint checks the application before the reverse proxy is involved.

```json
{
  "production": {
    "health": {
      "service": "myapp",
      "local": "http://127.0.0.1:8080/health",
      "expected_status": 200,
      "timeout_ms": 2000,
      "max_response_ms": 1000
    }
  }
}
```

This is usually the first health check to configure. If the local check fails, the problem is normally inside the service, the application runtime, the port binding, or the application configuration. It is better to fix that before debugging DNS, TLS, or Nginx.

```bash
vix service status
vix health local
```

## Public health

The public health endpoint checks the application through the production edge.

```json
{
  "production": {
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

This check is useful after the proxy is installed. It confirms that the domain, Nginx configuration, TLS certificate, upstream port, and application endpoint are working together.

```bash
vix proxy nginx check
vix health public
```

If the local check passes but the public check fails, the application is probably running correctly and the problem is more likely in the proxy, DNS, firewall, or TLS configuration.

## WebSocket health

Applications that expose a WebSocket endpoint can add a `websocket` value to the health section.

```json
{
  "production": {
    "health": {
      "service": "myapp",
      "local": "http://127.0.0.1:8080/health",
      "public": "https://example.com/health",
      "websocket": "ws://127.0.0.1:9090/ws",
      "timeout_ms": 3000,
      "max_response_ms": 1000
    }
  }
}
```

The WebSocket check sends an upgrade-style request and expects the endpoint to respond like a WebSocket server. This is separate from the normal HTTP health endpoint because WebSocket failures often come from different parts of the stack: a wrong path, a wrong upstream port, missing upgrade headers, or a proxy timeout.

For a public WebSocket endpoint behind TLS, the public URL usually starts with `wss://`. For local checks, `ws://127.0.0.1:9090/ws` is usually easier to debug first.

```bash
vix health websocket
```

## Health and deployment

Deployment can ask Vix to run health checks after the service restarts.

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
      "health_public": true,
      "proxy_check": true,
      "logs_on_failure": true
    }
  }
}
```

With this configuration, `vix deploy` builds the project, restarts the service, verifies that the service is active, then runs the configured health checks. If health fails, deployment fails instead of silently leaving a broken release online.

```bash
vix deploy --dry-run
vix deploy
```

The dry run is useful before changing the server because it shows the production steps that Vix will execute.

## Health and production status

`vix production status` uses health checks as part of the wider production inspection.

```bash
vix production status
```

That command checks the service, health endpoints, proxy configuration, and repeated error logs. It is meant for the moment when the application is already deployed and you want a quick view of whether the production setup still looks correct.

## Using health checks with an existing C++ project

A project does not need to use the generated Vix backend or web templates to use health checks. The application only needs to expose a predictable endpoint, and `vix.json` needs to describe where that endpoint lives.

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

    "health": {
      "service": "legacy-api",
      "local": "http://127.0.0.1:8080/health",
      "public": "https://api.example.com/health",
      "expected_status": 200,
      "timeout_ms": 2000,
      "max_response_ms": 1000
    }
  }
}
```

In this setup, Vix does not control the application architecture. The project can still use plain CMake, a custom build script, or another internal layout. Vix only uses the health metadata to verify the deployed process.

## A good health endpoint

A health endpoint should be stable, fast, and safe to call often. It should not require authentication, modify state, or depend on expensive work. For most applications, returning a small JSON response is enough.

```cpp
app.get("/health", [](vix::Request &req, vix::Response &res)
{
  (void)req;

  res.json({
    "ok", true,
    "status", "ok",
    "service", "myapp"
  });
});
```

A deeper application may check database connectivity or storage access, but the endpoint should still stay predictable. If the health check becomes too heavy, it can create noise during deploys and make production diagnostics harder to trust.

## Common problems

If `vix health local` fails, first check whether the service is running and whether the application listens on the configured port.

```bash
vix service status
curl http://127.0.0.1:8080/health
```

If `vix health public` fails while the local check passes, check the proxy configuration and the public route.

```bash
vix proxy nginx check
curl https://example.com/health
```

If the WebSocket health check fails, confirm the WebSocket path, upstream port, and proxy upgrade configuration.

```bash
vix health websocket
vix proxy nginx check
```

The useful rule is to debug from inside to outside: service first, local health second, proxy third, public health last.

## Practical workflow

A clean production setup usually starts with local health.

```bash
vix service status
vix health local
```

After the proxy is installed, add public health.

```bash
vix proxy nginx check
vix health public
```

When both pass, run the full production check.

```bash
vix production status
```

The health configuration should describe the endpoints that prove the application is usable after a restart. Keep those endpoints small, stable, and close to the real production path.

## Next step

Continue with the logs documentation to inspect service logs, proxy logs, and repeated production errors when a health check fails.
