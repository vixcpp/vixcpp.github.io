# CMake

The `agent` module is built as a normal CMake library target. The concrete target is `vix_ai_agent`, and the public namespaced alias for consumers is:

```cmake
vix::ai_agent
```

Use this target when an application or another module needs the lower-level agent runtime: `AgentConfig`, `AgentRequest`, `Agent`, model providers, workspace scanning, tools, cache, and run history.

## Public target

The module defines:

```cmake
add_library(vix_ai_agent STATIC
  ${VIX_AI_AGENT_SOURCES}
)

add_library(vix::ai_agent ALIAS vix_ai_agent)
```

A consuming target should link against the alias:

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::ai_agent
)
```

This keeps the consumer code tied to the public CMake target instead of the internal target name.

## Header

In C++ code, prefer the public Vix AI aggregator:

```cpp
#include <vix/ai.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

For advanced files that only need the lower-level agent runtime, the direct runtime header can also be used:

```cpp
#include <vix/ai/agent/AgentRuntime.hpp>
```

## Required C++ standard

The module requires C++20.

```cmake
target_compile_features(vix_ai_agent
  PUBLIC
    cxx_std_20
)
```

Applications that link against `vix::ai_agent` should be built with C++20 or newer.

```cmake
target_compile_features(my_app
  PRIVATE
    cxx_std_20
)
```

## Link from an application

A minimal application CMake target can link the agent module like this:

```cmake
cmake_minimum_required(VERSION 3.20)

project(my_agent_app LANGUAGES CXX)

add_executable(my_agent_app
  main.cpp
)

target_compile_features(my_agent_app
  PRIVATE
    cxx_std_20
)

target_link_libraries(my_agent_app
  PRIVATE
    vix::ai_agent
)
```

If the program uses `vix::print`, link the module that provides the print API as well.

```cmake
target_link_libraries(my_agent_app
  PRIVATE
    vix::ai_agent
    vix::io
)
```

This matches the examples shipped with the module: the agent runtime is linked through `vix::ai_agent`, while printing examples also link `vix::io`.

## Public dependencies

The `agent` module depends on several Vix modules because it touches model transport, workspace paths, process execution, JSON, cache, time, errors, and local runtime data.

The module links these targets:

```cmake
target_link_libraries(vix_ai_agent
  PUBLIC
    vix::error
    vix::json
    vix::fs
    vix::path
    vix::process
    vix::net
    vix::env
    vix::time
    vix::crypto
    vix::log
    vix::cache
)
```

Consumers normally do not need to link all of these dependencies manually when they link `vix::ai_agent`. The target expresses them as public dependencies so CMake can carry the required usage information through the target graph.

## Build inside the Vix repository

From the Vix root, build the project normally:

```bash
cd ~/vixcpp/vix
vix build --build-target all -v
```

From the module directory:

```bash
cd ~/vixcpp/vix/modules/agent
vix build --build-target all -v
```

The exact build directory depends on the active Vix build configuration, but the module itself is a standard CMake target.

## Build examples

Examples are disabled by default. Enable them with:

```bash
cmake -S . -B build-ninja -G Ninja -DVIX_AI_AGENT_BUILD_EXAMPLES=ON
cmake --build build-ninja
```

The examples use `vix::print`, so the examples path requires `vix::io` in addition to `vix::ai_agent`.

The module defines example targets such as:

```text
vix_ai_agent_basic_agent
vix_ai_agent_scan_project
vix_ai_agent_ollama_agent
vix_ai_agent_with_cache
vix_ai_agent_with_command_tool
vix_ai_agent_custom_provider
vix_ai_agent_public_api
```

These examples are useful for checking the runtime in isolation: basic Ollama usage, workspace scanning, cache behavior, custom providers, command tools, and the stable public `Agent::run` workflow.

## Build tests

Tests are disabled by default. Enable them with:

```bash
cmake -S . -B build-ninja -G Ninja -DVIX_AI_AGENT_BUILD_TESTS=ON
cmake --build build-ninja
ctest --test-dir build-ninja --output-on-failure
```

From the module directory, the test binary can also be run directly after building:

```bash
./build-ninja/vix_ai_agent_tests
```

The current test areas cover the main runtime pieces: configuration, validation, workspace handling, project scanning, file policy, file reading, tool registry, command tool behavior, run storage, cache, and public API behavior.

## Standalone dependency behavior

When the module is built outside the Vix umbrella build, it can find sibling modules, use installed packages, or fetch missing Vix dependencies when the fetch options are enabled.

The module provides options such as:

```cmake
VIX_AI_AGENT_FETCH_ERROR
VIX_AI_AGENT_FETCH_JSON
VIX_AI_AGENT_FETCH_FS
VIX_AI_AGENT_FETCH_PATH
VIX_AI_AGENT_FETCH_PROCESS
VIX_AI_AGENT_FETCH_NET
VIX_AI_AGENT_FETCH_ENV
VIX_AI_AGENT_FETCH_TIME
VIX_AI_AGENT_FETCH_CRYPTO
VIX_AI_AGENT_FETCH_LOG
VIX_AI_AGENT_FETCH_CACHE
```

These options exist for standalone builds. They let the module resolve missing Vix dependencies when the dependency is not already available as a CMake target.

## Umbrella build behavior

When the module is built inside the Vix umbrella build, dependency fetching is disabled. In that mode, the umbrella project is responsible for providing the required Vix module targets before `agent` is configured.

This keeps the umbrella build predictable. The `agent` module does not fetch or add sibling dependencies behind the umbrella project's back. If a required target is missing in umbrella mode, configuration fails with a clear error.

## Install and export

When installation is enabled, the module installs the `vix_ai_agent` target and exports the CMake package metadata.

The standalone package name is:

```cmake
vix_ai_agent
```

A downstream project that consumes an installed standalone package can use:

```cmake
find_package(vix_ai_agent CONFIG REQUIRED)

target_link_libraries(my_app
  PRIVATE
    vix::ai_agent
)
```

Inside the Vix umbrella build, the module is exported with the umbrella export set instead of a standalone export set.

## Complete example

The following example shows a small CMake application that links the agent module and uses `vix::print`.

```cmake
cmake_minimum_required(VERSION 3.20)

project(my_agent_app LANGUAGES CXX)

find_package(vix_ai_agent CONFIG REQUIRED)
find_package(vix_io CONFIG REQUIRED)

add_executable(my_agent_app
  main.cpp
)

target_compile_features(my_agent_app
  PRIVATE
    cxx_std_20
)

target_link_libraries(my_agent_app
  PRIVATE
    vix::ai_agent
    vix::io
)
```

And the matching `main.cpp` can start with:

```cpp
#include <vix/ai.hpp>
#include <vix/print.hpp>

int main()
{
  vix::ai::agent::AgentConfig config;

  config.provider = "ollama";
  config.model = "llama3";
  config.model_url = "http://127.0.0.1:11434";

  vix::print("agent target linked");

  return 0;
}
```

## Common mistakes

### Linking the internal name instead of the public alias

Prefer the namespaced target:

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::ai_agent
)
```

Do not make application CMake files depend on internal target details when the public alias exists.

### Forgetting `vix::io` in examples that print

The agent runtime does not exist to provide terminal printing. If an example uses `vix::print`, link `vix::io` as well.

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::ai_agent
    vix::io
)
```

### Enabling examples without the print dependency

The module examples include `<vix/print.hpp>`, so the examples need `vix::io`. When examples are enabled in a standalone build, make sure the IO module is available or allow the examples dependency path to resolve it.

### Expecting the module to fetch dependencies in umbrella mode

In umbrella mode, dependencies must already be provided by the main Vix build. This is intentional. The umbrella build owns dependency order and should not be changed by nested FetchContent calls from a module.

## Next step

Continue with the API reference page for a compact lookup of the main agent runtime types, fields, and functions.
