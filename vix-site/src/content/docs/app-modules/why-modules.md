# Why Modules Exist

Application modules exist because large C++ applications need boundaries that are visible in the project itself. A backend can start with a small `src/` directory, but real applications rarely stay that simple. Features begin to grow their own routes, services, models, validation, tests, migrations, and dependencies on other features. Without a clear module layer, those responsibilities tend to collect in the same folders until the project becomes difficult to read.

Vix modules give those features a stable place. They let one application remain one application, while each important part of the codebase can live behind its own public interface and private implementation.

## The problem with a flat application tree

A simple backend usually begins with a few files.

```txt
api/
  src/
    main.cpp
    routes.cpp
    controllers.cpp
  include/
  vix.app
```

This shape is easy to understand while the application is small. The problem appears when the backend starts to grow by feature instead of by file type. Authentication is no longer only a controller. It may need password logic, token validation, session helpers, route handlers, database access, and tests. Projects may depend on authentication. Builds may depend on projects. Packages may depend on both projects and storage. At that point, a flat tree hides the real structure of the application.

The code still builds, but the architecture becomes harder to see. A developer has to open several folders to understand which files belong together, and dependencies between features are often discovered only by reading include statements or following implementation details.

## The module idea

A module groups one application feature into one place.

```txt
modules/auth/
  include/auth/
  src/
  tests/
  CMakeLists.txt
  vix.module
```

The public headers live under `include/<module>/`. The implementation lives under `src/`. Tests live with the module they protect. The module metadata lives in `vix.module`, and the module has its own CMake target.

This does not split the backend into multiple services. The application still builds as one application. Modules only make the internal structure explicit.

```txt
api/
  src/
  include/
  modules/
    auth/
    projects/
    builds/
    packages/
  vix.app
```

That distinction matters. Application modules are not a deployment boundary. They are an organization boundary inside the project.

## A feature should own its code

A good module represents a real part of the application. Names such as `auth`, `projects`, `billing`, `packages`, and `deployments` describe features or domains. They tell another developer what part of the system the module owns.

Names such as `utils`, `helpers`, `common`, or `misc` should be used carefully. They often become places where unrelated code is collected without a clear owner. A module should make the architecture easier to understand, not create another folder where decisions disappear.

For example, this layout gives each backend feature a visible home.

```txt
modules/
  auth/
  projects/
  builds/
  packages/
  logs/
```

A developer can open the project and understand the major parts of the backend before reading the implementation. That is the main value of the module layer.

## Public and private boundaries

Each module has a public side and a private side. Code outside the module should use the public headers.

```cpp
#include <auth/AuthModule.hpp>
```

Private implementation files stay under `src/`.

```txt
modules/auth/
  include/auth/      public module interface
  src/               private implementation
```

This boundary keeps the module honest. Other parts of the application should not depend on private implementation details. When a module needs to expose behavior, it should do it through its public headers. When another module uses it, that relationship should be declared as a dependency instead of being hidden behind direct access to private files.

## Dependencies should be visible

As an application grows, dependencies between features become part of the architecture. If `projects` depends on `auth`, that relationship should be visible.

```ini
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

This is easier to reason about than discovering the dependency through scattered includes. The manifest tells the reader that `projects` uses `auth`, and the module checks can validate that the relationship is safe.

The goal is not to make the project more complicated. The goal is to make important relationships explicit before they become accidental.

## Modules and vix.app

In a `vix.app` project, modules are declared from the root manifest.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

This makes the active module graph part of the application description. The application target remains defined by `vix.app`, while each module keeps its own files under `modules/<name>/`.

A disabled module can remain in the manifest and on disk.

```ini
[module.billing]
enabled = false
path = "modules/billing"
kind = "backend"
depends = [
  "auth",
]
```

That is useful when a feature is being prepared, reviewed, or temporarily removed from the active build. The module is not deleted; it is simply not wired into the generated application target.

## Modules and existing CMake projects

The module system is also useful outside a fully generated Vix project. An existing C++ project with a root `CMakeLists.txt` can initialize module support and create module targets.

```bash
vix modules init
vix modules add auth
```

In this mode, Vix creates the `modules/` layout and the CMake loader. Each module becomes a normal CMake target with an alias such as:

```txt
api_auth
api::auth
```

This lets an existing project adopt the module structure gradually. The project can keep its current build decisions while using Vix modules for clearer feature boundaries.

## Why checks matter

A module layer only helps if its boundaries are respected. `vix modules check` exists to catch the mistakes that usually make modular code collapse back into a tangled project tree.

```bash
vix modules check
```

The command checks the module structure, declared dependencies, enabled and disabled module relationships, duplicate route prefixes, dependency cycles, and public headers that include private implementation paths.

This is why modules are more than folders. A folder convention can be ignored silently. A checked module structure gives the project a stronger signal when the architecture starts to drift.

## When modules are useful

Modules are useful when the codebase has features that are large enough to deserve ownership. A small application does not need to split every route into a module on the first day. The module layer becomes valuable when several features grow independently, when dependencies between features matter, or when a team needs a consistent place for feature-specific code and tests.

Use modules when they make the project easier to understand. Avoid creating modules only because the tool supports them. A good module should make the application structure more obvious than it was before.

## Next step

Continue with the getting started guide to initialize module support and create the first module.

[Getting Started](/app-modules/getting-started)
