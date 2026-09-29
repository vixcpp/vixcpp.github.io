---
title: Production WebSocket
description: Configure and check local or public WebSocket endpoints used by production applications.
---

# Production WebSocket

The production WebSocket section describes how Vix should find and test the WebSocket endpoint of a deployed application. This is useful for backend services that expose real-time features such as notifications, live logs, chat, collaboration, background job updates, or event streams.

Vix reads WebSocket metadata from `production.websocket` in `vix.json`. It can also reuse WebSocket values from the proxy configuration when `production.proxy.websocket` is enabled. The same idea applies to generated Vix projects and existing C++ projects: the application owns the WebSocket server, while Vix keeps enough production metadata to check whether the endpoint is reachable.

## Why WebSocket checks matter

A WebSocket endpoint can fail even when the normal HTTP application is healthy. The application may be running on the right HTTP port, but the WebSocket server may be bound to another port, mounted on another path, blocked by the proxy, or missing the correct upgrade headers.

That is why Vix treats WebSocket checks as a separate production concern. HTTP health tells you whether the application responds to normal requests. WebSocket checks tell you whether the real-time connection path is usable.

## Basic configuration

A minimal local WebSocket configuration looks like this:

```json
{
  "name": "myapp",

  "production": {
    "websocket": {
      "host": "127.0.0.1",
      "port": 9090,
      "path": "/ws",
      "local_url": "ws://127.0.0.1:9090/ws",
      "public_url": "",
      "timeout_ms": 3000,
      "heartbeat": true
    }
  }
}
```

The local URL should point directly to the WebSocket server. This is the best endpoint to check first because it removes the proxy from the debugging path.

## Fields

| Field        | Purpose                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| `host`       | Local WebSocket host. Defaults to `127.0.0.1`.                          |
| `port`       | Local WebSocket port. Defaults to `9090`.                               |
| `path`       | WebSocket route path. Defaults to `/ws`.                                |
| `local_url`  | Explicit local WebSocket URL.                                           |
| `public_url` | Public WebSocket URL, usually behind a proxy.                           |
| `timeout_ms` | Connection timeout in milliseconds.                                     |
| `heartbeat`  | Project metadata indicating whether heartbeat diagnostics are expected. |

If `local_url` is not provided, Vix builds one from `host`, `port`, and `path`.

```txt
ws://<host>:<port><path>
```

For example:

```txt
ws://127.0.0.1:9090/ws
```

## Commands

Check the configured WebSocket endpoint:

```bash
vix ws check
```

Check a specific WebSocket URL:

```bash
vix ws check ws://127.0.0.1:9090/ws
```

Use a longer timeout:

```bash
vix ws check ws://127.0.0.1:9090/ws --timeout 5000
```

Skip the ping step after connection:

```bash
vix ws check ws://127.0.0.1:9090/ws --no-ping
```

Print additional diagnostics:

```bash
vix ws check ws://127.0.0.1:9090/ws --verbose
```

The checker currently focuses on native `ws://` checks. Use local `ws://` URLs first when debugging a production server. TLS WebSocket checks with `wss://` should be treated as part of the proxy and public edge until native TLS WebSocket checking is added.

## URL selection

When no URL is passed on the command line, Vix chooses the endpoint from the project configuration.

```txt
CLI URL
  -> production.websocket.public_url
  -> production.websocket.local_url
  -> generated local URL from host, port, and path
```

This means an explicit command always wins:

```bash
vix ws check ws://127.0.0.1:9090/ws
```

If no command URL is provided and `public_url` is set, Vix prefers the public URL. If `public_url` is empty, Vix uses the local URL. If no local URL is set, it builds one from the configured host, port, and path.

## WebSocket and proxy configuration

When the application exposes WebSocket traffic through Nginx, the proxy section should describe the public path and local upstream port.

```json
{
  "production": {
    "proxy": {
      "domain": "example.com",

      "http": {
        "port": 8080
      },

      "websocket": {
        "enabled": true,
        "path": "/ws",
        "port": 9090
      },

      "tls": {
        "enabled": true
      }
    }
  }
}
```

When `production.proxy.websocket.enabled` is true, Vix can use the proxy WebSocket path and port to resolve the effective WebSocket configuration. This keeps the local checker, proxy generator, and production metadata aligned.

## Public WebSocket URL

A public WebSocket URL usually uses `wss://` when TLS is enabled.

```json
{
  "production": {
    "websocket": {
      "local_url": "ws://127.0.0.1:9090/ws",
      "public_url": "wss://example.com/ws",
      "timeout_ms": 3000,
      "heartbeat": true
    }
  }
}
```

The public URL is useful documentation for the production endpoint, and it can be used by commands or future checks that need to know the public WebSocket address. For current local diagnostics, start with the `ws://127.0.0.1` endpoint and then verify the proxy separately.

```bash
vix ws check ws://127.0.0.1:9090/ws
vix proxy nginx check
```

## WebSocket and health checks

The health command can also check a WebSocket endpoint through `production.health.websocket`.

```json
{
  "production": {
    "health": {
      "service": "myapp",
      "local": "http://127.0.0.1:8080/health",
      "websocket": "ws://127.0.0.1:9090/ws",
      "timeout_ms": 3000,
      "max_response_ms": 1000
    }
  }
}
```

This belongs to the health workflow, while `production.websocket` belongs to the WebSocket-specific workflow. In practice, both can point to the same endpoint.

```bash
vix health websocket
vix ws check ws://127.0.0.1:9090/ws
```

Use `vix health websocket` when the WebSocket endpoint is part of the wider production health status. Use `vix ws check` when you want to inspect the WebSocket connection directly.

## Using WebSocket checks with an existing C++ project

An existing C++ project can use Vix WebSocket checks without using a Vix template. The project only needs a `vix.json` file that describes where the WebSocket server listens.

```json
{
  "name": "legacy-realtime",

  "production": {
    "service": {
      "name": "legacy-realtime",
      "user": "deploy",
      "working_dir": "/srv/legacy-realtime",
      "exec": "/srv/legacy-realtime/build/realtime-server"
    },

    "websocket": {
      "host": "127.0.0.1",
      "port": 9090,
      "path": "/ws",
      "local_url": "ws://127.0.0.1:9090/ws",
      "public_url": "wss://realtime.example.com/ws",
      "timeout_ms": 3000,
      "heartbeat": true
    },

    "proxy": {
      "domain": "realtime.example.com",
      "http": {
        "port": 8080
      },
      "websocket": {
        "enabled": true,
        "path": "/ws",
        "port": 9090
      },
      "tls": {
        "enabled": true
      }
    }
  }
}
```

The project can keep its own build system, runtime architecture, and WebSocket implementation. Vix only uses the metadata to check the endpoint and validate the production path around it.

## Common problems

If the local WebSocket check fails, verify that the WebSocket server is running and listening on the configured port.

```bash
vix service status
vix ws check ws://127.0.0.1:9090/ws
```

If the local check passes but the public endpoint fails, the problem is probably in the proxy, TLS, DNS, firewall, or WebSocket upgrade configuration.

```bash
vix proxy nginx check
vix logs proxy
```

If the path is wrong, make sure `production.websocket.path`, `production.proxy.websocket.path`, and the application route all use the same value.

```json
{
  "production": {
    "websocket": {
      "path": "/ws"
    },
    "proxy": {
      "websocket": {
        "path": "/ws"
      }
    }
  }
}
```

If the port is wrong, align the application listener with the proxy upstream.

```json
{
  "production": {
    "websocket": {
      "port": 9090
    },
    "proxy": {
      "websocket": {
        "port": 9090
      }
    }
  }
}
```

If the connection opens and then closes immediately, inspect the application logs and repeated errors.

```bash
vix logs app --since "10 minutes ago"
vix logs errors --repeated
```

## Practical workflow

Start from the local endpoint.

```bash
vix service status
vix ws check ws://127.0.0.1:9090/ws
```

Then validate the proxy.

```bash
vix proxy nginx check
```

After that, check the wider production state.

```bash
vix production status
```

For WebSocket problems, debug from inside to outside: local service first, local WebSocket URL second, proxy configuration third, public URL last. This keeps the investigation clear and avoids changing Nginx when the real issue is the application listener, or changing application code when the real issue is the public edge.

## Next step

Continue with the production status documentation to see how Vix combines service, health, proxy, and logs checks into one production inspection.
