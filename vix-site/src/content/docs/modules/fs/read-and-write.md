# Read and Write

The FS module separates text operations from binary operations. Text files are handled with `read_text()`, `write_text()`, and the text overload of `append_file()`. Binary files are handled with `read_file()`, `write_file()`, and the binary overload of `append_file()`. This keeps call sites clear: the function name tells the reader whether the file is being treated as text or as raw bytes.

For normal use, include the public header:

```cpp id="kyv3q8"
#include <vix/fs.hpp>
```

All read and write operations return `Result<T>` aliases. A failed result means the filesystem operation did not complete. A successful result contains the expected value for the operation.

## Writing text

Use `write_text()` when the content is a string or string-like value.

```cpp id="fir7tv"
auto written = vix::fs::write_text(
  "storage/config/app.txt",
  "name = demo\n"
);

if (!written) {
  return written.error();
}
```

`write_text()` overwrites existing content. If the file already exists, its previous content is replaced. If the file does not exist, the function attempts to create it. The parent directory must already exist.

```cpp id="bxag7q"
auto ready = vix::fs::create_directories("storage/config");
if (!ready) {
  return ready.error();
}

auto written = vix::fs::write_text(
  "storage/config/app.txt",
  "name = demo\n"
);
```

This explicit directory step is important. The current write API does not automatically create parent directories. Creating the directory before writing makes the workflow easier to reason about and keeps failures clear.

## Reading text

Use `read_text()` when the file should be read as text and returned as a `std::string`.

```cpp id="iieiax"
auto content = vix::fs::read_text("storage/config/app.txt");

if (!content) {
  return content.error();
}

std::string text = content.value();
```

A read can fail because the path is empty, the file cannot be opened, permissions are missing, or the filesystem reports another read error. A missing file is an error for `read_text()`, because the requested operation was to read content from a file.

```cpp id="ii8h12"
auto content = vix::fs::read_text("missing.txt");

if (!content) {
  const auto& err = content.error();
  // handle read failure
}
```

When absence is expected and should not be treated as a read failure, check with `exists()` before reading.

```cpp id="j3pikl"
auto found = vix::fs::exists("storage/config/app.txt");
if (!found) {
  return found.error();
}

if (!found.value()) {
  return {};
}

auto content = vix::fs::read_text("storage/config/app.txt");
```

## Appending text

Use `append_file()` with a string-like value to add text to the end of a file.

```cpp id="woqcx7"
auto appended = vix::fs::append_file(
  "storage/log.txt",
  "server started\n"
);

if (!appended) {
  return appended.error();
}
```

The file is created if it does not exist, but the parent directory still needs to exist. This makes `append_file()` useful for logs and generated text files where each operation adds content instead of replacing the file.

```cpp id="zmxb4x"
auto ready = vix::fs::ensure_directory("storage");
if (!ready) {
  return ready.error();
}

auto first = vix::fs::write_text("storage/log.txt", "first line\n");
if (!first) {
  return first.error();
}

auto second = vix::fs::append_file("storage/log.txt", "second line\n");
if (!second) {
  return second.error();
}
```

## Writing binary files

Use `write_file()` when the content is raw binary data. The binary buffer type is `vix::fs::Bytes`, an alias for `std::vector<std::uint8_t>`.

```cpp id="rg6gqh"
vix::fs::Bytes data{0x10, 0x20, 0x30, 0x40};

auto written = vix::fs::write_file("storage/data.bin", data);

if (!written) {
  return written.error();
}
```

Like `write_text()`, `write_file()` overwrites existing content and expects the parent directory to exist. It is the right API for generated binary files, cached artifacts, encoded data, or any file where the caller wants exact byte-level control.

## Reading binary files

Use `read_file()` when the file should be read as raw bytes.

```cpp id="p19aem"
auto read = vix::fs::read_file("storage/data.bin");

if (!read) {
  return read.error();
}

const vix::fs::Bytes& bytes = read.value();
```

The function returns the full file content in memory. For small and medium project files, generated artifacts, configuration assets, and test fixtures, this keeps the API simple. For very large files or streaming workflows, a lower-level streaming API is usually a better fit than reading the entire file at once.

## Appending binary data

The binary overload of `append_file()` appends bytes to the end of a file.

```cpp id="gwhhe0"
vix::fs::Bytes tail{0x50, 0x60};

auto appended = vix::fs::append_file("storage/data.bin", tail);

if (!appended) {
  return appended.error();
}
```

This follows the same behavior as text append: the file can be created if it does not exist, but the directory must already be present.

## Touching a file

Use `touch()` to create an empty file when it does not exist. If the file already exists, the function opens it in append mode, which gives a simple way to confirm that the path can be treated as a writable file.

```cpp id="dg72de"
auto touched = vix::fs::touch("storage/ready.flag");

if (!touched) {
  return touched.error();
}
```

`touch()` returns an error when the path is empty or when the path refers to a directory. It is useful for marker files, generated flags, and simple setup checks.

## A practical read/write workflow

A typical write workflow first ensures the target directory exists, then writes content, then reads it back only after each operation succeeds.

```cpp id="rwbcm0"
#include <iostream>

#include <vix/fs.hpp>

int main()
{
  const std::string dir = "storage/config";
  const std::string path = dir + "/app.txt";

  auto ready = vix::fs::ensure_directory(dir);
  if (!ready) {
    std::cerr << ready.error().message() << '\n';
    return 1;
  }

  auto written = vix::fs::write_text(path, "name = demo\n");
  if (!written) {
    std::cerr << written.error().message() << '\n';
    return 1;
  }

  auto appended = vix::fs::append_file(path, "mode = dev\n");
  if (!appended) {
    std::cerr << appended.error().message() << '\n';
    return 1;
  }

  auto content = vix::fs::read_text(path);
  if (!content) {
    std::cerr << content.error().message() << '\n';
    return 1;
  }

  std::cout << content.value();
  return 0;
}
```

This is the recommended shape for ordinary FS code in Vix: make the filesystem precondition explicit, perform the operation, check the result, and only then use the returned value.

The next page explains directory creation and directory-oriented workflows.
