# Tests

A `vix.app` project can be tested through the normal Vix CLI workflow. The manifest describes the application target, while test commands are handled by Vix from the project root.

```bash id="vix-app-tests-basic"
vix tests
```

For application projects, tests should stay close to the code they protect. A backend can keep route, service, module, and utility tests under `tests/`, while the application itself remains described by `vix.app`.

## Basic workflow

Build the application first when you want to confirm that the manifest, source list, include paths, packages, links, and resources are valid.

```bash id="vix-app-tests-build"
vix build
```

Then run the test suite.

```bash id="vix-app-tests-run"
vix tests
```

For a stronger local check, use:

```bash id="vix-app-tests-check-run"
vix check --tests --run
```

This is the command you usually want before a commit because it validates the project and runs the tests in one workflow.

## Where tests live

A simple project can use a `tests/` directory at the project root.

```txt id="vix-app-tests-layout"
api/
  include/
  src/
  tests/
    health_test.cpp
    app_bootstrap_test.cpp
  vix.app
  vix.json
```

The `vix.app` file should remain focused on the application target. Test files do not need to be mixed into the main application `sources` list unless they are part of the application itself, which is usually not the case.

```ini id="vix-app-tests-main-sources"
sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
  "src/api/support/HttpResponses.cpp",
]
```

Keep test sources separate. It makes the production target easier to read and avoids accidentally compiling test-only code into the application.

## A small test

A Vix test can be a small C++ program that returns `0` on success and a non-zero value on failure.

```cpp id="vix-app-tests-small-test"
#include <cassert>
#include <string>

int main()
{
  std::string name = "vix";

  assert(name == "vix");
  assert(!name.empty());

  return 0;
}
```

This style is useful for small module and utility tests. It keeps the test clear and does not require a heavy framework when the check is simple.

## Testing code from the application

When a test needs to use application code, keep the application headers reachable through the same include layout used by the app.

```txt id="vix-app-tests-include-layout"
api/
  include/
    api/
      support/
        HttpResponses.hpp
  src/
    api/
      support/
        HttpResponses.cpp
  tests/
    http_responses_test.cpp
  vix.app
```

The test should include the public or shared header in the same style used by the application.

```cpp id="vix-app-tests-include-example"
#include <api/support/HttpResponses.hpp>

#include <cassert>

int main()
{
  auto response = api::support::ok_text("hello");

  assert(response.status == 200);

  return 0;
}
```

The important part is the boundary. Test the code through the headers the project already exposes. Avoid reaching into private implementation files unless the test is intentionally placed next to that private code.

## Tests and app modules

When a backend uses app modules, each module can have tests that match its responsibility.

```txt id="vix-app-tests-modules-layout"
api/
  modules/
    auth/
      include/
      src/
      tests/
        auth_module_test.cpp
    projects/
      include/
      src/
      tests/
        projects_module_test.cpp
  tests/
    app_routes_test.cpp
  vix.app
```

The module declarations remain in `vix.app`.

```ini id="vix-app-tests-modules-manifest"
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []

[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

Run module checks before the test suite when module boundaries matter.

```bash id="vix-app-tests-modules-check"
vix modules check
vix tests
```

This catches structural mistakes before the test run reaches the compiler or runtime.

## Testing enabled modules

A disabled module is declared in the manifest, but it is not part of the active application target.

```ini id="vix-app-tests-disabled-module"
[module.billing]
enabled = false
path = "modules/billing"
kind = "backend"
depends = [
  "auth",
]
```

Tests for an inactive module should be treated carefully. When the module is not enabled, it should not be required by the main application test workflow. Enable the module before testing it as part of the application.

```bash id="vix-app-tests-enable-module"
vix modules enable billing
vix modules check
vix tests
```

This keeps the test result aligned with the application that Vix is actually building.

## Backend test workflow

A backend project usually needs more than one kind of check. The application should build, its module structure should be valid, and the test suite should pass.

```bash id="vix-app-tests-backend-workflow"
vix modules check
vix build
vix tests
```

For the full local validation workflow, use:

```bash id="vix-app-tests-backend-check"
vix check --tests --run
```

This is especially useful after editing `vix.app`, adding a source file, changing include paths, enabling a module, or adding a dependency.

## Tasks in `vix.json`

`vix.app` describes the application target. Project commands and shortcuts belong in `vix.json`.

A generated backend can expose test-related tasks like this:

```json id="vix-app-tests-vix-json"
{
  "tasks": {
    "build": "vix build",
    "test": "vix tests",
    "check": "vix check --tests --run"
  }
}
```

Then the project can keep a short, repeatable workflow.

```bash id="vix-app-tests-task-run"
vix task test
vix task check
```

This keeps `vix.app` clean. The manifest describes the target; `vix.json` describes convenient project commands.

## What not to put in `vix.app`

Do not add test-only files to the main application source list.

```ini id="vix-app-tests-wrong-sources"
# Avoid this for normal application tests.
sources = [
  "src/main.cpp",
  "tests/health_test.cpp",
]
```

The application target should compile the application. Tests should be discovered and run through the test workflow.

Do not use `resources` for test source files.

```ini id="vix-app-tests-wrong-resources"
# Wrong idea.
resources = [
  "tests=tests",
]
```

Resources are runtime files copied beside the built target. Test files are not runtime resources for the application.

## Example project

```txt id="vix-app-tests-complete-layout"
api/
  include/
    api/
      support/
        HttpResponses.hpp
  src/
    main.cpp
    api/
      support/
        HttpResponses.cpp
      app/
        AppBootstrap.cpp
  modules/
    auth/
    projects/
  tests/
    http_responses_test.cpp
    app_bootstrap_test.cpp
  vix.app
  vix.json
```

```ini id="vix-app-tests-complete-manifest"
name = "api"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
  "src/api/support/HttpResponses.cpp",
]

include_dirs = [
  "include",
  "src",
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

[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []

[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

The manifest stays focused on the application. The tests live beside the project and run through Vix.

## Common mistakes

The first mistake is treating tests as part of the application target. That makes the main source list confusing and can accidentally pull test code into the executable.

The second mistake is testing module internals through private paths from another module. Module tests should respect the same public and private boundaries as the application code.

The third mistake is changing `vix.app` and running only a single test file. After manifest changes, run a full build or check because the change may affect source wiring, modules, resources, packages, or links.

## Recommended check before commit

For a normal application:

```bash id="vix-app-tests-recommended-app"
vix build
vix tests
```

For a backend with app modules:

```bash id="vix-app-tests-recommended-modules"
vix modules check
vix check --tests --run
```

This gives a clean signal: the manifest is valid, the module structure is valid, the application builds, and the tests pass.

## Next step

Continue with examples to see complete `vix.app` manifests for application, backend, game, and library projects.

[Examples](/guides/vix-app/examples)
