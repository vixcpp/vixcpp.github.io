# Workspace

The workspace is the local boundary of an agent run. It tells the agent where it is allowed to inspect project files, where tool paths must resolve, and where local agent data such as cache and run history belongs.

This boundary matters because an AI agent can easily become unclear if file access is implicit. A prompt may ask the model to explain a project, but the runtime still needs to decide which project is being analyzed, which files are safe to read, and where local data should be written. The workspace gives those decisions a concrete place in the filesystem.

## Header

Use the public Vix AI aggregator in normal application code:

```cpp
#include <vix/ai.hpp>
```

For examples that work directly with workspace runtime types:

```cpp
#include <vix/ai/agent/AgentRuntime.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Workspace in an agent request

Most applications set the workspace through `AgentRequest`.

```cpp
vix::ai::agent::AgentRequest request;

request.workspace = ".";
request.input = "Explain the most important files in this project.";
request.mode = vix::ai::agent::AgentRequestMode::Analyze;

request.allow_tools = true;
request.allow_file_read = true;
request.allow_process = false;
request.allow_file_write = false;
```

The current directory is a common workspace for local developer tools. It means the agent should treat the current project as the place where project context, file reads, tool operations, cache, and run data are resolved.

A request can also target another project directory:

```cpp
request.workspace = "./examples/demo";
```

Use a clear workspace path when building tools. It makes the agent behavior easier to reason about and makes run history easier to inspect later.

## Opening a workspace directly

Advanced code can open a workspace directly with `AgentWorkspace`. This is useful when a program wants to scan a project or validate a workspace before running a full model request.

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

  vix::print("Workspace opened");

  return 0;
}
```

Opening the workspace first gives the program an early error if the path is invalid. That is useful for CLI commands, diagnostics, tests, and tools that should fail before sending a prompt to the model.

## Scanning a workspace

A project scan uses the workspace together with `FileScanPolicy`. The policy applies the configured limits and decides which paths are useful for agent context.

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

This is the same kind of workflow used by a scan command. It is useful when you want to see what the agent can collect from a project before a model request is involved.

## Workspace data directories

The agent stores local runtime data under the workspace. By default, the internal directories are:

```text
.vix/agent/memory
.vix/agent/cache
.vix/agent/runs
.vix/agent/logs
```

These directories keep agent data close to the project that produced it. That makes local development easier to inspect. A run can be connected to the project, the prompt, the model response, tool results, and any error that occurred during execution.

The directories are also part of the reason the workspace should be chosen deliberately. A temporary directory is fine for experiments. A project root is better when the run history and cache should remain useful across repeated local work.

## Workspace and file reading

File reading is controlled by both configuration and request permissions.

```cpp
config.allow_file_read = true;
request.allow_file_read = true;
```

The workspace does not mean every file should be read. It only defines the boundary. The file scan policy still filters paths, applies file size limits, and avoids directories that are not useful for project context.

For a normal project analysis request, this is a practical setup:

```cpp
config.allow_file_read = true;

request.workspace = ".";
request.allow_tools = true;
request.allow_file_read = true;
```

For a normal chat request, file reading can remain disabled:

```cpp
request.workspace = ".";
request.allow_tools = false;
request.allow_file_read = false;
```

This keeps the request aligned with the task. A question about a concept does not need access to project files. A request that asks the agent to explain a repository usually does.

## Workspace and command tools

Command execution also uses the workspace. When process execution is enabled, a command tool still needs a working directory that remains inside the workspace.

```cpp
config.allow_process = true;

config.allowed_programs = {
    "vix",
    "cmake",
    "ninja",
    "git",
    "ls",
    "cat",
    "echo"
};
```

The request must also allow process execution:

```cpp
request.allow_tools = true;
request.allow_process = true;
```

This separation keeps command execution deliberate. The workspace controls where commands may run, the allowed program list controls what may run, and the request controls whether this specific operation may use that capability.

## Workspace limits

Large projects need limits. The agent should collect useful context without turning a local model request into an uncontrolled read of the whole repository.

```cpp
config.max_files = 2'000;
config.max_file_size = 512 * 1024;
config.max_context_chars = 120'000;
```

`max_files` limits how many files a scan may collect. `max_file_size` prevents very large files from being read. `max_context_chars` limits how much prepared context can be sent toward the model.

These values should be adjusted for the project and the model. A small local model usually benefits from smaller context. A larger local model can handle more, but the limits should still be explicit.

## Paths that are not useful for context

A workspace scan should focus on source files and project files. Generated directories, dependency folders, build outputs, hidden files, and internal agent data usually do not help the model understand the project.

The scan policy commonly avoids paths such as:

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

This keeps the model context closer to the code that a developer would actually inspect by hand.

## Complete example

The following example configures an agent, analyzes the current workspace, and prints the response metadata.

```cpp
#include <vix/ai.hpp>
#include <vix/print.hpp>

int main()
{
  vix::ai::agent::AgentConfig config;

  config.provider = "ollama";
  config.model = "llama3";
  config.model_url = "http://127.0.0.1:11434";

  config.max_files = 200;
  config.max_file_size = 256 * 1024;
  config.max_context_chars = 32'000;

  config.allow_file_read = true;
  config.allow_process = false;
  config.allow_file_write = false;

  config.use_cache = true;
  config.persist_memory = true;

  vix::ai::agent::Agent agent(config);

  vix::ai::agent::AgentRequest request;

  request.workspace = ".";
  request.input =
      "Look at this project structure and explain the most important files.";
  request.mode = vix::ai::agent::AgentRequestMode::Analyze;

  request.allow_tools = true;
  request.allow_file_read = true;
  request.allow_process = false;
  request.allow_file_write = false;
  request.use_cache = true;

  auto result = agent.run(request);

  if (!result)
  {
    vix::print("Agent error:", result.error().message());
    return 1;
  }

  const auto &response = result.value();

  vix::print(response.text);
  vix::print();
  vix::print("Run id:", response.run_id);
  vix::print("From cache:", response.from_cache);
  vix::print("Duration:", response.duration_ms, "ms");

  return 0;
}
```

This is a good default for local project analysis. The agent can read safe project context, but it cannot run commands or write files.

## Common mistakes

### Using an unclear workspace

A relative workspace such as `.` is fine when the program is always run from the project root. For tools that may run from different directories, resolve the intended project path first and pass that path as the workspace.

```cpp
request.workspace = "./apps/api";
```

This avoids analyzing the wrong directory by accident.

### Enabling file reading without tools

For analysis requests that rely on file access, enable both the tool loop and file reading.

```cpp
request.allow_tools = true;
request.allow_file_read = true;
```

A request with `allow_tools = false` should not expect file tools to run, even if file reading is allowed elsewhere.

### Raising limits without a reason

Increasing `max_files`, `max_file_size`, or `max_context_chars` can help on large repositories, but it also makes the request heavier. Raise limits only when the model needs more project context and the local machine can handle it.

## Next step

Continue with the project scanning page to understand how the workspace is filtered into a useful list of files before the agent prepares model context.
