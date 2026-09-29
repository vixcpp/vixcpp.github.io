# CMake

The `sync` module is used like the other Vix modules: include the public header in C++ code and link the module target from CMake. The module exposes its public API through `<vix/sync.hpp>` and provides the offline-first sync primitives used by the outbox, retry policy, sync engine, transports, and WAL components.

Most projects should link the public module target `vix::sync`. The module target carries its own public dependencies, so application targets do not need to link the internal dependency graph manually.

## Header

Use the public module header in C++ code:

```cpp id="qef9ps"
#include <vix/sync.hpp>
```

This header includes the public sync API: operations, retry policy, outbox interfaces, file-backed outbox storage, sync workers, sync engine, and WAL primitives.

For examples that print output, include the print header separately:

```cpp id="hu9tm7"
#include <vix/print.hpp>
```

## Link the sync module

For an application target, link `vix::sync`.

```cmake id="mf2p7l"
cmake_minimum_required(VERSION 3.20)

project(my_sync_app LANGUAGES CXX)

add_executable(my_sync_app
  src/main.cpp
)

target_compile_features(my_sync_app
  PRIVATE
    cxx_std_20
)

target_link_libraries(my_sync_app
  PRIVATE
    vix::sync
)
```

The application code can then include the public sync header normally:

```cpp id="xeqlhx"
#include <memory>
#include <vix/sync.hpp>

int main()
{
  auto store = std::make_shared<vix::sync::outbox::FileOutboxStore>(
    vix::sync::outbox::FileOutboxStore::Config{
      .file_path = "./.vix/outbox.json",
      .pretty_json = true
    }
  );

  return store ? 0 : 1;
}
```

## Compile standard

The sync module is built for C++20. Application targets that use it should enable C++20 or newer.

```cmake id="m2ibky"
target_compile_features(my_sync_app
  PRIVATE
    cxx_std_20
)
```

This keeps the application consistent with the module’s public headers and with the rest of the Vix module ecosystem.

## Use inside another Vix module

When another Vix module depends on sync, link `vix::sync` from that module’s CMake target.

```cmake id="bizyze"
target_link_libraries(my_module
  PRIVATE
    vix::sync
)
```

Use `PRIVATE` when sync is only used inside implementation files. Use `PUBLIC` when your module’s public headers expose sync types such as `vix::sync::Operation`, `vix::sync::RetryPolicy`, `vix::sync::outbox::Outbox`, or `vix::sync::engine::ISyncTransport`.

```cmake id="0ktgq6"
target_link_libraries(my_module
  PUBLIC
    vix::sync
)
```

The visibility should match the public API of the consuming target. If a sync type appears in a public header, consumers of that target need the include paths and link requirements too.

## Public dependencies

The sync module links its public dependencies through the `vix::sync` target. In the module build file, these dependencies are resolved as public link requirements:

```txt id="dth2x6"
vix::utils
vix::net
vix::json
```

`vix::net` is needed because the sync engine and workers use `vix::net::NetworkProbe`. `vix::json` is needed by the file-backed outbox store, which persists operations to JSON. `vix::utils` is part of the module’s common Vix support layer.

Application code should normally link only `vix::sync` and let the target carry these dependencies.

## Dependency discovery

When the sync module is built inside the Vix source tree, it first looks for sibling modules such as `../utils`, `../net`, and `../json`. This is the normal path for the umbrella Vix build.

When those targets are not already available, the module can fetch missing dependencies through CMake options:

```txt id="x1kpnd"
VIX_SYNC_FETCH_UTILS
VIX_SYNC_FETCH_NET
VIX_SYNC_FETCH_JSON
```

These options are enabled by default in the module build. If a project wants to provide its own dependency targets, it can define `vix::utils`, `vix::net`, and `vix::json` before adding or finding the sync module.

## Static or interface mode

The sync module discovers implementation files under `src/*.cpp`. When source files are present, the module builds a static library target. When no source files are found, it falls back to an interface target.

In the normal module layout, sources are present:

```txt id="hmwhod"
src/
  engine/
  outbox/
  wal/
```

That means the module builds as a static library and exposes the namespaced alias:

```txt id="ia77s3"
vix::sync
```

Consumers should use the alias target instead of depending on the internal target name.

## Example application

A minimal project using the sync module can keep its structure small.

```txt id="wdbl3a"
my_sync_app/
  CMakeLists.txt
  src/
    main.cpp
```

`CMakeLists.txt`:

```cmake id="u50h0r"
cmake_minimum_required(VERSION 3.20)

project(my_sync_app LANGUAGES CXX)

add_executable(my_sync_app
  src/main.cpp
)

target_compile_features(my_sync_app
  PRIVATE
    cxx_std_20
)

target_link_libraries(my_sync_app
  PRIVATE
    vix::sync
)
```

`src/main.cpp`:

```cpp id="bc1w6x"
#include <chrono>
#include <cstdint>
#include <memory>

#include <vix/sync.hpp>

static std::int64_t now_ms()
{
  using namespace std::chrono;

  return duration_cast<milliseconds>(
    steady_clock::now().time_since_epoch()
  ).count();
}

int main()
{
  using namespace vix::sync;
  using namespace vix::sync::outbox;

  auto store = std::make_shared<FileOutboxStore>(
    FileOutboxStore::Config{
      .file_path = "./.vix/outbox.json",
      .pretty_json = true
    }
  );

  Outbox outbox(
    Outbox::Config{
      .owner = "cmake-example"
    },
    store
  );

  Operation op;
  op.kind = "message.send";
  op.target = "/api/messages";
  op.payload = R"({"text":"queued from a CMake app"})";

  const auto id = outbox.enqueue(op, now_ms());

  return id.empty() ? 1 : 0;
}
```

This example only creates and stores an operation. It does not start a sync engine because the purpose of this page is the CMake integration. The engine, transport, and retry workflow are covered in their own pages.

## Example with a transport

A project that uses the engine still links the same target. The transport is application code that implements `ISyncTransport`.

```cpp id="yxp3xu"
#include <chrono>
#include <cstdint>
#include <memory>

#include <vix/sync.hpp>

static std::int64_t now_ms()
{
  using namespace std::chrono;

  return duration_cast<milliseconds>(
    steady_clock::now().time_since_epoch()
  ).count();
}

class AppTransport final : public vix::sync::engine::ISyncTransport
{
public:
  vix::sync::engine::SendResult send(const vix::sync::Operation &) override
  {
    return {
      .ok = true,
      .retryable = false,
      .error = {}
    };
  }
};

int main()
{
  using namespace vix::sync;
  using namespace vix::sync::engine;
  using namespace vix::sync::outbox;

  auto store = std::make_shared<FileOutboxStore>(
    FileOutboxStore::Config{
      .file_path = "./.vix/engine-outbox.json"
    }
  );

  auto outbox = std::make_shared<Outbox>(
    Outbox::Config{
      .owner = "engine-cmake-example"
    },
    store
  );

  auto probe = std::make_shared<vix::net::NetworkProbe>(
    vix::net::NetworkProbe::Config{},
    [] {
      return true;
    }
  );

  auto transport = std::make_shared<AppTransport>();

  SyncEngine engine(
    SyncEngine::Config{
      .worker_count = 1,
      .batch_limit = 10
    },
    outbox,
    probe,
    transport
  );

  Operation op;
  op.kind = "message.send";
  op.target = "/api/messages";
  op.payload = R"({"text":"send through engine"})";

  outbox->enqueue(op, now_ms());

  const auto processed = engine.tick(now_ms());

  return processed > 0 ? 0 : 1;
}
```

The CMake target remains the same:

```cmake id="y9d0f8"
target_link_libraries(my_sync_app
  PRIVATE
    vix::sync
)
```

The transport implementation belongs to the application. The sync module only requires the `ISyncTransport` contract.

## Tests

The sync module has an optional test build controlled by:

```txt id="cth0ef"
VIX_SYNC_BUILD_TESTS
```

When this option is enabled, the module adds its `tests` directory.

```bash id="6m9a9e"
cmake -S . -B build -DVIX_SYNC_BUILD_TESTS=ON
cmake --build build
ctest --test-dir build
```

A test target that uses sync should link `vix::sync` the same way as an application target.

```cmake id="dxlhf6"
add_executable(sync_tests
  tests/sync_tests.cpp
)

target_compile_features(sync_tests
  PRIVATE
    cxx_std_20
)

target_link_libraries(sync_tests
  PRIVATE
    vix::sync
)
```

Tests are a good fit for manual engine ticks because they let the test control time, transport results, and operation state without waiting for a background loop.

## Sanitizers

The module respects the parent project option:

```txt id="neon2h"
VIX_ENABLE_SANITIZERS
```

When this option is enabled on non-MSVC builds, the module adds address and undefined-behavior sanitizer flags to the sync target. This is useful while developing the module or testing custom stores and transports.

Applications do not need to set sanitizer flags specifically for sync. They can enable the parent Vix sanitizer option as part of the normal development build.

## Installation and exports

The sync module installs its target into the umbrella `VixTargets` export set. It also installs public headers from the module `include` directory.

The exported consumer target is:

```txt id="dr9bch"
vix::sync
```

Application projects should use the namespaced target. It is the stable CMake interface exposed to consumers.

## Public API surface

Linking `vix::sync` gives access to the public sync headers exposed through `<vix/sync.hpp>`.

```txt id="wld5os"
<vix/sync.hpp>
<vix/sync/Operation.hpp>
<vix/sync/RetryPolicy.hpp>
<vix/sync/engine/SyncEngine.hpp>
<vix/sync/engine/SyncWorker.hpp>
<vix/sync/outbox/Outbox.hpp>
<vix/sync/outbox/OutboxStore.hpp>
<vix/sync/outbox/FileOutboxStore.hpp>
<vix/sync/wal/Wal.hpp>
<vix/sync/wal/WalReader.hpp>
<vix/sync/wal/WalRecord.hpp>
<vix/sync/wal/WalWriter.hpp>
```

For normal application code, prefer the aggregator:

```cpp id="a5rvvh"
#include <vix/sync.hpp>
```

Use direct headers only when a file intentionally depends on a narrow part of the module.

## Recommended project shape

A small sync-based application can keep the build structure straightforward.

```txt id="zdf7q5"
my_sync_app/
  CMakeLists.txt
  src/
    main.cpp
```

`CMakeLists.txt`:

```cmake id="qzr5q2"
cmake_minimum_required(VERSION 3.20)

project(my_sync_app LANGUAGES CXX)

add_executable(my_sync_app
  src/main.cpp
)

target_compile_features(my_sync_app
  PRIVATE
    cxx_std_20
)

target_link_libraries(my_sync_app
  PRIVATE
    vix::sync
)
```

`src/main.cpp`:

```cpp id="tzmkib"
#include <memory>
#include <vix/sync.hpp>

int main()
{
  auto store = std::make_shared<vix::sync::outbox::FileOutboxStore>(
    vix::sync::outbox::FileOutboxStore::Config{
      .file_path = "./.vix/outbox.json"
    }
  );

  return store ? 0 : 1;
}
```

This gives the application the sync module without pulling protocol-specific decisions into the build file. The application remains responsible for defining its transport and operation payloads.

## Common mistakes

Do not link the internal target name directly when the namespaced target is available. Use `vix::sync` in application and module CMake files.

Do not use `PUBLIC` link visibility unless your public headers expose sync types. `PRIVATE` is correct when sync is only used in implementation files.

Do not include narrow internal headers in normal application code when `<vix/sync.hpp>` is enough. The aggregator is the public entry point for the module.

Do not forget that examples using `vix::print` need the print API available in the project. The sync module itself is linked through `vix::sync`; direct developer output belongs to the Vix print API.

## Next step

Continue with the API reference for a compact list of the public types, classes, and methods exposed by the sync module.

```md id="rsn5p4"
[API Reference](./api-reference.md)
```
