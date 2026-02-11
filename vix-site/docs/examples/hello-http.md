# Hello HTTP

This is the most minimal HTTP server you can build with Vix.

It demonstrates:

-   App
-   GET route
-   Text response
-   JSON response
-   app.run()

Everything is inside `main()`.

------------------------------------------------------------------------

## Minimal Hello World

``` cpp
#include <vix.hpp>

using namespace vix;

int main()
{
  App app;

  app.get("/", [](Request&, Response& res)
  {
    res.send("Hello, Vix!");
  });

  app.run(8080);
  return 0;
}
```

Run the server:

    http://localhost:8080/

------------------------------------------------------------------------

## Returning JSON

``` cpp
#include <vix.hpp>

using namespace vix;

int main()
{
  App app;

  app.get("/json", [](Request&, Response& res)
  {
    res.json({
      "message", "Hello",
      "framework", "Vix.cpp",
      "ok", true
    });
  });

  app.run(8080);
  return 0;
}
```

------------------------------------------------------------------------

## Auto-send Return Style

If you return a value instead of calling `res.send()`, Vix automatically
sends it if nothing was sent explicitly.

``` cpp
#include <vix.hpp>
#include <vix/json/json.hpp>

using namespace vix;

int main()
{
  App app;

  app.get("/auto", [](Request&, Response&)
  {
    return vix::json::o(
      "message", "Auto response",
      "status", 200
    );
  });

  app.run(8080);
  return 0;
}
```

------------------------------------------------------------------------

## Status Codes

``` cpp
#include <vix.hpp>

using namespace vix;

int main()
{
  App app;

  app.get("/created", [](Request&, Response& res)
  {
    res.status(201).json({
      "status", "created"
    });
  });

  app.run(8080);
  return 0;
}
```

------------------------------------------------------------------------

## What this example teaches

-   How routing works
-   How responses are sent
-   How JSON helpers are used
-   How minimal Vix setup looks

Next example: auth.

