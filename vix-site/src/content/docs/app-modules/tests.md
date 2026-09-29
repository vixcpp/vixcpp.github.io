# Tests

Application modules can have their own tests. This keeps validation close to the feature being tested instead of forcing every check into a single application-level test directory. A module that owns authentication can keep authentication tests under `modules/auth/tests/`. A module that owns projects can keep project tests under `modules/projects/tests/`.

This does not make tests part of the main application executable. Module tests are separate test targets. The application can still build and run normally, while module tests give each feature a local place to prove that its public API, wiring, and basic behavior are valid.

## Test layout

A generated module contains a `tests/` directory.

```txt
modules/auth/
  include/auth/
  src/
  tests/
    test_auth.cpp
  CMakeLists.txt
  vix.module
```

The test file belongs to the module. It should test the module through the public headers that the module exposes.

```cpp
#include <auth/api.hpp>
```

For backend modules, the generated test includes the module entry point.

```cpp
#include <auth/AuthModule.hpp>
```

This keeps the test aligned with the way the module is meant to be used by the rest of the application.

## Tests for simple modules

A simple module usually exposes a small public API.

```txt
modules/logger/
  include/logger/
    api.hpp
  src/
    logger.cpp
  tests/
    test_logger.cpp
```

The generated test can stay small at first.

```cpp
#include <logger/api.hpp>

#include <vix/tests/tests.hpp>

int main()
{
  using namespace vix::tests;

  auto &registry = TestRegistry::instance();
  registry.clear();

  registry.add(TestCase("logger module exposes its API name", []
  {
    Assert::equal(
        api::logger::Api::name(),
        std::string("api::logger"));
  }));

  return TestRunner::run_all_and_exit();
}
```

The first test does not need to cover the full future behavior of the module. Its first job is to prove that the module target, public header, and test wiring are correct. As the module gains real logic, the tests should grow with it.

## Tests for backend modules

Backend modules are routed modules. Their first generated test usually checks the module entry point.

```txt
modules/auth/
  include/auth/
    AuthModule.hpp
  tests/
    test_auth.cpp
```

A basic backend module test can verify that the module exposes its name.

```cpp
#include <auth/AuthModule.hpp>

#include <vix/tests/tests.hpp>

int main()
{
  using namespace vix::tests;

  auto &registry = TestRegistry::instance();
  registry.clear();

  registry.add(TestCase("auth module exposes its name", []
  {
    Assert::equal(
        std::string(api::auth::AuthModule::name()),
        std::string("auth"));
  }));

  return TestRunner::run_all_and_exit();
}
```

This is intentionally small. It gives the module a working test target from the beginning. Later, the module can add tests for controllers, services, validation rules, repositories, or any other code that belongs to the feature.

## Keep tests close to ownership

A module test should protect the code owned by that module.

```txt
modules/
  auth/
    tests/
      test_auth.cpp
  projects/
    tests/
      test_projects.cpp
```

This makes reviews easier. When a pull request changes `modules/auth/`, the related tests are nearby. When a new feature is added to `modules/projects/`, the test location is already clear.

Application-level tests can still exist under the root `tests/` directory when they test the application as a whole.

```txt
api/
  tests/
    test_basic.cpp
  modules/
    auth/
      tests/
        test_auth.cpp
```

Use module tests for module behavior. Use application tests for startup, integration, high-level routes, or workflows that cross several modules.

## Do not include application main.cpp

Module tests should define their own `main()` function. They should not include the application entry point.

```cpp
// Avoid this.
#include "../../src/main.cpp"
```

The application `main.cpp` starts the real application. A test executable should own its own entry point and test only the code it needs.

A better shape is to include public headers from the module.

```cpp
#include <auth/AuthModule.hpp>
```

Then test the module behavior through that public surface.

## Public API first

Module tests should prefer the public module API.

```cpp
#include <auth/AuthModule.hpp>
```

or:

```cpp
#include <auth/api.hpp>
```

Avoid writing tests that depend on private implementation files unless the test is intentionally placed inside the module and the project has a clear reason to test that private detail directly.

```cpp
// Avoid from outside the module public surface.
#include "../src/AuthStore.hpp"
```

If a type or function needs to be tested and used outside the module, it probably belongs in a public module header. If it is only an implementation detail, keep the test close and avoid exposing it accidentally through another module.

## Tests and dependencies

When a module test uses another module, the dependency should be visible in the module build file.

For example, if `projects` tests include a public header from `auth`:

```cpp
#include <auth/api.hpp>
```

then the `projects` module target should depend on `auth`.

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

This keeps test code from hiding dependency problems. A module test should not pass only because include paths leaked from somewhere else in the build.

After changing module dependencies, run:

```bash
vix modules check
```

The check command validates cross-module includes and explicit dependency relationships.

## Running module checks and tests

The module structure should be checked before the project test suite.

```bash
vix modules check
vix tests
```

For a stronger local validation, use:

```bash
vix modules check
vix check --tests --run
```

This gives a better signal before a commit. The module graph is valid, the application builds, and the tests run from the normal Vix workflow.

## Tests in vix.app projects

In a `vix.app` project, the root manifest decides which modules are active.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

A disabled module is not part of the active application wiring.

```ini
[module.billing]
enabled = false
path = "modules/billing"
kind = "backend"
depends = [
  "auth",
]
```

Treat tests for disabled modules carefully. If a module is disabled because it is incomplete, its tests may not be expected to pass as part of the main validation workflow. When the module is ready to become part of the application again, enable it and run the checks.

```bash
vix modules enable billing
vix modules check
vix check --tests --run
```

This keeps the test result aligned with the application that Vix is actually building.

## Tests in CMake projects

In CMake-first projects, module tests are generated inside the module directory and connected through the module `CMakeLists.txt`. The root project still controls the final build configuration, test enablement, and target selection.

The module layout remains the same.

```txt
modules/auth/
  tests/
    test_auth.cpp
```

The most important rule is still the same: tests should include public module headers and module dependencies should be declared through target links.

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

For custom CMake projects, you may need to enable test targets from your own build configuration before running the test suite.

## Growing tests with the module

A generated module starts with a small test because the skeleton should compile immediately. As the feature grows, the test suite should become more specific.

An `auth` module may later test:

```txt
password validation
token creation
session lookup
login route behavior
permission checks
```

A `projects` module may later test:

```txt
project creation rules
ownership checks
project lookup
project route responses
dependency on auth
```

The tests should follow the responsibilities of the module. Avoid turning one module’s tests into a place where unrelated application behavior is checked.

## Common mistakes

The most common mistake is putting module tests into the main application source list. Test files should not be compiled into the application executable. They belong to separate test targets.

Another mistake is testing private files from another module. That weakens the module boundary and makes refactoring harder. Test through public headers when the behavior is public, and keep implementation-specific tests inside the module that owns the implementation.

A third mistake is changing module declarations and running only one test file. When `vix.app`, module dependencies, or module paths change, run the module check and a full project validation.

```bash
vix modules check
vix check --tests --run
```

## Recommended workflow

For module-based backends, use this before a commit:

```bash
vix modules check
vix check --tests --run
```

For smaller local changes inside one module, it is still useful to run the module check before the test suite.

```bash
vix modules check
vix tests
```

The habit matters more than the command length. Check the module graph first, then run the tests that prove the code still behaves correctly.

## Next step

Continue with best practices to see how to name modules, decide when to create one, and keep the module graph readable as the application grows.

[Best Practices](/app-modules/best-practices)
