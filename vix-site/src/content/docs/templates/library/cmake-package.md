# CMake Package

The library template uses a CMake-friendly project shape because reusable C++ code is often consumed by other C++ projects through targets, include directories, examples, tests, and sometimes installable package files.

A Vix library project can still be built with the Vix CLI, but the library itself should remain easy to understand from the CMake side. This matters because a library is not only something you build locally. It is something another target may include, link, test, or install later.

```txt id="library-cmake-package-map"
include/        public headers
CMakeLists.txt  library target and build rules
examples/       consumer-style examples
tests/          validation targets
vix.json        Vix workflow metadata
```

## Why the library template uses CMake

Application-style Vix projects can use `vix.app` because they usually describe one executable target: sources, include roots, links, resources, and output directory. A library has a different responsibility. It must expose a reusable API and a target that another project can consume.

That is why the library template keeps a root `CMakeLists.txt`. It gives the project a normal C++ library shape, while Vix still provides the command workflow around it.

```bash id="library-cmake-package-build"
vix build --build-target all
```

The command is still Vix, but the library target remains a clear CMake target.

## Public target shape

A library target should expose its public include directory.

```cmake id="library-cmake-package-target"
add_library(mathkit INTERFACE)

target_include_directories(mathkit INTERFACE
  ${CMAKE_CURRENT_SOURCE_DIR}/include
)
```

For a header-only library, an `INTERFACE` target is a natural starting point. The target does not compile implementation files, but it tells consumers where the public headers are.

The public include style should remain stable.

```cpp id="library-cmake-package-include"
#include <mathkit/mathkit.hpp>
```

The target exists so another CMake target can link against the library without manually guessing include paths.

```cmake id="library-cmake-package-link"
target_link_libraries(app PRIVATE mathkit)
```

## Header-only package

The generated library starts well as a header-only package. This is useful when the first version of the library is made of inline functions, templates, small utilities, or API types that do not need compiled implementation files yet.

```txt id="library-cmake-package-header-only-layout"
include/
  mathkit/
    mathkit.hpp
```

A header-only package still needs a real target. Without a target, every consumer has to know the include directory manually. With a target, the include path is part of the package shape.

```cmake id="library-cmake-package-header-only-target"
add_library(mathkit INTERFACE)

target_include_directories(mathkit INTERFACE
  ${CMAKE_CURRENT_SOURCE_DIR}/include
)
```

This keeps the library easy to consume from examples, tests, and other projects.

## Compiled library package

When the library grows beyond header-only code, add implementation files under `src/`.

```txt id="library-cmake-package-compiled-layout"
include/
  mathkit/
    mathkit.hpp
    statistics.hpp

src/
  statistics.cpp
```

The target then becomes a compiled library.

```cmake id="library-cmake-package-compiled-target"
add_library(mathkit
  src/statistics.cpp
)

target_include_directories(mathkit PUBLIC
  ${CMAKE_CURRENT_SOURCE_DIR}/include
)
```

The public include directory remains the same. Consumers should not need to change their include style just because the library moved from header-only code to compiled implementation files.

```cpp id="library-cmake-package-stable-include"
#include <mathkit/statistics.hpp>
```

That stability is important. The implementation can grow, but the public API path should stay predictable.

## Examples as consumers

The generated `examples/` directory is useful because it checks whether the package can be used like a real dependency.

```txt id="library-cmake-package-examples"
examples/
  basic.cpp
  CMakeLists.txt
```

The example should link the library target and include public headers.

```cmake id="library-cmake-package-example-cmake"
add_executable(mathkit_basic basic.cpp)
target_link_libraries(mathkit_basic PRIVATE mathkit)
```

The example source should use the library through its public include path.

```cpp id="library-cmake-package-example-cpp"
#include <mathkit/mathkit.hpp>

#include <iostream>

int main()
{
  std::cout << mathkit::add(2, 3) << "\n";
  return 0;
}
```

This is an important check. If the example cannot compile without private include paths, the library target is not exposing the public API correctly.

## Tests through the package target

Tests should also use the public target and public headers whenever possible.

```txt id="library-cmake-package-tests"
tests/
  test_basic.cpp
```

A test can include the public header.

```cpp id="library-cmake-package-test-include"
#include <mathkit/mathkit.hpp>
```

The test target should link the library target.

```cmake id="library-cmake-package-test-target"
add_executable(mathkit_tests tests/test_basic.cpp)
target_link_libraries(mathkit_tests PRIVATE mathkit vix::vix)
```

Testing through the public target helps catch problems in the package shape: missing include directories, missing dependencies, wrong compile features, or headers that only work because of accidental local paths.

## Test option

A generated library can use a project-specific option for tests.

```cmake id="library-cmake-package-test-option"
option(mathkit_BUILD_TESTS "Build mathkit tests" OFF)
```

When enabled, the build can add test targets.

```cmake id="library-cmake-package-test-option-use"
if(mathkit_BUILD_TESTS)
  add_executable(mathkit_tests tests/test_basic.cpp)
  target_link_libraries(mathkit_tests PRIVATE mathkit vix::vix)
endif()
```

From the Vix workflow, enable tests with:

```bash id="library-cmake-package-enable-tests"
vix build --build-target all -- -Dmathkit_BUILD_TESTS=ON
```

The option should follow the project name. For a library named `strings`, the option should be `strings_BUILD_TESTS`.

## Compile features

A library target should declare the C++ features it requires.

```cmake id="library-cmake-package-compile-features"
target_compile_features(mathkit INTERFACE cxx_std_20)
```

For a compiled library, use `PUBLIC` when consumers also need the same feature level through public headers.

```cmake id="library-cmake-package-compile-features-public"
target_compile_features(mathkit PUBLIC cxx_std_20)
```

This avoids a common problem where the library compiles locally, but a consumer fails because the required C++ standard was not attached to the target.

## Public dependencies

When the public headers depend on another library, the dependency should be public.

```cmake id="library-cmake-package-public-dep"
target_link_libraries(mathkit PUBLIC other::library)
```

When the dependency is only used inside `.cpp` files, keep it private.

```cmake id="library-cmake-package-private-dep"
target_link_libraries(mathkit PRIVATE other::library)
```

This distinction matters for packages. A public dependency becomes part of what consumers need to compile against the library’s public headers. A private dependency is only needed to build the library implementation.

## Include directory discipline

A package should expose public include directories, not private source paths.

Good target shape:

```cmake id="library-cmake-package-good-includes"
target_include_directories(mathkit PUBLIC
  ${CMAKE_CURRENT_SOURCE_DIR}/include
)
```

Avoid exposing private implementation directories as public include paths.

```cmake id="library-cmake-package-bad-includes"
# Avoid this for the public package shape.
target_include_directories(mathkit PUBLIC
  ${CMAKE_CURRENT_SOURCE_DIR}/src
)
```

Private source paths can be used internally when needed, but they should not become part of the public package contract.

```cmake id="library-cmake-package-private-includes"
target_include_directories(mathkit PRIVATE
  ${CMAKE_CURRENT_SOURCE_DIR}/src
)
```

A consumer should include files from `include/<library>/`, not from `src/`.

## Installable package

A library can stay local for a long time. When it becomes something other projects should install and discover, add an installable CMake package shape deliberately.

A simple package starts by installing the public headers.

```cmake id="library-cmake-package-install-headers"
install(DIRECTORY include/
  DESTINATION include
)
```

Then install the target.

```cmake id="library-cmake-package-install-target"
install(TARGETS mathkit
  EXPORT mathkitTargets
  INCLUDES DESTINATION include
)
```

The exported targets can be installed under a package directory.

```cmake id="library-cmake-package-install-export"
install(EXPORT mathkitTargets
  NAMESPACE mathkit::
  DESTINATION lib/cmake/mathkit
)
```

This creates the basis for a consumer to link an installed target such as:

```cmake id="library-cmake-package-installed-link"
target_link_libraries(app PRIVATE mathkit::mathkit)
```

Do not add install rules before the package shape is clear. A local library can use its target directly. Install rules become important when the library is meant to be consumed outside the source tree.

## Package config file

An installable CMake package usually needs a config file.

```txt id="library-cmake-package-config-files"
cmake/
  mathkitConfig.cmake.in
```

A minimal config template can include the exported targets.

```cmake id="library-cmake-package-config-template"
@PACKAGE_INIT@

include("${CMAKE_CURRENT_LIST_DIR}/mathkitTargets.cmake")
```

Then the root build file can configure and install it.

```cmake id="library-cmake-package-configure"
include(CMakePackageConfigHelpers)

configure_package_config_file(
  cmake/mathkitConfig.cmake.in
  ${CMAKE_CURRENT_BINARY_DIR}/mathkitConfig.cmake
  INSTALL_DESTINATION lib/cmake/mathkit
)

install(FILES
  ${CMAKE_CURRENT_BINARY_DIR}/mathkitConfig.cmake
  DESTINATION lib/cmake/mathkit
)
```

This is the point where the library becomes discoverable with `find_package`.

```cmake id="library-cmake-package-find-package"
find_package(mathkit REQUIRED)

target_link_libraries(app PRIVATE mathkit::mathkit)
```

## Namespace target

Installed packages should usually expose a namespaced target.

```cmake id="library-cmake-package-namespace"
mathkit::mathkit
```

Inside the source tree, the local target may be named:

```cmake id="library-cmake-package-local-target"
mathkit
```

The exported package can provide the namespaced target for consumers. This avoids target name collisions and makes consumer code clearer.

```cmake id="library-cmake-package-consumer"
find_package(mathkit REQUIRED)

add_executable(app main.cpp)
target_link_libraries(app PRIVATE mathkit::mathkit)
```

A good package should make this consumer code short and predictable.

## Version file

When the library is versioned for external consumption, add a package version file.

```cmake id="library-cmake-package-version-file"
write_basic_package_version_file(
  ${CMAKE_CURRENT_BINARY_DIR}/mathkitConfigVersion.cmake
  VERSION ${PROJECT_VERSION}
  COMPATIBILITY SameMajorVersion
)
```

Then install it beside the config file.

```cmake id="library-cmake-package-install-version"
install(FILES
  ${CMAKE_CURRENT_BINARY_DIR}/mathkitConfig.cmake
  ${CMAKE_CURRENT_BINARY_DIR}/mathkitConfigVersion.cmake
  DESTINATION lib/cmake/mathkit
)
```

This allows consumers to request a version.

```cmake id="library-cmake-package-version-consumer"
find_package(mathkit 1.2 REQUIRED)
```

Versioning should match the library’s release discipline. It is better to add it when the package is actually being consumed across projects.

## Local consumption with add_subdirectory

Before the library is installed as a package, another project can consume it with `add_subdirectory`.

```cmake id="library-cmake-package-add-subdirectory"
add_subdirectory(external/mathkit)

add_executable(app main.cpp)
target_link_libraries(app PRIVATE mathkit)
```

This is often enough during development. It avoids installation and keeps the library source available in the consuming build.

When the library becomes stable and shared across many projects, an installable package with `find_package` becomes more useful.

## Relationship with Vix

The CMake package shape does not remove Vix from the workflow. Vix still gives the project a command surface.

```bash id="library-cmake-package-vix-commands"
vix build --build-target all
vix tests
```

`vix.json` can expose common tasks.

```json id="library-cmake-package-vix-json"
{
  "tasks": {
    "build": "vix build --build-target all",
    "test": "vix tests",
    "check": "vix build --build-target all -- -Dmathkit_BUILD_TESTS=ON && vix tests"
  }
}
```

The split stays clear.

```txt id="library-cmake-package-file-roles"
CMakeLists.txt  -> library target and package shape
include/        -> public API
examples/       -> consumer usage
tests/          -> validation
vix.json        -> Vix workflow and tasks
```

## Relationship with the Vix Registry

A CMake package and a Vix Registry dependency are related, but they are not the same thing.

The CMake package shape decides how C++ consumers include and link the library.

```cmake id="library-cmake-package-cmake-role"
find_package(mathkit REQUIRED)
target_link_libraries(app PRIVATE mathkit::mathkit)
```

The Vix Registry is a distribution and dependency workflow around Vix projects and packages. A library that is published through a registry still needs a clean build target, public headers, examples, tests, and package metadata.

In practice, the CMake target is what the compiler and linker consume. The registry is how the dependency can be discovered, resolved, and installed by tooling.

## Common mistakes

The most common mistake is exposing `src/` as a public include directory. That makes private implementation paths part of the package contract and makes the library harder to maintain.

Another mistake is forgetting to attach required compile features to the target. A consumer should not have to guess that the library requires C++20.

A third mistake is linking dependencies as private when public headers require them. If a public header includes another library’s header, that dependency is usually part of the public target surface.

A fourth mistake is writing examples that work only because they include files from the source tree. Examples should consume the package through public headers and the library target.

A fifth mistake is adding install rules too early and then treating them as final. It is better to keep the package local until the public API, target name, namespace, and versioning rules are clear.

## Recommended rule

Keep the CMake package shape honest. Public headers live under `include/<library>/`, the library target exposes only the include directories and dependencies consumers really need, tests and examples link the target like real consumers, and installable package files are added when the library is ready to be consumed outside the source tree. Vix can drive the workflow, but the package target should remain understandable to normal C++ and CMake users.

## Next step

Continue with best practices to see how to keep the library API, examples, tests, and build target clean as the project grows.

[Best Practices](/templates/library/registry-metadata)
