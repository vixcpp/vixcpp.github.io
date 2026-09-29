# Packages and Links

`packages`, `deps`, and `links` describe what the application uses outside its own source files. They are related, but they do not mean the same thing. A package makes a library or SDK available to the build, a registry dependency declares code that should be resolved by Vix, and a link entry tells the application target what it actually uses.

For most Vix applications, the flow is simple: declare the Vix package, link the Vix targets used by the application, then build normally.

```bash id="ngh7h4"
vix build
vix run
```

This keeps the manifest readable. The application says what it needs, and Vix handles the build workflow around it.

## Basic Vix application

A small application usually starts with the `vix` package and the base Vix target.

```ini id="m26u6a"
packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

This is enough for a normal application that uses the main Vix SDK entry point.

```cpp id="ryyegu"
#include <vix/print.hpp>

int main()
{
  vix::print("Hello from Vix");
  return 0;
}
```

The important part is that `packages` and `links` work together. The package makes Vix available, while the link entry says that this application target uses `vix::vix`.

## Packages

The `packages` field declares external packages that must be available to the application.

```ini id="ld4b8x"
packages = [
  "vix",
]
```

A package entry is usually just a name. In Vix projects, `vix` is the common package name because it exposes the installed Vix SDK targets used by generated applications and modules.

Package entries can also carry requirement and component information when a package supports it.

```ini id="xk49if"
packages = [
  "vix",
  "OpenSSL:REQUIRED",
  "Qt6:COMPONENTS=Widgets,Network:REQUIRED",
]
```

The supported forms are:

```txt id="fzyd3v"
name
name:REQUIRED
name:COMPONENTS=a,b
name:COMPONENTS=a,b:REQUIRED
```

The order of `COMPONENTS=...` and `REQUIRED` does not matter. Component names are separated by commas, and whitespace around them is ignored.

## Links

The `links` field declares the targets or libraries that are linked into the application.

```ini id="ayjo7x"
links = [
  "vix::vix",
]
```

Think of `links` as the final usage list. If the application uses the base Vix API, link `vix::vix`. If it uses a specific SDK module, link the target for that module.

A backend application using ORM may link both the base Vix target and the ORM target.

```ini id="fr0g74"
packages = [
  "vix",
]

links = [
  "vix::vix",
  "vix::orm",
]
```

A game project links the game and I/O modules instead.

```ini id="ulcg8x"
packages = [
  "vix",
]

links = [
  "vix::game",
  "vix::io",
]
```

Keep the link list honest. A manifest should not link every module in the SDK only because they exist. It should link the targets the application actually uses.

## Package versus link

A package makes something available. A link entry connects the application target to a specific library or module.

```ini id="ckirdd"
packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

In this example, `vix` is the package. `vix::vix` is the target used by the application.

When the application starts using another Vix module, the link list is the part that changes.

```ini id="vkw01z"
links = [
  "vix::vix",
  "vix::orm",
]
```

This distinction matters because one package can expose more than one target. The manifest should make the actual target usage visible.

## Registry dependencies

The `deps` field declares dependencies from the Vix Registry.

```ini id="w45nf5"
deps = [
  "adastra/logger",
  "tools/json@1.2.0",
]
```

Accepted dependency forms are:

```txt id="om5oyj"
namespace/name
namespace/name@version
@namespace/name
@namespace/name@version
```

When Vix reads dependencies from `vix.app`, it syncs them into the project dependency state and resolves the lockfile. This lets an application keep its high-level dependency intent in `vix.app` while still using the normal Vix dependency workflow.

After adding or changing registry dependencies, run:

```bash id="rgri4c"
vix install
vix build
```

A registry dependency does not automatically mean the application is linked against every target exported by that dependency. The dependency makes the package available to the project; the `links` field should still describe what the application target uses.

## Using Vix SDK targets

The Vix SDK is organized into focused modules. A project should link the SDK targets that match the code it uses.

A simple tool may only need the base target:

```ini id="w94tcu"
links = [
  "vix::vix",
]
```

A backend with database features may add ORM:

```ini id="t439c8"
links = [
  "vix::vix",
  "vix::orm",
]
```

A game project can stay focused on the game runtime:

```ini id="xhxxzo"
links = [
  "vix::game",
  "vix::io",
]
```

The manifest should follow the source code, not the other way around. When a module is introduced in the code, add the matching link entry. When a module is no longer used, remove it from `links`.

## Backend example

Generated backend applications start with the Vix package and link the base Vix target. Optional features can add more targets.

```ini id="bo9l9h"
name = "api"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
  "src/api/support/HttpResponses.cpp",
  "src/api/presentation/routes/RouteRegistry.cpp",
  "src/api/presentation/middleware/MiddlewareRegistry.cpp",
  "src/api/presentation/controllers/HomeController.cpp",
  "src/api/presentation/controllers/HealthController.cpp",
]

include_dirs = [
  "include",
  "src",
]

defines = [
  "VIX_BACKEND_APP=1",
  "VIX_APP_NAME=api",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

When the backend uses ORM, the manifest can make that explicit.

```ini id="y21j5z"
defines = [
  "VIX_BACKEND_APP=1",
  "VIX_APP_NAME=api",
  "VIX_USE_ORM=1",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
  "vix::orm",
]
```

The definition marks the feature at compile time, while the link entry connects the target to the ORM module.

## Game example

A Vix game project has a smaller dependency shape. It usually links the game runtime and the I/O module.

```ini id="wa5o3e"
name = "space-demo"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
]

include_dirs = [
  "src",
]

packages = [
  "vix",
]

links = [
  "vix::game",
  "vix::io",
]

resources = [
  "assets=assets",
  "game.package.json=game.package.json",
]
```

The manifest stays close to the project. Source files describe the program, links describe the SDK modules used by the program, and resources describe what the program needs at runtime.

## Registry dependency example

A project can declare registry dependencies in `vix.app`.

```ini id="t0h1f2"
name = "api"
type = "executable"
standard = "c++20"

sources = [
  "src/main.cpp",
]

include_dirs = [
  "include",
  "src",
]

packages = [
  "vix",
]

deps = [
  "adastra/logger@1.0.0",
]

links = [
  "vix::vix",
  "adastra::logger",
]
```

The exact link target exported by a registry package depends on that package. The dependency entry says what Vix should resolve. The link entry should use the target name provided by the package documentation.

## Required packages

Use `REQUIRED` when the application cannot be built without a package.

```ini id="ra3spb"
packages = [
  "vix",
  "OpenSSL:REQUIRED",
]
```

This makes the manifest clearer for important external requirements. A reader can immediately see that the package is not optional for the application.

## Package components

Some packages expose components. Components let the manifest request only the parts the application needs.

```ini id="pp2w8x"
packages = [
  "Qt6:COMPONENTS=Widgets,Network:REQUIRED",
]
```

A component list belongs in `packages`, while the concrete targets still belong in `links`.

```ini id="r6sqsv"
packages = [
  "Qt6:COMPONENTS=Widgets,Network:REQUIRED",
]

links = [
  "Qt6::Widgets",
  "Qt6::Network",
]
```

This keeps the two steps readable: request the package components, then link the targets used by the application.

## Internal modules are different

Vix app modules are not registry dependencies. They are internal parts of the same application, declared with `[module.<name>]`.

```ini id="u1q6hl"
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

A module dependency such as `projects` depending on `auth` belongs in the module section, not in `deps`.

```ini id="pkir9x"
depends = [
  "auth",
]
```

Use `deps` for Vix Registry dependencies. Use `[module.<name>]` sections for internal application modules.

## Recommended order

In a `vix.app` file, place packages and dependencies near the link list.

```ini id="gslp01"
packages = [
  "vix",
]

deps = [
  "adastra/logger@1.0.0",
]

links = [
  "vix::vix",
  "adastra::logger",
]
```

This order reads naturally. First the manifest says which packages are available, then which registry dependencies are required, then which targets the application actually links.

## Common mistakes

The most common mistake is adding a package but forgetting the matching link entry.

```ini id="bbk8zd"
packages = [
  "vix",
]
```

If the code uses the base Vix target, the manifest should also include:

```ini id="tbeqrc"
links = [
  "vix::vix",
]
```

Another common mistake is putting registry package names in `links`.

```ini id="vm7kht"
# Not enough by itself.
deps = [
  "adastra/logger",
]
```

The dependency tells Vix what to resolve. The application still needs to link the exported target from that dependency.

```ini id="dwbz2p"
links = [
  "adastra::logger",
]
```

The exact target name must come from the package itself.

A third mistake is linking too much. A large link list can hide the real shape of the application. Start with what the code uses, then add targets as the application grows.

## Checking package and link changes

After editing `packages`, `deps`, or `links`, build the project.

```bash id="j0by05"
vix build
```

When registry dependencies changed, install or resolve them before building.

```bash id="b7m9u3"
vix install
vix build
```

For applications with internal modules, run the module check as well.

```bash id="cbdmuu"
vix modules check
```

This catches missing dependencies, invalid module relationships, and link issues before they become harder to diagnose.

## Complete example

```ini id="p33o6m"
name = "api"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
  "src/api/support/HttpResponses.cpp",
  "src/api/presentation/routes/RouteRegistry.cpp",
  "src/api/presentation/middleware/MiddlewareRegistry.cpp",
  "src/api/presentation/controllers/HomeController.cpp",
  "src/api/presentation/controllers/HealthController.cpp",
]

include_dirs = [
  "include",
  "src",
]

defines = [
  "VIX_BACKEND_APP=1",
  "VIX_APP_NAME=api",
]

packages = [
  "vix",
]

deps = [
  "adastra/logger@1.0.0",
]

links = [
  "vix::vix",
  "adastra::logger",
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

This manifest keeps external dependencies, linked targets, runtime resources, and internal modules in separate places. That separation is what keeps `vix.app` readable as the application grows.

## Next step

Continue with resources to see how runtime files such as `.env`, `public`, `views`, assets, and package metadata are copied beside the built target.

[Resources](/guides/vix-app/resources)
