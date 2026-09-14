# Building the Vix Game Foundation

Vix.cpp is not only about compiling and running C++ faster.
It is also about giving developers a cleaner runtime model for building real applications.
`vix/game` is one step in that direction.

It introduces a game application foundation for Vix.cpp: a small, modular runtime layer for building games, simulations, prototypes, interactive tools, and custom engines.
The goal is not to replace Unity, Unreal, Godot, SDL, GLFW, Vulkan, OpenGL, Box2D, Lua, or any existing game technology.

The goal is simpler:

> Give C++ developers a serious foundation for real-time applications without locking them into a complete engine.

## Why vix/game exists

Most C++ game projects start by rebuilding the same foundation:

- application loop
- frame timing
- scene management
- events
- asset loading
- background jobs
- input state
- window abstraction
- renderer abstraction
- runtime orchestration
- editor, scripting, audio, and physics layers

These systems are usually scattered across the application, tied to a specific backend, or mixed directly into game code.

`vix/game` exists to avoid that.

It provides a clean structure while keeping the developer in control.

## The design principle

The module follows one clear principle:

> Build the foundation, not the prison.
A game engine gives you everything, but often forces you into its architecture.
`vix/game` takes a different path.
It gives you the runtime pieces needed to build your own architecture:

- `App`
- `GameLoop`
- `Frame`
- `EventBus`
- `SceneManager`
- `Registry`
- `AssetManager`
- `AsyncAssetLoader`
- `JobSystem`
- `InputSystem`
- `Window`
- `Renderer`
- `Renderer2D`
- `GameRuntime`
- `EditorRuntime`
- `ScriptRuntime`
- `AudioRuntime`
- `PhysicsRuntime`
- `GamePackage`

Each part stays explicit, readable, and backend-independent.

## A backend-independent foundation

`vix/game` does not force a specific backend.

It does not require SDL.
It does not require GLFW.
It does not require OpenGL.
It does not require Vulkan.
It does not require Box2D.
It does not require Lua.
That is intentional.

The first job of the module is to define a stable runtime surface. Real backends can be integrated later without changing the high-level architecture.

This makes the module useful for:

- small games
- game prototypes
- simulations
- real-time visualization tools
- custom engines
- editor tools
- educational engine architecture
- future Vix-powered game workflows

## Core architecture

The current architecture is organized around runtime layers.

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

EditorRuntime
  └── Editor mode, play mode, editor context

SceneRuntime
  └── High-level scene operations

ScriptRuntime
  └── Dependency-free scripting hook foundation

AudioRuntime
  └── Dependency-free audio foundation

PhysicsRuntime
  └── Dependency-free 2D physics foundation

GamePackage
  └── Project metadata for future packaging workflows
```

The important part is separation.

`App` does not become a giant engine object.
It remains the root of the application lifecycle, while dedicated runtime objects coordinate the larger systems.

## Basic example

A minimal game can be written with a scene and a runtime.

```cpp
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

  void on_update(const vix::game::Frame& frame) override
  {
    vix::print("frame:", frame.index);

    if (frame.index >= 5)
    {
      app().stop();
    }
  }
};

int main()
{
  vix::game::App app;
  app.set_title("My Game");

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

This example shows the direction of the module:

- explicit application root
- explicit runtime initialization
- explicit scene creation
- explicit error handling
- no hidden engine magic

## Game projects from the CLI

`vix/game` is also integrated with the Vix CLI.

A new game project can be generated with:

```bash
vix new mario --game
cd mario
vix build
vix run
```

The generated project contains:

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

This matters because the goal is not only to provide C++ APIs.
The goal is to make the complete development workflow smoother.
A developer should be able to create, build, and run a C++ game project without manually wiring everything from scratch.

## vix.app for game projects

Generated game projects use `vix.app`.

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

This keeps the project simple while still allowing Vix to use its native build pipeline internally.
The developer gets a clean manifest.
Vix handles the build structure.

## What is completed

The module has grown through three foundation stages.

### V1

V1 focused on the core runtime base:

- `App`
- game loop
- `TimeStep`
- `Frame`
- `EventBus`
- `SceneManager`
- simple `Registry`
- `AssetManager`
- `JobSystem`
- examples
- tests

### V2

V2 added more real game architecture concepts:

- input module
- window abstraction
- renderer abstraction
- 2D rendering foundation
- asset cache
- async asset loading
- scene serialization
- stronger ECS iteration APIs

### V3

V3 introduced higher-level runtime separation:

- `GameContext`
- `GameRuntime`
- `EditorContext`
- `EditorRuntime`
- `SceneRuntime`
- `ScriptRuntime`
- `AudioRuntime`
- `PhysicsRuntime`
- `GamePackage`
- `vix new --game` template
- runtime smoke example

This gives the module a clearer long-term direction.

## What comes next

The next step is real backend integration.

Planned areas include:

- real window backend integration
- real renderer backend integration
- sprite rendering backend
- asset pipeline improvements
- editor tool APIs
- scene inspection APIs
- runtime diagnostics
- scripting backend integration
- audio backend integration
- physics backend integration
- game packaging command
- game export workflow

The important part is that these future pieces can now be built on top of a stable foundation.

## Why this matters for Vix.cpp

Vix.cpp is becoming more than a command-line tool.
It is becoming a runtime foundation for building real C++ software.
`vix/game` proves that the same ideas behind Vix can apply to interactive applications:

- explicit APIs
- fast workflows
- modular architecture
- clean errors
- backend independence
- progressive complexity
- real C++ control

C++ gives developers power.
Vix tries to make that power easier to use.
`vix/game` brings that philosophy to games and real-time software.

## Final note

`vix/game` is not trying to be a complete game engine.
It is trying to be the layer before the engine.

A foundation.
A place where developers can start small, understand the runtime, and grow their own architecture without losing control.
