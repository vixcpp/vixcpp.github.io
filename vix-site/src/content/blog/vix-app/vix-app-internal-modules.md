---
title: vix.app Internal Modules
description: How vix.app works with internal application modules created by vix modules, why modules are declared in the manifest, and how Vix keeps application architecture modular without manual CMake wiring.
date: 2026-05-25
---

# vix.app Internal Modules

`vix.app` can describe internal application modules.
These modules are not external dependencies.
They are parts of the application itself.
The goal is simple:

```text
application code stays modular
the manifest stays readable
the generated build handles the wiring
```

## The problem

As a C++ application grows, putting everything into one source tree becomes hard to maintain.
A backend application may quickly need separated areas such as:

- users
- auth
- billing
- orders
- notifications
- storage

Without a module structure, the project can become a flat collection of headers and source files.
Without build automation, every new module also requires manual CMake edits.
That creates friction.
A developer should be able to create a module, declare it in the app, and build.

## Internal modules

Internal modules are created with:

```bash
vix modules add User
```

This creates a module under:

```text
modules/User/
```

The module has its own public header and implementation file.
Conceptually:

```text
modules/User/
  include/User/api.hpp
  src/User.cpp
  CMakeLists.txt
```

The module is part of the application.
It is not downloaded from the registry.
It is not a system package.
It is local app code.

## Declaring modules in vix.app

A `vix.app` project declares internal modules with:

```text
modules = [
  User,
]
```

Example:

```text
name = api
type = executable
standard = c++20

sources = [
  src/main.cpp,
]

modules = [
  User,
]
```

This tells Vix:

```text
the app target depends on the internal module User
```

The generated build links the module into the application target.

## Field separation

`vix.app` keeps different concepts separate.

```text
modules   internal application modules
deps      external packages from the Vix Registry
packages  system or CMake packages resolved with find_package(...)
links     raw CMake targets or libraries linked manually
```

This separation is important.
A module is code inside the current application.
A registry dependency is external package code.
A package is a CMake discovery rule.
A link is a manual target-level link instruction.
The manifest stays explicit.

## Example backend app

A backend app can use internal modules for application features:

```text
name = api
type = executable
standard = c++20
output_dir = bin

sources = [
  src/main.cpp,
  src/api/app/AppBootstrap.cpp,
  src/api/support/HttpResponse.cpp,
]

include_dirs = [
  include,
  src,
]

modules = [
  User,
  Auth,
  Billing,
]
```

This makes the app structure visible directly in the manifest.
The reader can see that the app has internal modules for:

- `User`
- `Auth`
- `Billing`

without opening the generated CMake file.

## Build flow

The internal module flow is:

```text
vix modules add User
  -> modules/User/
  -> modules/User/CMakeLists.txt

vix.app
  -> modules = [ User ]

vix build
  -> generate .vix/generated/app/CMakeLists.txt
  -> include cmake/vix_modules.cmake
  -> link api with api::User
  -> build with CMake/Ninja
```

The user works with:

- `vix modules`
- `vix.app`
- `vix build`

Vix handles the generated CMake layer.

## Module targets

A module gets a canonical CMake alias based on the app name.
For an app named:

```text
name = api
```

and a module named:

```text
User
```

the expected module target is:

```text
api::User
```

So this manifest:

```text
name = api

modules = [
  User,
]
```

is conceptually linked as:

```cmake
target_link_libraries(api PRIVATE api::User)
```

The user does not write this manually in a `vix.app` project.

## Why the app name matters

The app name is used as the project namespace for internal modules.
Example:

```text
name = blog

modules = [
  User,
]
```

Expected module alias:

```text
blog::User
```

Another app:

```text
name = api

modules = [
  User,
]
```

Expected module alias:

```text
api::User
```

This keeps module targets local to the application.
It avoids generic target names like:

```text
User
```

which could conflict with other libraries or modules.

## vix modules init

Before adding modules, a project can initialize the module layout:

```bash
vix modules init
```

For a `vix.app` project, Vix does not patch a root `CMakeLists.txt`.
There is no user-maintained root CMake file.

The output is simple:

```text
vix.app project detected. CMake patch skipped.
modules initialized
```

Vix creates the module directory and module loader.
The generated CMake project later includes that loader automatically.

## vix modules add

Adding a module:

```bash
vix modules add User
```

creates:

```text
modules/User/
modules/User/include/User/api.hpp
modules/User/src/User.cpp
```

For a `vix.app` project, the next step is:

```text
add "User" to modules in vix.app
```

Then:

```bash
vix build
```

This is the intended workflow.

The user does not edit generated CMake.

## Why modules are declared manually

`vix modules add User` creates the module.

It does not automatically add it to `vix.app`.
That is intentional.
Creating a module and using a module are different actions.
A project may create a module that is not linked yet.
A module may be experimental.
A module may be used later.
The manifest should clearly show which modules the app target actually uses.
That is why the user declares:

```text
modules = [
  User,
]
```

## Generated module loading

The generated CMake includes the module loader from the real project directory:

```cmake
include("/absolute/path/to/project/cmake/vix_modules.cmake")
```

The absolute path matters.

The generated CMake file lives in:

```text
.vix/generated/app/
```

The module loader lives in:

```text
cmake/vix_modules.cmake
```

A relative include could point to the wrong location.
So Vix resolves the module loader from the original project directory.

## Why not patch CMakeLists.txt

For a classic CMake project, `vix modules init` can patch the root `CMakeLists.txt`.
For a `vix.app` project, that would be wrong.

The source of truth is:

```text
vix.app
```

The generated CMake file is disposable.
So the correct behavior is:

```text
CMake project   -> patch CMakeLists.txt when requested
vix.app project -> do not patch CMakeLists.txt
```

This keeps the `vix.app` workflow clean.

## Module structure

A module separates public API from implementation.

Example:

```text
modules/User/
  include/User/api.hpp
  src/User.cpp
```

The public header is what other app code can include:

```cpp
#include <User/api.hpp>
```

The implementation file stays inside the module.
This encourages a clear boundary.
The application can depend on the module API without knowing the internal implementation layout.

## Module safety

Internal modules should follow safe boundaries.
A public header should not include private implementation files.
A module that includes another module should declare that relationship in its module CMake target.
This prevents hidden coupling.
It also makes the build graph easier to understand.
A module system should not only create folders.
It should help preserve architecture.

## Modules and generated CMake

When `vix.app` declares:

```text
modules = [
  User,
]
```

Vix generates logic equivalent to:

```cmake
if(TARGET api::User)
  target_link_libraries(api PRIVATE api::User)
else()
  message(FATAL_ERROR "vix.app module not found: User")
endif()
```

The exact generated output may evolve.

The idea is stable:

```text
declared modules become target links
```

## Module not found

If a module is declared in `vix.app` but does not exist, the build should fail clearly.

Example:

```text
modules = [
  User,
]
```

But the module folder is missing:

```text
modules/User/
```

The error should explain that the module declared in `vix.app` is not available.
This is better than a generic CMake target error.
The user should know which manifest entry caused the problem.

## Modules and registry deps

Internal modules and registry dependencies can be used together.
Example:

```text
name = api
type = executable
standard = c++20

sources = [
  src/main.cpp,
]

modules = [
  User,
]

deps = [
  gk/email,
]
```

Here:

```text
User      local application module
gk/email  external registry package
```

The generated build links both into the app target.
But they remain different concepts in the manifest.

## Why this is app-first

The app should describe its architecture.
With modules, the manifest can say:

```text
this application is composed of these internal units
```

That is more meaningful than only listing source files.
Source files are low-level build input.
Modules are higher-level application structure.
This is why `modules` belongs in `vix.app`.

## Why this matters for large apps

As applications grow, architecture becomes more important than build commands.
A backend project may have:

- presentation
- application
- domain
- infrastructure
- support

Inside those areas, internal modules can represent clear feature boundaries.

Example:

```text
modules = [
  User,
  Auth,
  Orders,
  Notifications,
]
```

This gives the project a visible shape.
The manifest becomes more than a file list.
It becomes a small architecture map.

## Good developer experience

The module workflow should feel direct:

```bash
vix modules init
vix modules add User
```

Then edit:

```text
modules = [
  User,
]
```

Then:

```bash
vix build
```

The output should avoid internal build jargon when it is not needed.
For example, in a `vix.app` project, `vix modules add User` should not tell the user to edit `target_link_libraries(...)`.
It should tell the user to add the module in `vix.app`.

## What stays explicit

Vix does not silently link every module in `modules/`.
The user decides what the app uses.
This avoids accidental coupling.
It also allows modules to exist without being part of the current app target.
The manifest remains explicit:

```text
modules = [
  User,
  Billing,
]
```

Only declared modules are linked.

## Current design boundary

Internal modules currently use generated CMake underneath.

The flow is:

```text
modules/ -> cmake/vix_modules.cmake -> generated CMake -> CMake/Ninja
```

This is a compatibility layer.
Later, Vix can use the same manifest data to build modules through a native build graph.
The important part is that `vix.app` now has a structured way to describe internal architecture.

## Conclusion

`vix.app` can now work with internal application modules.
The developer can create a module with:

```bash
vix modules add User
```

Then declare it in the manifest:

```text
modules = [
  User,
]
```

Vix loads the module system.
Vix links the module into the app target.
The user does not maintain generated CMake.
This keeps the project simple at the surface and modular underneath.
