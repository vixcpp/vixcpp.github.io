# Resources

`resources` tells Vix which runtime files should be copied beside the built target. These are files the program needs after compilation: environment files, static assets, views, storage directories, game assets, package metadata, or any other file that must be available when the application starts.

A source file belongs in `sources`. A header directory belongs in `include_dirs`. A runtime file belongs in `resources`.

```ini id="vix-app-resources-basic"
resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

This keeps the build description clear. The manifest describes not only what is compiled, but also what must travel with the executable for the application to run correctly.

## Resource syntax

Each resource entry supports two forms.

```txt id="vix-app-resources-syntax"
source
source=destination
```

When only the source is provided, Vix copies it beside the built target using the same basename.

```ini id="vix-app-resource-source-only"
resources = [
  "public",
]
```

When a destination is provided, Vix copies the source to that destination beside the built target.

```ini id="vix-app-resource-source-destination"
resources = [
  "public=public",
  ".env=.env",
]
```

Both paths are written relative to the project root. The destination is relative to the runtime output directory.

## Backend resources

A backend usually needs configuration, public files, views, and storage available at runtime.

```ini id="vix-app-backend-resources"
resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

A common backend layout looks like this:

```txt id="vix-app-backend-layout"
api/
  .env
  public/
  views/
  storage/
  src/
    main.cpp
  vix.app
```

After the build, those runtime files are placed next to the generated application output. This lets the backend read `.env`, serve files from `public`, render files from `views`, and write application data under `storage` without depending on the original source directory.

## Game resources

A game project usually needs assets and game metadata.

```ini id="vix-app-game-resources"
resources = [
  "assets=assets",
  "game.package.json=game.package.json",
]
```

The C++ source starts the game runtime, while the resources keep the files needed by the game beside the executable.

```txt id="vix-app-game-layout"
space-demo/
  assets/
  game.package.json
  src/
    main.cpp
  vix.app
```

This keeps assets out of `sources`. They are not compiled as C++ files, but they still need to be present when the program runs.

## Destination paths

The destination path lets the runtime layout differ from the source layout.

```ini id="vix-app-resource-custom-destination"
resources = [
  "config/dev.env=.env",
  "frontend/dist=public",
]
```

In this example, `config/dev.env` is copied as `.env`, and the frontend build output is copied as `public`.

This is useful when the source project has a development layout, but the application expects a simpler runtime layout.

```txt id="vix-app-resource-destination-result"
bin/
  app
  .env
  public/
```

Keep destination paths simple. Runtime layouts are easier to debug when files are placed in predictable locations.

## Files and directories

A resource can be a file or a directory.

```ini id="vix-app-resource-files-and-dirs"
resources = [
  ".env=.env",
  "public=public",
]
```

A file is copied as a file. A directory is copied as a directory. This makes it possible to keep static assets, templates, generated frontend builds, or storage folders attached to the application output.

## Resources are not source files

Do not use `resources` to make C++ files part of the target.

```ini id="vix-app-wrong-source-resource"
# Wrong for C++ compilation.
resources = [
  "src/main.cpp",
]
```

C++ files belong in `sources`.

```ini id="vix-app-correct-source"
sources = [
  "src/main.cpp",
]
```

The same idea applies to headers. Do not copy headers as resources to fix include errors. Add the right include root instead.

```ini id="vix-app-correct-include"
include_dirs = [
  "include",
]
```

Resources are for runtime files, not compilation inputs.

## Resources and `output_dir`

`resources` works together with `output_dir`. The output directory decides where the built target is placed, and resources are copied beside that target.

```ini id="vix-app-output-resource"
output_dir = "bin"

resources = [
  ".env=.env",
  "public=public",
]
```

A simple runtime layout may look like this:

```txt id="vix-app-output-resource-layout"
bin/
  api
  .env
  public/
```

This is why generated Vix applications often use `output_dir = "bin"`. It gives the executable and its runtime files one clear place to live.

## Backend example

```ini id="vix-app-resource-backend-complete"
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

resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

This manifest says that the backend builds one executable and carries the runtime directories it needs. The source list remains focused on C++ files, while `resources` handles the files read or served at runtime.

## Game example

```ini id="vix-app-resource-game-complete"
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

The game executable can now start with its asset directory and package metadata available in the runtime output.

## Frontend build output

In a frontend + Vix backend project, the frontend build output can be copied as a backend resource.

```ini id="vix-app-resource-frontend"
resources = [
  "frontend/dist=public",
]
```

This is useful when the backend serves the compiled frontend from `public`.

The frontend still has its own workflow. Installing dependencies and building the frontend belong in project tasks, while `vix.app` only describes what the C++ backend needs at runtime.

## Common mistakes

The most common mistake is forgetting that paths are relative to the project root.

```ini id="vix-app-resource-relative"
resources = [
  "public=public",
]
```

This expects `public` to exist next to `vix.app`, not inside the build output.

Another mistake is using resources for files that should be generated by the program. A `storage` directory can be copied when the project ships initial files, but application data created at runtime should be handled by the application itself.

A third mistake is copying too much. A resource list should contain what the program needs to run, not the entire project tree.

## Checking resources

After changing the resource list, build the project.

```bash id="vix-app-resource-build"
vix build
```

Then run it from the normal Vix workflow.

```bash id="vix-app-resource-run"
vix run
```

If the program cannot find `.env`, `public`, `views`, assets, or metadata files, check the resource source path first, then check the destination path and `output_dir`.

## Next step

Continue with output directory to understand where the built target and copied resources are placed.

[Output Directory](/guides/vix-app/output-directory)
