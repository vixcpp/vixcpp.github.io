# Auth

This example demonstrates a minimal "auth" pattern using:

-   Middleware
-   Headers
-   Protected routes
-   401 and 403 responses

Everything is inside `main()`.

------------------------------------------------------------------------

## Goal

We want:

-   a public route: `/`
-   a protected route: `/me`
-   auth based on a header: `Authorization: Bearer <token>`

------------------------------------------------------------------------

## Full Example

``` cpp
#include <vix.hpp>

using namespace vix;

int main()
{
  App app;

  // Simple auth middleware
  App::Middleware require_auth =
    [](Request& req, Response& res, App::Next next)
    {
      const std::string auth = req.header("Authorization");

      if (auth.empty())
      {
        res.status(401).json({
          "ok", false,
          "error", "missing_authorization",
          "hint", "Send: Authorization: Bearer <token>"
        });
        return;
      }

      // Very small check (demo only)
      if (auth != "Bearer dev_token")
      {
        res.status(403).json({
          "ok", false,
          "error", "invalid_token"
        });
        return;
      }

      // Continue
      next();
    };

  // Public route
  app.get("/", [](Request&, Response& res)
  {
    res.json({
      "message", "Public endpoint",
      "hint", "Try GET /me with Authorization header"
    });
  });

  // Protect everything under /me (exact path in this example)
  app.protect_exact("/me", require_auth);

  // Protected route
  app.get("/me", [](Request& req, Response& res)
  {
    (void)req;

    res.json({
      "ok", true,
      "user", "demo",
      "role", "user"
    });
  });

  app.run(8080);
  return 0;
}
```

------------------------------------------------------------------------

## Test with curl

Public:

``` bash
curl -i http://127.0.0.1:8080/
```

Protected without token:

``` bash
curl -i http://127.0.0.1:8080/me
```

Protected with token:

``` bash
curl -i -H "Authorization: Bearer dev_token" http://127.0.0.1:8080/me
```

------------------------------------------------------------------------

## Notes

-   This is a demo pattern, not a production auth system.
-   For real auth, prefer dedicated modules (API key, JWT, sessions).
-   Middleware can stop the chain by not calling `next()`.

Next example: ws-chat.

