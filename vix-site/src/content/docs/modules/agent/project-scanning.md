# Project Scanning

Project scanning is the step that turns a workspace into a useful list of files for the agent. It gives the runtime a controlled view of the project before any model context is prepared.

This step matters because a repository is not only source code. It can contain build directories, dependency folders, generated files, hidden editor state, cache data, and large files that do not help the model understand the project. The scanner works with `FileScanPolicy` so the agent can focus on files that are likely to explain the project while staying inside the workspace limits.

## Header

Use the public Vix AI aggregator in normal application code:

```cpp
#include <vix/ai.hpp>
```

For code that works directly with the scanner:

```cpp
#include <vix/ai/agent/AgentRuntime.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## How scanning fits into an agent run

When an agent request allows file reading, the runtime can scan the workspace and use the result to prepare model context.

```cpp
config.allow_file_read = true;

request.workspace = ".";
request.mode = vix::ai::agent::AgentRequestMode::Analyze;
request.allow_tools = true;
request.allow_file_read = true;
```

The scan does not mean every file will be read. It gives the agent a filtered list of project files. In `Analyze` mode, the runtime can use that list to include important project files in the model context, while still respecting the configured limits.

## Scan a project directly

You can use `ProjectScanner` directly when you want to inspect what the agent sees before running a model request.

```cpp
#include <vix/ai/agent/AgentRuntime.hpp>
#include <vix/print.hpp>

int main()
{
  vix::ai::agent::AgentConfig config;

  config.max_files = 100;
  config.max_file_size = 128 * 1024;

  config.allow_file_read = true;
  config.allow_process = false;
  config.allow_file_write = false;

  auto workspace = vix::ai::agent::AgentWorkspace::open(".", config);

  if (!workspace)
  {
    vix::print("Workspace error:", workspace.error().message());
    return 1;
  }

  vix::ai::agent::FileScanPolicy policy(config);
  vix::ai::agent::ProjectScanner scanner(workspace.value(), policy);

  auto scan = scanner.scan();

  if (!scan)
  {
    vix::print("Scan error:", scan.error().message());
    return 1;
  }

  vix::print("Workspace:", scan.value().root);
  vix::print("Files:", scan.value().files.size());
  vix::print("Skipped:", scan.value().skipped);
  vix::print("Truncated:", scan.value().truncated ? "yes" : "no");

  return 0;
}
```

This example opens the current directory as the workspace, applies the scan policy, and prints a small summary. It is useful for debugging configuration limits or checking whether the agent sees the files you expect.

## Scan result

A successful scan returns a `ProjectScanResult`. The result contains the workspace root, the accepted files, the number of skipped entries, and whether the scan was truncated.

```cpp
vix::print("Workspace:", scan.value().root);
vix::print("Files:", scan.value().files.size());
vix::print("Skipped:", scan.value().skipped);
vix::print("Truncated:", scan.value().truncated ? "yes" : "no");
```

Each accepted file includes a relative path and size.

```cpp
for (const auto &file : scan.value().files)
{
  vix::print("-", file.relative_path, "(", file.size, "bytes )");
}
```

Relative paths are important because they keep the model context connected to the project layout without exposing unnecessary absolute paths in every file entry.

## File scan policy

`FileScanPolicy` decides which paths are useful for agent context. It uses the agent configuration to enforce file count and file size limits, and it avoids paths that are not useful for understanding the project.

Common ignored paths include:

```text
.git
.vix
.cache
.idea
.vscode
build
build-ninja
build-release
build-debug
cmake-build-debug
cmake-build-release
node_modules
vendor
dist
out
target
__pycache__
```

These paths are usually generated, external, or internal to tooling. Skipping them keeps the model context closer to the files a developer would inspect by hand.

## File limits

The scanner uses configuration limits to keep the result bounded.

```cpp
config.max_files = 2'000;
config.max_file_size = 512 * 1024;
```

`max_files` limits how many files the scanner may collect. If the limit is reached, the result is marked as truncated. `max_file_size` prevents large files from being included in the scan result or read later as project context.

The right limits depend on the project and the model. A small demo can use a small limit. A larger repository may need more files, but the limit should still be explicit because every extra file can make the prompt heavier.

## Context limit

Scanning produces the list of candidate files, but the final prompt still has a separate context limit.

```cpp
config.max_context_chars = 120'000;
```

This limit protects the final model request. A scan may find many useful files, but the prompt should still stay within a size that the local model and the machine can handle. If the prepared prompt becomes too large, the runtime truncates the context.

## Analyze mode and important files

In `Analyze` mode, the runtime can use the scan result in two ways. First, it can include a file list so the model understands the project shape. Then it can include content from important entry files when they are present.

Typical entry files include:

```text
README.md
CMakeLists.txt
CMakePresets.json
vix.json
package.json
```

This gives the model a practical starting point. A project overview usually begins with the build files, README, and manifest-style files before going deeper into implementation details.

## Use the CLI scanner

The same scanning workflow is exposed through the Vix CLI.

```bash
vix agent scan .
```

The command opens the workspace, applies the scan policy, and prints a summary of the scan. Use it when you want to understand what the agent can see without asking the model to generate an answer.

You can scan another workspace by passing its path:

```bash
vix agent scan ./examples/demo
```

The CLI scanner is useful before `vix agent analyze` because it helps confirm that the workspace path and file limits are correct.

## Analyze after scanning

Once the scan looks correct, run an analysis request.

```bash
vix agent analyze .
```

In C++, the same idea is expressed through an `Analyze` request:

```cpp
vix::ai::agent::AgentRequest request;

request.workspace = ".";
request.input = "Explain the most important files in this project.";
request.mode = vix::ai::agent::AgentRequestMode::Analyze;

request.allow_tools = true;
request.allow_file_read = true;
request.allow_process = false;
request.allow_file_write = false;
request.use_cache = true;
```

This request allows the agent to prepare project context from the workspace while keeping command execution and file writing disabled.

## Complete example

The following example scans the current project and prints each accepted file.

```cpp
#include <vix/ai/agent/AgentRuntime.hpp>
#include <vix/print.hpp>

int main()
{
  vix::ai::agent::AgentConfig config;

  config.max_files = 100;
  config.max_file_size = 128 * 1024;

  config.allow_file_read = true;
  config.allow_process = false;
  config.allow_file_write = false;

  auto workspace = vix::ai::agent::AgentWorkspace::open(".", config);

  if (!workspace)
  {
    vix::print("Workspace error:", workspace.error().message());
    return 1;
  }

  vix::ai::agent::FileScanPolicy policy(config);
  vix::ai::agent::ProjectScanner scanner(workspace.value(), policy);

  auto scan = scanner.scan();

  if (!scan)
  {
    vix::print("Scan error:", scan.error().message());
    return 1;
  }

  vix::print("Workspace:", scan.value().root);
  vix::print("Files:", scan.value().files.size());
  vix::print("Skipped:", scan.value().skipped);
  vix::print("Truncated:", scan.value().truncated ? "yes" : "no");
  vix::print();

  for (const auto &file : scan.value().files)
  {
    vix::print("-", file.relative_path, "(", file.size, "bytes )");
  }

  return 0;
}
```

This program does not call a model. It only opens the workspace and shows the filtered file list. That makes it a good diagnostic tool when tuning project analysis behavior.

## Common mistakes

### Scanning the wrong directory

Using `.` is convenient when the program always runs from the project root. If a tool can be launched from another directory, pass the intended workspace path explicitly.

```cpp
auto workspace =
    vix::ai::agent::AgentWorkspace::open("./apps/api", config);
```

This avoids scanning the parent project, a build folder, or an unrelated working directory by accident.

### Raising limits too early

Increasing `max_files` and `max_file_size` can help with larger repositories, but it should not be the first fix for a weak answer. A better prompt, a clearer workspace, or a smaller project scope often produces better context than simply sending more files.

### Expecting scan to execute commands

Project scanning only inspects the filesystem. It does not run build commands, tests, Git commands, or shell commands. Command execution belongs to the controlled tool system and requires process permissions.

## Next step

Continue with the model providers page to understand how the agent turns the prepared request into a model call.
