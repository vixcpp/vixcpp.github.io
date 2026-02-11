# Logging

Logging in Vix is explicit.

Vix does not automatically log every request. You decide:

-   What to log
-   When to log
-   How detailed logs should be

------------------------------------------------------------------------

## Minimal logging example

``` cpp
#include <vix.hpp>
#include <iostream>

using namespace vix;

int main()
{
  App app;

  app.get("/", [](Request&, Response& res) {
    std::cout << "Incoming request on /" << std::endl;

    res.json({"message", "Hello"});
  });

  app.run(8080);
}
```

This logs each request to standard output.

------------------------------------------------------------------------

## Logging request data

``` cpp
#include <vix.hpp>
#include <iostream>

using namespace vix;

int main()
{
  App app;

  app.get("/inspect", [](Request& req, Response& res) {
    std::cout << "Path: /inspect" << std::endl;
    std::cout << "User-Agent: " << req.header("User-Agent") << std::endl;

    res.json({"ok", true});
  });

  app.run(8080);
}
```

Be careful not to log sensitive data.

------------------------------------------------------------------------

## Logging errors

``` cpp
app.get("/error", [](Request&, Response& res) {
  std::cerr << "Simulated error occurred" << std::endl;

  res.status(500).json({
    "error", "Internal server error"
  });
});
```

Use error streams for failures.

------------------------------------------------------------------------

## Structured logging pattern

Instead of free text logs:

``` cpp
std::cout << "User login failed" << std::endl;
```

Prefer structured logs:

``` cpp
std::cout << "{"
          << ""event":"login_failed","
          << ""user":"unknown""
          << "}" << std::endl;
```

Structured logs are easier to parse and analyze.

------------------------------------------------------------------------

## Production logging

For real applications:

-   Use a proper logging library
-   Write logs to rotating files
-   Avoid blocking I/O in hot paths
-   Avoid logging secrets

------------------------------------------------------------------------

## Performance considerations

Logging is I/O.

Heavy logging can reduce throughput.

Best practices:

-   Log only what is necessary
-   Avoid logging inside tight loops
-   Use async logging in production setups

------------------------------------------------------------------------

## Philosophy

Logging should be:

-   Intentional
-   Clear
-   Minimal
-   Secure

In Vix, nothing is logged unless you log it.

