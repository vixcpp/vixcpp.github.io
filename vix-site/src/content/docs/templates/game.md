# Game Template

The game template creates a small Vix game project with a C++ entry point, a game package file, an assets directory, and a `vix.app` manifest that links the Vix game runtime.

Use this template when the project is meant to run as a game or interactive runtime, not as an HTTP backend, server-rendered web app, or general command-line application.

```bash id="game-template-create"
vix new space-demo --game
```

After creation, the normal first workflow is:

```bash id="game-template-first-workflow"
cd space-demo
vix build
vix run
```

## What this template is for

The game template is for projects that start from the Vix game foundation. It gives the project a minimal scene, a runtime entry point, asset storage, package metadata, and a manifest that links the correct Vix targets.

A generated game project is still a normal `vix.app` project. The difference is in the linked modules and runtime files. Instead of linking only the base Vix target, the game template links `vix::game` and `vix::io`, and it copies game resources such as `assets/` and `game.package.json` beside the built executable.

```txt id="game-template-map"
src/main.cpp        -> game entry point
assets/             -> game assets
game.package.json   -> game metadata
vix.app             -> C++ target manifest
vix.json            -> project tasks and metadata
```

## Generated project shape

A generated game project follows this general layout:

```txt id="game-template-layout"
space-demo/
  assets/
  src/
    main.cpp
  game.package.json
  README.md
  vix.app
  vix.json
```

The layout is intentionally small. The generated project gives you a working game runtime first, then leaves room to add scenes, assets, systems, gameplay code, and export workflows as the project grows.

## Entry point

The generated game starts from:

```txt id="game-template-main-path"
src/main.cpp
```

The file includes the Vix game headers and defines a minimal scene.

```cpp id="game-template-main-scene"
#include <vix/game/all.hpp>
#include <vix/print.hpp>

class MainScene final : public vix::game::Scene
{
public:
  vix::game::GameBoolResult on_load() override
  {
    vix::print("Main scene loaded");
    return vix::game::Scene::on_load();
  }

  void on_update(const vix::game::Frame &frame) override
  {
    vix::print("frame:", frame.index);

    if (frame.index >= 5)
    {
      app().stop();
    }
  }
};
```

The generated scene is simple because it is meant to prove that the runtime starts, loads a scene, receives frame updates, and can stop the application cleanly.

## Game runtime

The generated `main()` creates the game app, initializes the runtime, creates the scene, activates it, and runs the application.

```cpp id="game-template-runtime"
int main()
{
  vix::game::App app;
  app.set_title("space-demo");

  vix::game::GameRuntime runtime(app);

  auto runtime_init = runtime.init();
  if (!runtime_init)
  {
    vix::print("runtime init failed:", runtime_init.error().message());
    return 1;
  }

  auto scene = app.scenes().create<MainScene>("main");
  if (!scene)
  {
    vix::print("scene creation failed:", scene.error().message());
    return 1;
  }

  auto active = app.scenes().set_active("main");
  if (!active)
  {
    vix::print("scene activation failed:", active.error().message());
    return 1;
  }

  auto result = app.run();
  if (!result)
  {
    vix::print("game failed:", result.error().message());
    return 1;
  }

  return 0;
}
```

The important part is the shape of the startup flow.

```txt id="game-template-runtime-flow"
vix::game::App
  -> GameRuntime
      -> runtime.init()
  -> SceneManager
      -> create MainScene
      -> set active scene
  -> app.run()
```

This gives the project a real game loop from the first run without hiding the startup sequence.

## Scenes

The generated game uses a `Scene` as the first unit of game behavior.

```cpp id="game-template-scene-class"
class MainScene final : public vix::game::Scene
{
public:
  vix::game::GameBoolResult on_load() override;
  void on_update(const vix::game::Frame &frame) override;
};
```

`on_load()` is called when the scene is loaded. `on_update()` is called during the game loop and receives frame information.

The starter scene prints the frame index and stops after a few frames. That makes the first run predictable.

```txt id="game-template-output"
Main scene loaded
frame: 0
frame: 1
frame: 2
frame: 3
frame: 4
frame: 5
```

A real game can replace this starter scene with its own scene classes, input handling, rendering logic, gameplay systems, asset loading, and world state.

## Game package

The template generates a game package file.

```txt id="game-template-package-file"
game.package.json
```

A generated package can look like this:

```json id="game-template-package-json"
{
  "name": "space-demo",
  "version": "0.1.0",
  "author": "",
  "entry_scene": "main",
  "asset_root": "assets",
  "output_dir": "dist",
  "scenes": ["main"],
  "assets": []
}
```

This file describes game-level metadata. It is not the C++ build manifest. It belongs to the game runtime and asset/export side of the project.

The build target is described by `vix.app`. The game package describes the game itself.

## Assets

Game assets belong in:

```txt id="game-template-assets-dir"
assets/
```

This directory is where the project can place images, audio, maps, data files, exported content, or other files needed by the game at runtime.

The generated `vix.app` declares assets as a runtime resource.

```ini id="game-template-assets-resource"
resources = [
  "assets=assets",
  "game.package.json=game.package.json",
]
```

This matters because the built executable runs from the build output. Assets must be available beside the executable when the game starts.

A runtime output can look like this:

```txt id="game-template-runtime-layout"
bin/
  space-demo
  assets/
  game.package.json
```

Do not put game assets in `sources`. Assets are runtime files, not C++ compilation inputs.

## Manifest

The game template uses `vix.app` as the application manifest.

```txt id="game-template-vix-app-file"
vix.app
```

The generated manifest describes one executable target.

```ini id="game-template-vix-app"
name = "space-demo"
type = "executable"
standard = "c++20"

sources = [
  "src/main.cpp",
]

include_dirs = [
  "src",
]

compile_features = [
  "cxx_std_20",
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

output_dir = "bin"
```

The important fields are `links` and `resources`. The game template links the game and IO targets, then copies the asset directory and game package file into the runtime output.

## Linked Vix targets

The generated game links:

```ini id="game-template-links"
links = [
  "vix::game",
  "vix::io",
]
```

`vix::game` provides the game runtime foundation. `vix::io` provides IO support used by game projects and runtime resources.

This is different from a basic application manifest, which usually links:

```ini id="game-template-app-link"
links = [
  "vix::vix",
]
```

The game template should link the targets the runtime actually needs. Do not remove `vix::game` from a generated game unless the project is no longer using the Vix game runtime.

## Project metadata

The generated project also includes `vix.json`.

```txt id="game-template-vix-json-file"
vix.json
```

A generated game project can include tasks like this:

```json id="game-template-vix-json"
{
  "name": "space-demo",
  "deps": [],
  "vars": {
    "preset": "dev-ninja",
    "log_level": "info"
  },
  "tasks": {
    "dev": "vix run",
    "build": "vix build",
    "run": "vix run",
    "export": "vix run && vix build",
    "check": {
      "description": "Build and validate the game project",
      "command": "vix build"
    }
  }
}
```

`vix.json` describes project workflow and tasks. `vix.app` describes the compiled C++ target. `game.package.json` describes game metadata.

Keep those roles separate.

```txt id="game-template-file-roles"
vix.app             -> C++ executable target
vix.json            -> Vix project workflow
game.package.json   -> game metadata
assets/             -> runtime game files
```

## Build and run

Build the game from the project root.

```bash id="game-template-build"
vix build
```

Run it with:

```bash id="game-template-run"
vix run
```

The generated starter scene prints a few frames and exits. That behavior is intentional. It gives the first project a predictable run result before the developer adds a real loop, rendering, input, or gameplay code.

## Development workflow

A normal first session looks like this:

```bash id="game-template-dev-workflow"
vix new space-demo --game
cd space-demo

vix build
vix run
```

After editing the scene or game code:

```bash id="game-template-edit-workflow"
vix build
vix run
```

When assets are added under `assets/`, keep them in the asset directory and let the existing resource declaration copy them with the runtime output.

No manifest change is needed for new files under `assets/` when the whole directory is already declared as a resource.

## Adding more source files

When the game grows, split code into more files.

```txt id="game-template-more-sources-layout"
src/
  main.cpp
  scenes/
    MainScene.cpp
    MainScene.hpp
  systems/
    MovementSystem.cpp
    MovementSystem.hpp
```

Then list new `.cpp` files in `vix.app`.

```ini id="game-template-more-sources-manifest"
sources = [
  "src/main.cpp",
  "src/scenes/MainScene.cpp",
  "src/systems/MovementSystem.cpp",
]
```

Headers are reached through `include_dirs`.

```ini id="game-template-include-dirs"
include_dirs = [
  "src",
]
```

A `.cpp` file that is not listed in `sources` is not compiled into the game target.

## Adding assets

Assets should stay under the asset root declared in `game.package.json`.

```json id="game-template-asset-root"
{
  "asset_root": "assets"
}
```

For example:

```txt id="game-template-assets-layout"
assets/
  sprites/
    player.png
  audio/
    theme.ogg
  maps/
    level01.json
```

Because the manifest already declares:

```ini id="game-template-assets-resource-again"
resources = [
  "assets=assets",
]
```

the asset directory can be copied into the runtime output.

Keep the source tree and runtime tree easy to understand. Put source code in `src/`, and put game runtime files in `assets/`.

## Difference from the application template

The application template creates a general Vix C++ app. It is a good fit for small HTTP apps, tools, and projects that do not need the game runtime.

The game template creates a game-oriented executable. It links `vix::game`, creates a `GameRuntime`, uses scenes, and carries `assets/` and `game.package.json` as runtime resources.

```txt id="game-template-app-difference"
application template  -> general Vix app
game template         -> Vix game runtime + scene + assets
```

Use the game template when the game runtime is part of the project from the beginning.

## Difference from the backend and web templates

The backend and web templates start HTTP applications. They create controllers, route registries, middleware registries, environment files, public directories, views, storage, and production metadata.

The game template starts a game runtime. It does not generate HTTP controllers, route registries, middleware registries, `.env.example`, or production service metadata.

```txt id="game-template-other-difference"
backend/web  -> server process and HTTP routes
game         -> game runtime and scenes
```

Choose the template based on the process you want to run.

## Tests

The game template focuses on a runnable game starter. If the project adds tests, keep them separate from the game executable.

A simple future layout can look like this:

```txt id="game-template-tests-layout"
tests/
  test_basic.cpp
  vix.app
```

The test target should define its own `main()` and should not include `src/main.cpp` from the game executable.

Run tests through the normal Vix test workflow when the project has test targets.

```bash id="game-template-tests-command"
vix tests
```

For a basic game starter, `vix build` and `vix run` are the first useful checks.

## Common mistakes

The most common mistake is adding assets to `sources`. Asset files are not C++ files. Keep them under `assets/` and copy them through `resources`.

Another mistake is removing `game.package.json` from resources. The game may need package metadata at runtime, so the generated manifest copies it beside the executable.

A third mistake is adding new `.cpp` files under `src/` and forgetting to add them to `vix.app`. The files exist in the project, but they are not part of the game target until the manifest lists them.

A fourth mistake is treating `game.package.json` as a replacement for `vix.app`. The package file describes game metadata. The manifest describes the C++ target.

## Recommended rule

Use the game template when the project should start from the Vix game runtime. Keep C++ code in `src/`, assets in `assets/`, game metadata in `game.package.json`, C++ build wiring in `vix.app`, and project tasks in `vix.json`. When the game grows, add source files deliberately and keep runtime assets out of the C++ source list.

## Next step

Continue with the generated layout to see each file created by the game template and how the runtime, scene, assets, package file, and manifest fit together.

[Generated Layout](/templates/game/layout)
