# Generated Layout

The game template generates a small Vix game project with a C++ entry point, an asset directory, a game package file, a `vix.app` manifest, and project workflow metadata in `vix.json`.

A generated project named `space-demo` follows this shape:

```txt id="game-layout-root"
space-demo/
  assets/
  src/
    main.cpp
  game.package.json
  README.md
  vix.app
  vix.json
```

The layout is intentionally small. A game project should start with a runnable runtime, a visible scene, and a clear place for assets. More scenes, systems, rendering code, input handling, and exported content can be added when the project actually needs them.

## `src/main.cpp`

The generated game entry point lives in:

```txt id="game-layout-main-path"
src/main.cpp
```

This file creates the game application, initializes the runtime, creates the first scene, activates it, and starts the game loop.

```txt id="game-layout-main-flow"
main.cpp
  -> vix::game::App
  -> vix::game::GameRuntime
  -> MainScene
  -> app.run()
```

The generated file includes the Vix game headers.

```cpp id="game-layout-main-includes"
#include <vix/game/all.hpp>
#include <vix/print.hpp>
```

The starter scene is defined directly in `main.cpp` so the first generated project stays easy to read.

```cpp id="game-layout-main-scene"
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

The starter scene is not meant to be the final game structure. It is there to prove that the runtime starts, a scene can be loaded, frame updates are received, and the application can stop cleanly.

## Runtime startup

The generated `main()` creates a `vix::game::App`, sets the game title, initializes the runtime, creates the first scene, activates it, and runs the app.

```cpp id="game-layout-runtime-startup"
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

The error checks are part of the generated shape. A game runtime should fail clearly when initialization, scene creation, scene activation, or the main run loop cannot continue.

## `assets/`

Game assets belong in:

```txt id="game-layout-assets-dir"
assets/
```

This directory is the project’s asset root. It can contain images, audio files, maps, level data, configuration files, exported content, or any other runtime files needed by the game.

A project can grow this directory naturally.

```txt id="game-layout-assets-example"
assets/
  sprites/
    player.png
  audio/
    theme.ogg
  maps/
    level01.json
```

Assets are not C++ source files. They should not be added to `sources` in `vix.app`. The generated manifest copies the asset directory as a runtime resource.

```ini id="game-layout-assets-resource"
resources = [
  "assets=assets",
]
```

This makes the asset directory available beside the built executable.

## `game.package.json`

The generated game package file lives at the project root.

```txt id="game-layout-package-path"
game.package.json
```

It describes game-level metadata.

```json id="game-layout-package-json"
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

This file belongs to the game layer. It describes the game name, version, entry scene, asset root, output directory, scene list, and asset list.

It is not the C++ build manifest. The C++ executable is described by `vix.app`.

```txt id="game-layout-package-vs-manifest"
game.package.json  -> game metadata
vix.app            -> C++ executable target
```

Keep this distinction clear when the project grows.

## `vix.app`

The root `vix.app` file describes the C++ game executable.

```txt id="game-layout-vix-app-path"
vix.app
```

The generated manifest looks like this:

```ini id="game-layout-vix-app"
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

The manifest has two important responsibilities. It tells Vix which C++ files are compiled into the game target, and it tells Vix which runtime files must be copied beside the built executable.

## Source files

The generated game starts with one source file.

```ini id="game-layout-sources"
sources = [
  "src/main.cpp",
]
```

When the game grows, add new `.cpp` files to the source list.

```txt id="game-layout-source-growth"
src/
  main.cpp
  scenes/
    MainScene.cpp
    MainScene.hpp
  systems/
    MovementSystem.cpp
    MovementSystem.hpp
```

Then update the manifest.

```ini id="game-layout-source-growth-manifest"
sources = [
  "src/main.cpp",
  "src/scenes/MainScene.cpp",
  "src/systems/MovementSystem.cpp",
]
```

A `.cpp` file that is not listed in `sources` is not compiled into the game target.

## Include directories

The generated game uses `src` as its include root.

```ini id="game-layout-include-dirs"
include_dirs = [
  "src",
]
```

This lets the project include headers from the `src/` tree.

```cpp id="game-layout-include-example"
#include <scenes/MainScene.hpp>
#include <systems/MovementSystem.hpp>
```

If the project later adds a public include tree, add it deliberately.

```txt id="game-layout-include-tree"
include/
  space_demo/
    scenes/
      MainScene.hpp
```

Then update the manifest.

```ini id="game-layout-include-tree-manifest"
include_dirs = [
  "include",
  "src",
]
```

Keep include roots simple. A game project becomes easier to read when headers are reachable through predictable paths.

## Linked targets

The generated game links the Vix game and IO targets.

```ini id="game-layout-links"
links = [
  "vix::game",
  "vix::io",
]
```

This is what makes the template a game project instead of a normal application project. `vix::game` provides the game runtime foundation, and `vix::io` provides IO support used by game projects and runtime resources.

A normal application often links only the base Vix target.

```ini id="game-layout-app-links"
links = [
  "vix::vix",
]
```

Do not remove the game targets from a generated game unless the project is no longer using the Vix game runtime.

## Runtime resources

The generated game copies assets and package metadata into the runtime output.

```ini id="game-layout-resources"
resources = [
  "assets=assets",
  "game.package.json=game.package.json",
]
```

A runtime output can look like this:

```txt id="game-layout-runtime-output"
bin/
  space-demo
  assets/
  game.package.json
```

This matters because the game executable runs from the build output. The source tree may contain `assets/`, but the running program needs the assets beside the built target.

When a game cannot find an asset, check the runtime output first. The asset may exist in the project root but may not have been copied to the directory where the executable runs.

## `output_dir`

The generated game uses:

```ini id="game-layout-output-dir"
output_dir = "bin"
```

This keeps the executable, assets, and game package file in one predictable runtime area.

```txt id="game-layout-bin-output"
bin/
  space-demo
  assets/
  game.package.json
```

For a game project, this is a practical default. It makes local runs easier to debug because the runtime files are placed beside the executable.

## `vix.json`

The generated game also includes project metadata and tasks.

```txt id="game-layout-vix-json-path"
vix.json
```

A generated file can look like this:

```json id="game-layout-vix-json"
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

`vix.json` does not describe the C++ target. It describes project workflow and task shortcuts.

The split is:

```txt id="game-layout-file-roles"
vix.app             C++ build target and runtime resources
vix.json            project metadata and tasks
game.package.json   game metadata
assets/             runtime asset files
src/                C++ game source
```

## `README.md`

The generated README gives the project a local starting guide.

```txt id="game-layout-readme-path"
README.md
```

It explains the quick start, expected starter output, project layout, game package file, asset directory, and manifest role.

The README belongs to the generated project itself. These documentation pages explain the template in more detail.

## How the pieces work together

The generated game has a simple startup and runtime shape.

```txt id="game-layout-runtime-map"
vix build
  -> reads vix.app
  -> compiles src/main.cpp
  -> links vix::game and vix::io
  -> copies assets/
  -> copies game.package.json

vix run
  -> starts bin/space-demo
  -> initializes GameRuntime
  -> creates MainScene
  -> runs frame updates
```

The project files have separate responsibilities.

```txt id="game-layout-responsibilities"
src/main.cpp        game runtime entry point
assets/             files needed by the game at runtime
game.package.json   game metadata and asset root
vix.app             C++ target, links, resources, output directory
vix.json            tasks and Vix project metadata
README.md           generated project guide
```

This separation keeps the generated game understandable. Source code stays in `src/`, runtime assets stay in `assets/`, game metadata stays in `game.package.json`, and build wiring stays in `vix.app`.

## Adding a new scene

When the starter scene becomes too large, move it into its own files.

```txt id="game-layout-new-scene-files"
src/
  main.cpp
  scenes/
    MainScene.hpp
    MainScene.cpp
```

A header can declare the scene.

```cpp id="game-layout-new-scene-header"
#pragma once

#include <vix/game/all.hpp>

class MainScene final : public vix::game::Scene
{
public:
  vix::game::GameBoolResult on_load() override;
  void on_update(const vix::game::Frame &frame) override;
};
```

The implementation can own the scene behavior.

```cpp id="game-layout-new-scene-cpp"
#include <scenes/MainScene.hpp>

#include <vix/print.hpp>

vix::game::GameBoolResult MainScene::on_load()
{
  vix::print("Main scene loaded");
  return vix::game::Scene::on_load();
}

void MainScene::on_update(const vix::game::Frame &frame)
{
  vix::print("frame:", frame.index);
}
```

Then add the new `.cpp` file to `vix.app`.

```ini id="game-layout-new-scene-manifest"
sources = [
  "src/main.cpp",
  "src/scenes/MainScene.cpp",
]
```

The header does not need to be listed in `sources`. The implementation file does.

## Adding game systems

As gameplay grows, systems can live under their own directory.

```txt id="game-layout-systems"
src/
  systems/
    MovementSystem.hpp
    MovementSystem.cpp
    RenderSystem.hpp
    RenderSystem.cpp
```

Add implementation files to the manifest.

```ini id="game-layout-systems-manifest"
sources = [
  "src/main.cpp",
  "src/scenes/MainScene.cpp",
  "src/systems/MovementSystem.cpp",
  "src/systems/RenderSystem.cpp",
]
```

The manifest should stay honest. If a `.cpp` file is part of the game executable, it belongs in `sources`.

## Adding assets

Add runtime files under `assets/`.

```txt id="game-layout-add-assets"
assets/
  sprites/player.png
  audio/theme.ogg
  maps/level01.json
```

Because the generated manifest already copies the entire asset directory, no manifest change is needed when new files are added inside `assets/`.

```ini id="game-layout-assets-existing-resource"
resources = [
  "assets=assets",
]
```

A manifest change is only needed when the asset root itself changes.

## Updating the game package

When a new scene becomes part of the game metadata, update `game.package.json`.

```json id="game-layout-update-package"
{
  "entry_scene": "main",
  "scenes": ["main", "menu", "level01"]
}
```

Keep package metadata aligned with the project structure. If the package says the entry scene is `main`, the game startup should create or activate that scene consistently.

## Build and run

From the project root, build the game.

```bash id="game-layout-build"
vix build
```

Run it with:

```bash id="game-layout-run"
vix run
```

The generated starter should print the scene load message and a few frame updates.

```txt id="game-layout-generated-output"
Main scene loaded
frame: 0
frame: 1
frame: 2
frame: 3
frame: 4
frame: 5
```

This output confirms that the generated runtime, scene creation, scene activation, and game loop are wired correctly.

## Common mistakes

The most common mistake is adding assets to `sources`. Assets are runtime files, not C++ source files. Keep them under `assets/` and copy them through `resources`.

Another mistake is creating new `.cpp` files but forgetting to add them to `vix.app`. The files can exist in `src/`, but they are not part of the game target until the manifest lists them.

A third mistake is editing `game.package.json` and expecting it to change the C++ build. The package file describes game metadata. The C++ target is controlled by `vix.app`.

A fourth mistake is removing `game.package.json` from resources. If the game runtime expects the package file beside the executable, it must be copied into the runtime output.

## Recommended rule

Keep the game layout simple and explicit. Put C++ source in `src/`, put runtime files in `assets/`, keep game metadata in `game.package.json`, list compiled `.cpp` files in `vix.app`, and keep task shortcuts in `vix.json`. When the game grows, add files deliberately and keep the build manifest aligned with the source tree.

## Next step

Continue with the game manifest to understand why the template links `vix::game` and `vix::io`, how resources are copied, and how the runtime output is shaped.

[Game Manifest](/templates/game/manifest)
