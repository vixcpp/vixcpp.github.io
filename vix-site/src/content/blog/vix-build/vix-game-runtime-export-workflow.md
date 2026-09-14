---
title: "From Runtime to Export: vix/game V4 and V5"
description: "How vix/game evolved from a runtime foundation into SDL rendering, game templates, and an export workflow."
date: 2026-05-22
---

# From Runtime to Export: vix/game V4 and V5

`vix/game` started as a clean game application foundation for Vix.cpp.
The first versions focused on the base runtime pieces:

- application lifecycle
- game loop
- frame timing
- scenes
- events
- assets
- jobs
- input
- window abstraction
- renderer abstraction
- runtime layers

That foundation matters because C++ game projects often become complex before the first real feature is even built.

But a foundation is only useful if it can grow.
V4 and V5 move `vix/game` from a simple runtime base toward something more complete:
- V4 connects the runtime to real window and rendering backends.
- V5 adds project export, asset scanning, package metadata, and CLI workflow.

The goal is still the same:

> Build the foundation, not the prison.
`vix/game` is not trying to become a locked game engine.
It gives developers the runtime pieces needed to build games, simulations, tools, prototypes, and custom engines on top of Vix.cpp.

## Why V4 matters

Before V4, the module already had a strong internal structure.

It had:

- `App`
- `GameLoop`
- `SceneManager`
- `AssetManager`
- `InputSystem`
- `Window`
- `Renderer`
- `Renderer2D`
- `GameContext`
- `GameRuntime`
- `EditorRuntime`

But most of the architecture was still backend-independent.

That was intentional.
The first job was to define the runtime surface before attaching it to real platform backends.
V4 is where the module starts crossing that line.
It keeps the clean abstractions, but adds the first real backend path.

## Runtime coordination

V4 makes `GameRuntime` the main runtime coordinator.
Instead of pushing every responsibility into `App`, runtime orchestration lives in dedicated objects.
This keeps the architecture clean.

```text
App
  ├── GameLoop
  ├── EventBus
  ├── SceneManager
  ├── AssetManager
  ├── AsyncAssetLoader
  └── JobSystem

GameContext
  ├── App access
  ├── InputSystem
  ├── Window
  ├── Renderer
  └── Renderer2D

GameRuntime
  └── Coordinates runtime frame phases
```

`App` remains the lifecycle root.
`GameContext` gives systems access to shared runtime services.
`GameRuntime` coordinates the higher-level execution flow.
This separation is important because the module will later need editor tools, scripting, audio, physics, packaging, and diagnostics without turning `App` into a giant engine object.

## Backend installation through GameContext

V4 improves `GameContext` so runtime backends can be installed cleanly.
That means a game can run with:

- a null window
- a null renderer
- an SDL window
- an SDL renderer
- future custom backends

This matters for testing and CI.
A game module should not require a graphical backend just to validate core logic.
Headless execution remains possible, while real rendering becomes available when a backend is installed.

```text
GameContext
  ├── InputSystem
  ├── Window
  ├── Renderer
  └── Renderer2D
```

This gives Vix a runtime model that can work both for local development and automated builds.

## SDL window backend

V4 adds the first SDL window backend path.
The module can now create an SDL-backed window while keeping the public API backend-independent.
The high-level code should not be forced to know whether the window comes from SDL, GLFW, a null backend, or a future platform layer.
That is the point of the abstraction.

```text
Game code
  -> Window interface
  -> SDLWindow backend
```

The result is simple:

- game code targets `vix/game`
- backend code handles SDL details
- tests can still use null backends
- future backends can be added without changing the mental model

## SDL input mapping

Windowing alone is not enough.
A real runtime also needs input.
V4 connects SDL input events to the backend-independent `InputSystem`.
The input layer supports:

- key state
- pointer button state
- pointer position
- pointer delta
- wheel delta
- action bindings
- pressed, down, and released queries

Game code can bind actions without being tied directly to SDL events.

Example:

```cpp
input.bind_key("jump", vix::game::InputKey::Space);

if (input.action_pressed("jump"))
{
  // jump
}
```

This keeps the game-facing API stable.
SDL becomes an implementation detail.

## SDL renderer backend

V4 also introduces an SDL renderer backend.
This is a major step because the module moves from abstract rendering concepts to visible output.
The rendering path becomes:

```text
Renderer2D
  -> DrawSpriteCommand
  -> Renderer
  -> SDLRenderer
```

`Renderer2D` stays as the high-level 2D rendering API.
`SDLRenderer` handles the backend-specific rendering work.
This gives Vix a first real path toward 2D games, tools, and simulations without locking the architecture to SDL forever.

## Sprite rendering

V4 adds sprite rendering through the SDL renderer path.

The flow is:

```text
AssetManager
  -> Asset bytes
  -> Renderer::upload_texture()
  -> SDLRenderer texture store
  -> Sprite
  -> Renderer2D
  -> DrawSpriteCommand
  -> SDLRenderer::draw_sprite()
```

This is important because it connects multiple systems together:

- assets
- renderer abstraction
- texture upload
- 2D command collection
- backend drawing

That means `vix/game` is no longer only a runtime skeleton.
It can now demonstrate a real rendering pipeline.

## Runtime diagnostics and inspection

V4 also adds runtime diagnostics and inspection APIs.
This prepares the module for more serious tooling.
A game runtime should not be a black box.
Developers need to inspect:

- runtime state
- scene state
- editor state
- backend state
- frame behavior
- active systems

This is especially important for future editor tools.
The editor layer cannot be added cleanly if the runtime cannot expose useful information.
V4 starts preparing that surface.

## Why V5 matters

V4 makes the runtime more real.
V5 makes the workflow more complete.
A game project is not only code that runs locally.

It also needs:

- project metadata
- asset metadata
- generated templates
- export output
- inspectable manifests
- CLI commands
- predictable project layout

V5 adds that layer.
The main feature is:

```bash
vix game export
```

This command turns a game project into an exported directory with copied assets, package metadata, and an export manifest.

## Game package metadata

V5 builds on `GamePackage`.

A game project can describe itself with metadata such as:

- name
- version
- author
- entry scene
- asset root
- output directory
- scene list
- asset list

This metadata is the base for future workflows:

- project creation
- game export
- packaging
- editor loading
- release preparation
- distribution metadata

The important part is that this metadata is explicit.
Vix should not guess everything silently.
The project should be inspectable.

## vix new --game template

V5 also improves the generated game template.
A new game project can be created with:

```bash
vix new mario --game
cd mario
vix build
vix dev
vix game export
```

The generated layout is simple:

```text
mario/
  assets/
  game.package.json
  README.md
  src/
    main.cpp
  vix.app
  vix.json
```

The generated project uses:

- `vix/game`
- `GameRuntime`
- `Scene`
- `SceneManager`
- `GamePackage`
- `vix.app`
- `vix.json`

That matters because Vix is not only a library collection.
It is also a workflow.
The developer should be able to create a game project, build it, run it, and export it without manually wiring every file.

## vix.app for game projects

The generated game project uses `vix.app`.

Example:

```text
name = "mario"
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

This keeps the project readable.
The developer sees a small manifest.
Vix handles the native build structure internally.
That is the direction of Vix:

> Keep the workflow simple without removing the power of C++.

## Game export workflow
V5 adds a complete export workflow.
A game can now be exported with:

```bash
vix game export
```

The command reads `game.package.json`, scans the asset root, copies exportable files, and generates an export manifest.

Example output:

```text
✔ Game exported.
  • Output    : ./dist/mario
  • Name      : mario
  • Version   : 0.1.0
  • Asset root: assets
  • Copied files: 4
  • Copied directories: 1
```

Generated layout:

```text
dist/
  mario/
    assets/
    game.package.json
    README.md
    export.json
```

This is the first step toward real packaging.
It is not yet a full release builder.
It does not try to solve everything immediately.
But it gives the project a stable export shape.

## export.json

The generated `export.json` makes the export inspectable.
It can contain:

- game name
- version
- asset root
- output path
- copied file count
- copied directory count
- build date
- exported asset list

This matters because export should not be a hidden copy operation.
A developer should be able to inspect what was exported and why.
That also prepares future features:

- asset hashing
- asset bundling
- release profiles
- editor export tools
- distribution metadata
- reproducible packaging

## Asset export pipeline

V5 adds a small asset export pipeline.
The pipeline scans the configured asset root and classifies exported assets.
Supported asset categories include:

- image
- text
- binary

Example exported asset metadata:

```json
{
  "path": "player.png",
  "type": "image",
  "size_bytes": 1024
}
```

The pipeline also ignores temporary and cache files.

Examples:

- `.gitkeep`
- `.DS_Store`
- `Thumbs.db`
- `cache/`
- `tmp/`
- `temp/`
- `build/`
- `dist/`
- `*.tmp`
- `*.cache`
- `*.log`

This keeps the export clean.
The first version does not transform, compress, hash, or bundle assets yet.
It only discovers, classifies, copies, and records them.
That is enough for a clear V5 export foundation.

## vix dev behavior for games

V5 also fixes `vix dev` behavior for short-lived game applications.
This is important because the default generated game template may run for only a few frames and then stop.
That is normal for a smoke test or generated starter project.
A development command should handle that cleanly instead of treating every short-lived run as a broken workflow.

This improves the first experience after:

```bash
vix new mario --game
cd mario
vix dev
```

The generated application can initialize, run, print frames, and shut down cleanly.
Expected output:

```text
Main scene loaded
game app initialized title=mario
frame: 0
frame: 1
frame: 2
frame: 3
frame: 4
frame: 5
game app shutdown title=mario
```

## What V4 and V5 prove

Together, V4 and V5 prove that `vix/game` is moving in the right direction.
V4 proves the runtime can connect to real backends:

- SDL window
- SDL input
- SDL renderer
- texture upload
- sprite rendering
- runtime diagnostics
- scene inspection

V5 proves the workflow can become complete:

- game project template
- package metadata
- asset scanning
- export manifest
- `vix game export`
- generated export directory
- cleaner `vix dev` behavior

This is the bridge between a runtime foundation and a real game development workflow.

## What comes next

V6 should build on this foundation.

The next logical steps are:

- scripting backend integration
- audio backend integration
- physics backend integration
- editor tool APIs
- asset hashing
- asset bundling
- export profiles
- release packaging
- richer project templates

The important thing is that these features now have a place to live.
They do not need to be forced into `App`.
They can build on the existing runtime layers, package metadata, and export pipeline.

## Why this matters for Vix.cpp

Vix.cpp is not only about making C++ builds easier.
It is about making C++ application development feel more direct.
`vix/game` shows that this philosophy can apply to games and real-time software:

- explicit APIs
- backend independence
- simple project creation
- clean runtime architecture
- native C++ control
- generated templates
- exportable projects
- inspectable metadata

The goal is not to compete directly with Unity, Unreal, or Godot.
The goal is different.
`vix/game` is the layer before the engine.
It gives C++ developers a foundation they can understand, extend, and control.

## Final note

V4 made the runtime visible.
V5 made the project exportable.
That is an important step for Vix.cpp.
A C++ game project should not begin with build system pain, backend confusion, and scattered runtime code.

It should begin with a clean foundation:

```bash
vix new mario --game
cd mario
vix dev
vix game export
```

That is the direction of `vix/game`.
