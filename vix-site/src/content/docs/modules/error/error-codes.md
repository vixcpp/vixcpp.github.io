# Error Codes

`ErrorCode` is the stable vocabulary used by the Vix Error module to describe what went wrong. It is the part of an error that code can compare, branch on, serialize, or expose in diagnostics without depending on the exact wording of a message.

An error message explains the concrete situation. An error category explains the domain. The code gives the failure its canonical meaning.

```cpp id="fc4w5v"
#include <vix/error/ErrorCode.hpp>

vix::error::ErrorCode code = vix::error::ErrorCode::InvalidArgument;
```

The enum is intentionally compact. It covers the common failure cases shared by Vix modules without trying to create a different code for every subsystem. A filesystem module, a network client, a runtime component, and a configuration loader can all report failures using the same set of codes while still adding context through `ErrorCategory` and the message.

## Success

`Ok` means that no error occurred. A default-constructed `Error` uses this code.

```cpp id="qp2n0w"
vix::error::Error err;

if (err.code() == vix::error::ErrorCode::Ok) {
  // no error
}
```

`Ok` should not be stored inside a failed `Result<T>`. A result should contain either a real value or a real failure.

## General errors

`Unknown` is used when the operation failed but the reason cannot be classified more precisely. It is useful as a fallback, but it should not be the first choice when a more specific code fits.

`InvalidArgument` means the caller provided an invalid argument or input value. This is the right code for values such as an invalid port, an empty required name, a malformed option, or a parameter that violates the function contract.

`InvalidState` means the operation is valid in general, but not valid for the current state of the object or runtime. For example, trying to start a component that is already shutting down should be treated differently from passing a bad argument.

`NotFound` means a required object, file, route, package, key, or resource could not be found.

`AlreadyExists` means the requested resource cannot be created because something with the same identity already exists.

```cpp id="ujtykz"
return vix::error::Error(
  vix::error::ErrorCode::NotFound,
  vix::error::ErrorCategory::io(),
  "config file not found"
);
```

## Runtime and control-flow errors

`Timeout` means an operation did not complete within the allowed time.

`Cancelled` means the operation was stopped before completion. This should be used when cancellation is intentional or requested, not when the operation failed unexpectedly.

`NotSupported` means the operation is not available in the current implementation, platform, build configuration, or runtime mode.

`NotImplemented` means the feature is known and declared, but the implementation does not exist yet.

These codes are useful in runtime and tooling code because they separate expected control-flow outcomes from actual internal failures.

## Permission and security errors

`PermissionDenied` means the caller does not have permission to perform the operation. It can apply to filesystem permissions, process permissions, or other access rules.

`Unauthorized` means authentication failed or no valid identity was provided.

`Forbidden` means the caller is known, but access to the requested operation or resource is refused.

```cpp id="k8ic4k"
return vix::error::Error(
  vix::error::ErrorCode::Forbidden,
  vix::error::ErrorCategory::security(),
  "current user cannot publish this package"
);
```

The difference between these codes matters in backend and tooling code. `Unauthorized` is about identity, `Forbidden` is about access, and `PermissionDenied` is the broader low-level permission failure.

## Resource errors

`ResourceExhausted` means a limit has been reached. This can describe file descriptors, queue capacity, connection limits, storage limits, or other bounded resources.

`OutOfMemory` means memory allocation or memory-related work failed.

Use these codes when retrying the same operation immediately would likely fail again unless the resource condition changes.

## I/O, filesystem, and network errors

`IoError` is the general code for input/output failure.

`FilesystemError` is used when the failure belongs specifically to filesystem behavior, such as creating directories, reading metadata, writing files, or resolving paths.

`NetworkError` is used for network-related failures such as connection errors, unreachable hosts, broken sockets, or transport failures.

```cpp id="k1xoec"
return vix::error::Error(
  vix::error::ErrorCode::FilesystemError,
  vix::error::ErrorCategory::io(),
  "failed to create build directory"
);
```

Use the more specific code when the source of the failure is clear. `IoError` is still useful for lower-level code where the I/O source may not be known or where the same function handles several kinds of I/O.

## Protocol, parsing, and validation errors

`ProtocolError` means a protocol contract was violated. This can describe invalid framing, unexpected message order, unsupported protocol data, or a peer response that does not follow the expected format.

`ParseError` means data could not be parsed or decoded. It is appropriate for invalid JSON, malformed manifest files, broken configuration syntax, or serialization failures.

`ValidationError` means the data was parsed, but it did not satisfy the required rules.

```cpp id="ok1bmw"
return vix::error::Error(
  vix::error::ErrorCode::ValidationError,
  vix::error::ErrorCategory::validation(),
  "module name cannot be empty"
);
```

A useful distinction is that parsing answers whether the input can be read, while validation answers whether the parsed input is acceptable.

## Configuration and internal errors

`ConfigError` means configuration is invalid, incomplete, or inconsistent. This is the right code for missing required fields, invalid project settings, unsupported manifest values, or configuration that cannot be applied safely.

`InternalError` means an internal invariant was broken or an unexpected internal failure occurred. This code should be used carefully. It usually means the caller did not do something wrong; the system reached a state that Vix itself did not expect.

`ExternalError` means an external dependency or third-party system failed. This can describe failures from tools, services, compilers, package registries, operating system calls, or other components outside the direct control of the module reporting the error.

```cpp id="zadfqb"
return vix::error::Error(
  vix::error::ErrorCode::ConfigError,
  vix::error::ErrorCategory::config(),
  "missing project name in vix.app"
);
```

## Choosing a code

Choose the code that best describes the failure from the caller’s point of view. The same low-level problem can sometimes be reported differently depending on the API boundary. If a configuration file is missing, a filesystem helper may return `FilesystemError`, while a configuration loader may return `ConfigError` because the operation it exposes is configuration loading.

The message should carry the concrete detail, not the whole classification. Prefer a stable code with a precise message over inventing different messages that callers must parse later.

The next page explains error categories, which describe where the failure belongs.
