# Timeouts

A timeout defines how long a request is allowed to wait before the client gives up.

HTTP clients should not wait forever by accident. A server can be slow, a connection can hang, a local service can stop responding, or a network path can fail in a way that does not immediately close the socket. `vix::requests::Timeout` gives the caller a clear way to put limits around that work.

Timeouts are configured through `RequestOptions`.

```cpp id="j2kfbm"
vix::requests::RequestOptions options;

options.timeout = std::chrono::seconds(10);

auto response = vix::requests::get(
    "https://example.com/api/status",
    options);
```

This assigns the same timeout value to the connect, read, and total phases.

## Basic use

```cpp id="y89b8p"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

#include <chrono>

int main()
{
  try
  {
    vix::requests::RequestOptions options;

    options.timeout = std::chrono::seconds(10);

    auto response = vix::requests::get(
        "https://example.com/",
        options);

    response.raise_for_status();

    vix::print("status:", response.status_code());
    vix::print("elapsed:", response.elapsed());

    return 0;
  }
  catch (const vix::requests::TimeoutException &error)
  {
    vix::eprint("timeout:", error.what());
    return 1;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

Run it:

```bash id="o6hb61"
vix run main.cpp
```

Catching `TimeoutException` separately is useful when the application wants to report timeout failures differently from invalid URLs, connection failures, or HTTP error statuses.

## Timeout phases

A timeout can describe three phases.

```txt id="bc960d"
connect  time allowed to open the connection
read     time allowed while sending or reading socket data
total    time allowed for the whole request workflow
```

For many calls, one timeout value is enough.

```cpp id="qyakr0"
vix::requests::RequestOptions options;

options.timeout = std::chrono::seconds(5);
```

This keeps the request simple and avoids an unbounded wait. When the application needs more control, configure the phases separately.

```cpp id="iqz1gn"
vix::requests::Timeout timeout;

timeout.set_connect(std::chrono::seconds(3));
timeout.set_read(std::chrono::seconds(10));
timeout.set_total(std::chrono::seconds(15));

vix::requests::RequestOptions options;
options.timeout = timeout;
```

The connect timeout is usually shorter than the read timeout. Opening a connection should normally complete quickly. Reading a response can take longer, especially when the server is doing work or returning a larger body.

## Create timeout values

Use `Timeout::seconds` or `Timeout::milliseconds` when a named constructor makes the code clearer.

```cpp id="jwif75"
vix::requests::RequestOptions options;

options.timeout = vix::requests::Timeout::seconds(10);
```

For smaller limits:

```cpp id="jml2ep"
vix::requests::RequestOptions options;

options.timeout = vix::requests::Timeout::milliseconds(500);
```

These helpers create a timeout where the connect, read, and total phases all use the same value.

## No explicit timeout

A default timeout has no explicit limits.

```cpp id="q89rie"
vix::requests::Timeout timeout;

vix::print("active:", timeout.active());
```

You can also express this directly:

```cpp id="t8d5fa"
vix::requests::RequestOptions options;

options.timeout = vix::requests::Timeout::none();
```

A duration of zero means that no explicit timeout is configured for that phase. The transport layer may still be affected by operating system behavior, but the request module is not applying a caller-defined limit for that phase.

## Inspect a timeout

`Timeout` exposes helpers to check which phases are active.

```cpp id="vojd72"
vix::requests::Timeout timeout;

timeout.set_connect(std::chrono::seconds(3));
timeout.set_read(std::chrono::seconds(10));

vix::print("active:", timeout.active());
vix::print("connect:", timeout.has_connect());
vix::print("read:", timeout.has_read());
vix::print("total:", timeout.has_total());
```

You can also read the configured durations.

```cpp id="otga4m"
vix::print("connect timeout:", timeout.connect());
vix::print("read timeout:", timeout.read());
vix::print("total timeout:", timeout.total());
```

The values are returned as `std::chrono::milliseconds`.

## Per-request timeouts

The most common place to use a timeout is directly on one request.

```cpp id="vezokv"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

#include <chrono>

int main()
{
  try
  {
    vix::requests::RequestOptions options;

    options.timeout = std::chrono::seconds(3);

    auto response = vix::requests::get(
        "https://example.com/api/health",
        options);

    response.raise_for_status();

    vix::print("service is reachable");

    return 0;
  }
  catch (const vix::requests::TimeoutException &error)
  {
    vix::eprint("service did not answer in time:", error.what());
    return 1;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

This keeps the timeout close to the endpoint that needs it. A health check, for example, often needs a shorter timeout than a request that downloads a larger response.

## Session timeout defaults

Use a session timeout when many requests should share the same limit.

```cpp id="gq6r0f"
#include <vix/requests/requests.hpp>
#include <vix/print.hpp>

#include <chrono>

int main()
{
  try
  {
    vix::requests::Session session;

    session.set_header("Accept", "application/json");
    session.timeout() = std::chrono::seconds(10);

    auto profile = session.get("https://example.com/api/profile");
    profile.raise_for_status();

    auto items = session.get("https://example.com/api/items");
    items.raise_for_status();

    vix::print("profile status:", profile.status_code());
    vix::print("items status:", items.status_code());

    return 0;
  }
  catch (const vix::requests::TimeoutException &error)
  {
    vix::eprint("timeout:", error.what());
    return 1;
  }
  catch (const vix::requests::RequestException &error)
  {
    vix::eprint("request failed:", error.what());
    return 1;
  }
}
```

A session default is useful when the session represents one client workflow and all calls should follow the same timing policy. A single request can still pass its own `RequestOptions` when it needs a different timeout.

```cpp id="tj7sm9"
vix::requests::Session session;

session.timeout() = std::chrono::seconds(10);

vix::requests::RequestOptions options;
options.timeout = std::chrono::seconds(2);

auto response = session.get(
    "https://example.com/api/fast-check",
    options);
```

The request-specific timeout overrides the session default for that call.

## Handling timeout failures

Timeout failures raise `TimeoutException`.

```cpp id="z0yur9"
try
{
  vix::requests::RequestOptions options;
  options.timeout = std::chrono::milliseconds(100);

  auto response = vix::requests::get(
      "https://example.com/slow",
      options);

  response.raise_for_status();

  vix::print(response.text());
}
catch (const vix::requests::TimeoutException &error)
{
  vix::eprint("timeout:", error.what());
}
catch (const vix::requests::RequestException &error)
{
  vix::eprint("request error:", error.what());
}
```

`TimeoutException` derives from `TransportException`, which derives from `RequestException`. Catch it before `RequestException` when timeout-specific behavior matters.

## Negative timeout values

Timeout durations cannot be negative.

```cpp id="vka87c"
try
{
  auto timeout = vix::requests::Timeout::milliseconds(-1);

  vix::print("timeout:", timeout.active());
}
catch (const vix::requests::RequestException &error)
{
  vix::eprint("invalid timeout:", error.what());
}
```

A negative value is rejected because it does not describe a useful network limit. Use zero or `Timeout::none()` when no explicit timeout should be configured.

## Timeout and elapsed time

Timeouts define how long a request may wait. `Response::elapsed()` tells you how long a completed request took.

```cpp id="yycgl5"
vix::requests::RequestOptions options;

options.timeout = std::chrono::seconds(10);

auto response = vix::requests::get(
    "https://example.com/",
    options);

vix::print("elapsed:", response.elapsed());
```

Elapsed time is available only after a response is received. If the request times out, the call raises `TimeoutException` instead of returning a response.

## Choosing timeout values

Timeout values should match the role of the request.

A health check should usually fail quickly, because its job is to tell you whether a service is reachable now. A request that fetches a report, downloads data, or waits for a slow external service may need more time. The best timeout is not always the smallest one; it is the one that gives the remote operation enough time to behave normally while still protecting your program from waiting without a clear limit.

```cpp id="x6wm63"
vix::requests::RequestOptions health;
health.timeout = std::chrono::seconds(2);

vix::requests::RequestOptions api;
api.timeout = std::chrono::seconds(10);
```

Keep timeout decisions close to the request or session they belong to. That makes the behavior easier to understand when the code is read later.

## Common mistakes

### Leaving external calls without a timeout

A default `RequestOptions` object has no explicit timeout. That may be acceptable for small local tests, but long-lived applications should usually define a timeout for external calls.

```cpp id="o31ulf"
vix::requests::RequestOptions options;

options.timeout = std::chrono::seconds(10);
```

### Using one tiny timeout for every endpoint

A very small timeout can make normal slow endpoints look broken.

```cpp id="cj5wfj"
vix::requests::RequestOptions options;

options.timeout = std::chrono::milliseconds(50);
```

Use short timeouts for fast checks, not for every request by default.

### Catching only `RequestException` when timeouts need special handling

This works, but it treats a timeout like every other request failure.

```cpp id="m0iffb"
catch (const vix::requests::RequestException &error)
{
  vix::eprint("request failed:", error.what());
}
```

Catch `TimeoutException` first when timeout behavior needs a clearer message or a retry decision.

```cpp id="kpdi12"
catch (const vix::requests::TimeoutException &error)
{
  vix::eprint("timeout:", error.what());
}
catch (const vix::requests::RequestException &error)
{
  vix::eprint("request failed:", error.what());
}
```

## API summary

```cpp id="srpi1f"
class Timeout
{
public:
  using Duration = std::chrono::milliseconds;

  Timeout();
  explicit Timeout(Duration value);

  Timeout(
      Duration connect,
      Duration read,
      Duration total);

  Timeout &operator=(Duration value);

  static Timeout seconds(long seconds);
  static Timeout milliseconds(long milliseconds);
  static Timeout none();

  Duration connect() const noexcept;
  Duration read() const noexcept;
  Duration total() const noexcept;

  void set_connect(Duration value);
  void set_read(Duration value);
  void set_total(Duration value);

  bool has_connect() const noexcept;
  bool has_read() const noexcept;
  bool has_total() const noexcept;

  bool active() const noexcept;
};
```

Used through request options:

```cpp id="rgcsxw"
vix::requests::RequestOptions options;

options.timeout = std::chrono::seconds(10);
options.timeout = vix::requests::Timeout::seconds(10);
options.timeout = vix::requests::Timeout::milliseconds(500);
options.timeout = vix::requests::Timeout::none();
```

Used through a session:

```cpp id="qav4hz"
vix::requests::Session session;

session.timeout() = std::chrono::seconds(10);
```

## Next step

Continue with redirects and cookies. Timeouts control how long the client waits; redirects and cookies control how the client behaves across multiple HTTP responses.

[Open the redirects and cookies guide](/modules/requests/redirects-and-cookies)
