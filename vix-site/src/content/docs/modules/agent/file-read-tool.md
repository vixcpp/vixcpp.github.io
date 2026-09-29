# File Read Tool

The `file.read` tool lets the agent read a safe text file from the current workspace. It is used when the model needs the content of a specific project file before it can produce a useful answer.

This tool exists because project analysis needs real code context, but file access should still be explicit and bounded. The agent should not silently read arbitrary files from the machine. A file read goes through the workspace boundary, the file scan policy, the configured size limits, and the request permissions before content is returned to the model.

## Header

Use the public Vix AI aggregator in normal application code:

```cpp
#include <vix/ai.hpp>
```

For code that works directly with the lower-level tool runtime:

```cpp
#include <vix/ai/agent/AgentRuntime.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Tool name

The file read tool is named:

```text
file.read
```

A model-requested tool call uses that name with a relative path inside the workspace.

```json
{
  "path": "src/main.cpp"
}
```

The path is not treated as a raw filesystem path. It is resolved through the agent workspace and checked by the file policy before the file is read.

## Enabling file reading

File reading must be allowed by the configuration and by the request.

```cpp
config.allow_file_read = true;
```

For one request:

```cpp
request.allow_tools = true;
request.allow_file_read = true;
```

Both flags matter. `allow_tools` enables the tool loop, while `allow_file_read` enables the specific file-reading capability. A request that allows tools but disables file reading should not expect `file.read` to run successfully.

## Workspace boundary

The workspace is the root used by the tool.

```cpp
request.workspace = ".";
```

When the model asks for a file, the path must stay inside that workspace. A path such as `src/main.cpp` can be valid when it exists inside the project. A path that escapes the workspace is rejected.

This is the main safety rule of the tool. The model can ask for a file, but the runtime decides whether that file belongs to the workspace and whether it is safe to read.

## File policy

`file.read` works with the same project file policy used by scanning. The policy avoids files and directories that are not useful for project context, such as build output, dependency folders, editor state, hidden files, and internal Vix agent data.

The policy also uses the configured file size limit:

```cpp
config.max_file_size = 512 * 1024;
```

This prevents very large files from being pulled into the model context. A large generated file usually weakens the answer instead of improving it, so the tool keeps file reads focused on useful project files.

## Use through an agent request

Most applications do not call `FileReadTool` directly. They allow file reading on the request and let the agent runtime execute `file.read` when the model asks for a file.

```cpp
#include <vix/ai.hpp>
#include <vix/print.hpp>

int main()
{
  vix::ai::agent::AgentConfig config;

  config.provider = "ollama";
  config.model = "llama3";
  config.model_url = "http://127.0.0.1:11434";

  config.allow_file_read = true;
  config.allow_process = false;
  config.allow_file_write = false;

  config.max_file_size = 512 * 1024;
  config.max_tool_output = 20'000;
  config.max_tool_rounds = 3;

  config.use_cache = false;
  config.persist_memory = true;

  vix::ai::agent::Agent agent(config);

  vix::ai::agent::AgentRequest request;

  request.workspace = ".";
  request.input = "Read the main project files and explain how the module works.";
  request.mode = vix::ai::agent::AgentRequestMode::Analyze;

  request.allow_tools = true;
  request.allow_file_read = true;
  request.allow_process = false;
  request.allow_file_write = false;
  request.use_cache = false;

  auto result = agent.run(request);

  if (!result)
  {
    vix::print("Agent error:", result.error().message());
    return 1;
  }

  const auto &response = result.value();

  vix::print(response.text);
  vix::print();

  vix::print("Tools used:", response.tools.size());

  for (const auto &tool : response.tools)
  {
    vix::print("-", tool.name, tool.ok ? "ok" : "failed");
  }

  return 0;
}
```

This is the normal workflow. The program gives the agent permission to read files, but it does not decide in advance which files the model should request. The runtime still keeps every file read inside the workspace.

## Direct tool usage

Advanced code can create and run `FileReadTool` directly. This is useful for tests, diagnostics, or tools that need to verify file access behavior without calling a model.

```cpp
#include <vix/ai/agent/AgentRuntime.hpp>
#include <vix/json/json.hpp>
#include <vix/print.hpp>

int main()
{
  vix::ai::agent::AgentConfig config;

  config.allow_file_read = true;
  config.allow_process = false;
  config.allow_file_write = false;

  config.max_file_size = 128 * 1024;

  auto workspace = vix::ai::agent::AgentWorkspace::open(".", config);

  if (!workspace)
  {
    vix::print("Workspace error:", workspace.error().message());
    return 1;
  }

  vix::ai::agent::FileScanPolicy policy(config);
  vix::ai::agent::FileReader reader(workspace.value(), policy);
  vix::ai::agent::FileReadTool tool(reader);

  vix::ai::agent::ToolCall call;

  call.id = "tool_file_1";
  call.name = "file.read";
  call.arguments = vix::json::Json::object();
  call.arguments["path"] = "README.md";

  auto result = tool.run(call);

  if (!result)
  {
    vix::print("Tool error:", result.error().message());
    return 1;
  }

  const auto &tool_result = result.value();

  if (!tool_result.ok)
  {
    vix::print("File read failed:", tool_result.error);
    return 1;
  }

  vix::print(tool_result.output);

  return 0;
}
```

Direct usage is more verbose because it exposes the pieces that the agent normally creates for you: workspace, scan policy, file reader, tool call, and tool result.

## Tool call shape

A `file.read` call needs an id, the tool name, and a path argument.

```json
{
  "id": "tool_file_1",
  "name": "file.read",
  "arguments": {
    "path": "README.md"
  }
}
```

The `id` lets the runtime connect a tool result to the tool call that produced it. The `name` selects the registered tool. The `path` tells the file reader which workspace-relative file to read.

## Tool result

A successful file read returns a `ToolResult`.

```cpp
const auto &tool_result = result.value();

vix::print(tool_result.name);
vix::print(tool_result.ok ? "ok" : "failed");
vix::print(tool_result.output);
```

The output contains the file content that the model can use. When the tool fails, the result carries an error message instead of pretending the file was read.

## Paths

Use workspace-relative paths.

```text
README.md
src/main.cpp
include/app/App.hpp
```

Avoid absolute paths in tool arguments. The workspace already tells the runtime where the project is, and relative paths make run history easier to read.

The tool should reject paths that escape the workspace.

```text
../secret.txt
../../outside.cpp
```

This keeps the agent focused on the project that the caller chose.

## File size

The tool respects `max_file_size`.

```cpp
config.max_file_size = 128 * 1024;
```

Set this limit according to the kind of project being analyzed. Small examples can use a smaller limit. Larger projects may need more, but raising the limit should be deliberate because file content becomes part of the model context.

## File reading and cache

A request that uses tools is different from a plain prompt. Tool execution represents local work done during the run, so responses involving tools should not be treated like simple cached model responses.

For a request that may use `file.read`, it is often clearer to disable cache while testing:

```cpp
request.use_cache = false;
```

Once the workflow is stable, cache can be enabled when repeated requests should reuse safe cached responses.

## CLI behavior

The `vix agent analyze` command can use file reading when file access is allowed.

```bash
vix agent analyze .
```

The CLI also supports disabling file reads:

```bash
vix agent analyze . --no-file-read
```

Use `--no-file-read` when you want the model to answer from the prompt and general context only, without reading project files.

## Common mistakes

### Enabling tools but not file reading

This enables the tool loop, but not the file read capability:

```cpp
request.allow_tools = true;
request.allow_file_read = false;
```

For project file access, enable both:

```cpp
request.allow_tools = true;
request.allow_file_read = true;
```

### Passing a path outside the workspace

A file path should be relative to the workspace.

```json
{
  "path": "src/main.cpp"
}
```

Do not rely on paths that escape the project:

```json
{
  "path": "../src/main.cpp"
}
```

The workspace is the boundary of the run.

### Reading generated or very large files

Generated files, dependency folders, build directories, and large outputs usually do not help the model understand the project. Keep the file size limit explicit and let the scan policy filter project context.

```cpp
config.max_file_size = 128 * 1024;
```

### Expecting file read to run commands

`file.read` only reads a file. It does not run `cat`, `grep`, `git`, or build commands. Command execution belongs to `command.run` and requires process permissions.

## Complete example

This example analyzes the current workspace with file reading enabled and command execution disabled.

```cpp
#include <vix/ai.hpp>
#include <vix/print.hpp>

int main()
{
  vix::ai::agent::AgentConfig config;

  config.provider = "ollama";
  config.model = "llama3";
  config.model_url = "http://127.0.0.1:11434";

  config.timeout_ms = 120'000;

  config.allow_file_read = true;
  config.allow_process = false;
  config.allow_file_write = false;

  config.max_files = 200;
  config.max_file_size = 256 * 1024;
  config.max_context_chars = 32'000;
  config.max_tool_output = 20'000;
  config.max_tool_rounds = 3;

  config.use_cache = false;
  config.persist_memory = true;

  vix::ai::agent::Agent agent(config);

  vix::ai::agent::AgentRequest request;

  request.workspace = ".";
  request.input =
      "Read the relevant project files and explain the module structure.";
  request.mode = vix::ai::agent::AgentRequestMode::Analyze;

  request.allow_tools = true;
  request.allow_file_read = true;
  request.allow_process = false;
  request.allow_file_write = false;
  request.use_cache = false;
  request.timeout_ms = config.timeout_ms;

  auto result = agent.run(request);

  if (!result)
  {
    vix::print("Agent error:", result.error().message());
    return 1;
  }

  const auto &response = result.value();

  vix::print(response.text);
  vix::print();

  if (!response.tools.empty())
  {
    vix::print("Tools used:", response.tools.size());

    for (const auto &tool : response.tools)
    {
      vix::print("-", tool.name, tool.ok ? "ok" : "failed");
    }
  }

  return 0;
}
```

This is the practical form for local project analysis. The agent can request safe file content from the workspace, but it cannot execute local commands or write files.

## Next step

Continue with the command tool page to understand how `command.run` executes allowed local commands inside the workspace.
