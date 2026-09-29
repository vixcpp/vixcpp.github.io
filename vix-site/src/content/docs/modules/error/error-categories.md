# Error Categories

`ErrorCategory` describes the domain where an error belongs. While `ErrorCode` explains what went wrong, the category gives the failure a broader context: validation, I/O, network, configuration, security, internal runtime behavior, or another stable area of the system.

This separation keeps errors readable without making the code list too large. A module can report `InvalidArgument`, `NotFound`, or `Timeout` and still make it clear whether the failure came from user input, a file operation, a network operation, or configuration loading.

```cpp id="g9tc1x"
#include <vix/error/ErrorCategory.hpp>

auto category = vix::error::ErrorCategory::validation();
```

An `ErrorCategory` is lightweight. It stores a `std::string_view` name and can be compared directly with another category.

```cpp id="s5c7cz"
if (err.category() == vix::error::ErrorCategory::io()) {
  // handle I/O-related failure
}
```

## Why categories exist

Error codes are usually chosen from the caller’s point of view. That keeps the API clean, but it also means the same code can appear in different parts of the system. `NotFound` may describe a missing file, a missing route, a missing package, or a missing module. The code tells the caller that the requested thing was not found; the category tells the caller where that failure belongs.

```cpp id="ti1nar"
return vix::error::Error(
  vix::error::ErrorCode::NotFound,
  vix::error::ErrorCategory::io(),
  "config file not found"
);
```

This is useful in logs and diagnostics because it gives developers a quick way to group failures without parsing the message. It also helps larger modules preserve context when errors move through several layers of code.

## Built-in categories

`generic` is the default category. It is used when no more specific category was provided or when the failure does not clearly belong to one domain.

```cpp id="hmh56k"
auto category = vix::error::ErrorCategory::generic();
```

`system` is used for operating-system-level failures, low-level runtime failures, signals, process behavior, and other failures that come from the environment around the program.

```cpp id="gpz5hw"
return vix::error::Error(
  vix::error::ErrorCode::ExternalError,
  vix::error::ErrorCategory::system(),
  "failed to start child process"
);
```

`io` is used for input/output and filesystem work. It is appropriate for opening files, reading directories, writing output, resolving paths, and other operations where the failure belongs to storage or stream behavior.

```cpp id="qy9hli"
return vix::error::Error(
  vix::error::ErrorCode::FilesystemError,
  vix::error::ErrorCategory::io(),
  "failed to create output directory"
);
```

`network` is used for sockets, connections, HTTP transport, DNS, timeouts, and other network-related failures.

```cpp id="lcbsyv"
return vix::error::Error(
  vix::error::ErrorCode::NetworkError,
  vix::error::ErrorCategory::network(),
  "connection lost"
);
```

`validation` is used when input was received but does not satisfy the rules required by the operation. This category fits user input, manifest values, route parameters, CLI options, and other data checked before execution continues.

```cpp id="lm9kha"
return vix::error::Error(
  vix::error::ErrorCode::ValidationError,
  vix::error::ErrorCategory::validation(),
  "module name cannot be empty"
);
```

`config` is used when configuration is missing, incomplete, inconsistent, or cannot be applied safely. It fits project manifests, runtime settings, environment-derived configuration, and generated configuration files.

```cpp id="q0pw7t"
return vix::error::Error(
  vix::error::ErrorCode::ConfigError,
  vix::error::ErrorCategory::config(),
  "missing project name in vix.app"
);
```

`security` is used for authentication, authorization, permissions, cryptography, token validation, and other access-related failures.

```cpp id="gi6x7i"
return vix::error::Error(
  vix::error::ErrorCode::Forbidden,
  vix::error::ErrorCategory::security(),
  "current user cannot access this resource"
);
```

`internal` is used when the failure belongs to Vix itself rather than the caller’s input. It should be reserved for broken invariants, unexpected runtime state, or failures that indicate the system reached a condition it did not expect.

```cpp id="k9euka"
return vix::error::Error(
  vix::error::ErrorCode::InternalError,
  vix::error::ErrorCategory::internal(),
  "module registry was not initialized"
);
```

## Custom categories

A category can also be constructed from a name.

```cpp id="fprnuz"
vix::error::ErrorCategory category("registry");
```

The name is stored as a `std::string_view`, so it should refer to stable storage. String literals are safe because they live for the lifetime of the program.

```cpp id="g61bgl"
auto category = vix::error::ErrorCategory("registry");
```

Avoid constructing a category from a temporary string. The category does not own the memory behind the name, so the referenced text must outlive the category.

```cpp id="v7eghl"
// Avoid this pattern.
std::string name = "registry";
auto category = vix::error::ErrorCategory(name);
```

For most Vix code, the built-in categories should be enough. Custom categories are useful when a module has a stable domain that appears often in diagnostics and deserves to be grouped separately.

## Choosing a category

Choose the category that describes the layer responsible for reporting the failure. A missing file may be `io` when reported by a filesystem helper, but `config` when reported by a configuration loader that cannot continue without that file. Both can be correct, depending on what the API is trying to express.

The category should not repeat the message. It should give structure to the error. The message should explain the concrete detail, while the category should help the reader understand the area of the system that failed.

The next page explains the exception bridge, which allows structured `Error` objects to move through exception-based C++ code.
