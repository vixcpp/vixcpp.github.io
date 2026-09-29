# Errors

The `agent` module reports failures through the normal Vix result style. An agent operation returns a value when it succeeds and an error when it fails. This keeps agent code explicit: the caller checks the result, reads the error message when needed, and decides how the application should continue.

This matters because an agent run can fail for several reasons. The configuration may be invalid, the workspace may not exist, the model provider may be unavailable, a model response may be unusable, a tool may be rejected, or local run data may fail to write. Treating these cases as structured errors makes the runtime easier to use from command-line tools, tests, and applications.

## Header

Use the public Vix AI aggregator in normal application code:

```cpp
#include <vix/ai.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

A complete file usually starts with:

```cpp
#include <vix/ai.hpp>
#include <vix/print.hpp>
```

## Result-based errors

Agent operations return `AgentResult<T>`. The caller must check the result before using the value.

```cpp
auto result = agent.run(request);

if (!result)
{
  vix::print("Agent error:", result.error().message());
  return 1;
}

vix::print(result.value().text);
```

This style keeps failures visible at the call site. A model error, workspace error, or tool error does not become hidden inside a plain string response.

## Validate configuration early

Configuration errors should be detected before a request is executed. This is especially useful when configuration comes from environment variables, CLI flags, or project files.

```cpp
auto err = vix::ai::agent::AgentConfigValidator::validate(config);

if (err)
{
  vix::print("Invalid config:", err.message());
  return 1;
}
```

Validation gives the program a clean failure before the agent opens a workspace or sends a model request. It is a good habit for CLI commands and long-running applications because it separates configuration problems from runtime problems.

## Handle workspace errors

A workspace can fail to open when the path is empty, invalid, missing, not a directory, or outside the expected boundary.

```cpp
auto workspace = vix::ai::agent::AgentWorkspace::open(".", config);

if (!workspace)
{
  vix::print("Workspace error:", workspace.error().message());
  return 1;
}
```

Workspace errors should usually be shown directly to the user. The workspace is the local boundary of the run, so the agent cannot continue safely when it cannot resolve that boundary.

## Handle provider errors

The provider may be unavailable or fail during generation. With Ollama, this often means the local service is not running, the model has not been pulled, the endpoint is wrong, or the request timed out.

```cpp
auto result = agent.run(request);

if (!result)
{
  vix::print("Agent error:", result.error().message());

  if (config.provider == "ollama")
  {
    vix::print("Start Ollama with: ollama serve");
  }

  return 1;
}
```

A program should not treat provider failures as normal model text. If the provider failed, the caller should receive an error and handle it through the result path.

## Handle tool errors

Tool errors happen when a requested tool does not exist, is not allowed, receives invalid arguments, or fails while running.

```cpp
auto result = agent.run(request);

if (!result)
{
  vix::print("Agent error:", result.error().message());
  return 1;
}

const auto &response = result.value();

for (const auto &tool : response.tools)
{
  vix::print("-", tool.name, tool.ok ? "ok" : "failed");
}
```

The final response can contain tool summaries for tools that were used during the run. This is useful for diagnostics because a program can show whether a tool succeeded without parsing the final model text.

## Common error areas

Agent errors usually come from one of these areas:

| Area             | Typical cause                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Configuration    | Missing provider, missing model, invalid limits, or invalid permission setup.                     |
| Workspace        | Invalid workspace path, missing directory, or path resolution outside the workspace.              |
| Model provider   | Provider unavailable, request failure, timeout, invalid endpoint, or invalid model response.      |
| Tools            | Tool not found, tool not allowed, invalid arguments, command rejected, or tool execution failure. |
| Local data       | Cache, memory, run history, or log directory could not be read or written.                        |
| Internal runtime | An unexpected failure inside the agent runtime.                                                   |

This table should be used as a guide when debugging. The error message returned by the result is still the main source of information for the caller.

## Agent error names

The module uses agent-specific error names for common failure families.

```text
empty_input
invalid_workspace
path_outside_workspace
model_unavailable
model_request_failed
model_response_invalid
tool_not_found
tool_not_allowed
tool_failed
tool_timeout
memory_unavailable
memory_write_failed
memory_read_failed
config_invalid
internal_failure
```

These names are useful when reading run history, tests, or diagnostics. Application code should still present errors in a way that helps the user understand what action to take.

## Empty input

An agent request needs a meaningful input.

```cpp
request.input = "";
```

An empty request should be rejected before the model is called. A caller should provide a clear prompt, even for simple chat-style requests.

```cpp
request.input = "Explain what this project does.";
```

The agent can only prepare useful context when the request has a real task.

## Invalid workspace

A workspace should point to a valid project directory.

```cpp
request.workspace = ".";
```

For tools and CLI commands, prefer passing a clear path when the process working directory may vary.

```cpp
request.workspace = "./apps/api";
```

A missing or unclear workspace can make the agent analyze the wrong directory or fail before the model request begins.

## Model unavailable

A model provider can be configured correctly but still be unavailable at runtime. For Ollama, start the local service and pull the selected model.

```bash
ollama serve
ollama pull llama3
```

In C++, a provider can be checked before running the full agent request.

```cpp
auto provider =
    std::make_shared<vix::ai::agent::OllamaProvider>(config);

auto available = provider->available();

if (!available || !available.value())
{
  vix::print("Ollama is not available.");
  vix::print("Start it with: ollama serve");
  return 1;
}
```

This gives the user a direct error before the agent prepares workspace context.

## Tool not allowed

A tool can be rejected even when the model requests it. This is expected. The runtime must check the configuration and the request permissions before running a tool.

```cpp
config.allow_process = false;
request.allow_process = true;
```

This is not enough to allow command execution. The configuration is the global runtime policy. Enable process execution only when the agent instance is meant to support command tools.

```cpp
config.allow_process = true;
config.allowed_programs = {"vix", "cmake", "ninja"};
```

The request must also allow the capability for that run.

```cpp
request.allow_tools = true;
request.allow_process = true;
```

## Command rejected

The command tool can reject a command when process execution is disabled, the program is missing from the allowlist, the program is blocked, or the working directory escapes the workspace.

A safe command configuration is explicit:

```cpp
config.allow_process = true;
config.allowed_programs = {"echo"};

request.allow_tools = true;
request.allow_process = true;
```

The tool call should use a program and an argument list, not an arbitrary shell string.

```json
{
  "program": "echo",
  "args": ["hello from command.run"],
  "working_directory": "."
}
```

This keeps command execution predictable and tied to the workspace.

## File read rejected

The file read tool can reject a file when file reading is disabled, the path escapes the workspace, the file is too large, the extension is unsupported, or the file is filtered by policy.

For project analysis, enable file reading deliberately:

```cpp
config.allow_file_read = true;

request.allow_tools = true;
request.allow_file_read = true;
```

Use workspace-relative paths when working with direct tool calls.

```json
{
  "path": "src/main.cpp"
}
```

Paths that escape the workspace should be rejected.

```json
{
  "path": "../secret.txt"
}
```

## Memory and run history errors

When persistence is enabled, the agent writes local run data under the workspace.

```cpp
config.persist_memory = true;
```

A run may fail to persist data if the workspace is not writable, the local directories cannot be created, or the filesystem returns an error. For temporary runs, persistence can be disabled.

```cpp
config.persist_memory = false;
```

Disabling persistence means the application should not expect run history files for that request.

## Cache errors

Cache is local to the workspace and controlled by configuration and request settings.

```cpp
config.use_cache = true;
request.use_cache = true;
```

If cache causes confusion during development, disable it first.

```cpp
config.use_cache = false;
request.use_cache = false;
```

This is useful when debugging prompts, providers, file reads, or command tools because every run calls the provider again instead of reusing a previous response.

## Complete example

The following example validates configuration, runs an agent request, and handles errors through the result path.

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

  config.use_cache = true;
  config.persist_memory = true;

  auto err = vix::ai::agent::AgentConfigValidator::validate(config);

  if (err)
  {
    vix::print("Invalid config:", err.message());
    return 1;
  }

  vix::ai::agent::Agent agent(config);

  vix::ai::agent::AgentRequest request;

  request.workspace = ".";
  request.input = "Explain the structure of this project.";
  request.mode = vix::ai::agent::AgentRequestMode::Analyze;

  request.allow_tools = true;
  request.allow_file_read = true;
  request.allow_process = false;
  request.allow_file_write = false;
  request.use_cache = true;
  request.timeout_ms = config.timeout_ms;

  auto result = agent.run(request);

  if (!result)
  {
    vix::print("Agent error:", result.error().message());

    if (config.provider == "ollama")
    {
      vix::print("Hint:", "make sure Ollama is running with `ollama serve`.");
    }

    return 1;
  }

  const auto &response = result.value();

  vix::print(response.text);
  vix::print();
  vix::print("Run id:", response.run_id);
  vix::print("Provider:", response.provider);
  vix::print("Model:", response.model);
  vix::print("From cache:", response.from_cache);

  return 0;
}
```

This example keeps error handling simple. The program validates early, reports agent failures clearly, and only reads the response after checking that the run succeeded.

## CLI behavior

The `vix agent` command reports errors from the same runtime. If a local Ollama request fails, the CLI can show hints for common local model problems.

```bash
vix agent ask "Explain local-first software"
```

For slow local models, increase the timeout:

```bash
vix agent ask "Explain local-first software" --timeout 120000
```

For a lighter model:

```bash
vix agent ask "Explain local-first software" --model qwen2.5-coder:1.5b
```

When debugging cache or tool behavior, disable cache:

```bash
vix agent analyze . --no-cache
```

When the model should not read project files:

```bash
vix agent analyze . --no-file-read
```

## Common mistakes

### Reading the response without checking the result

Do not call `result.value()` before checking whether the operation succeeded.

```cpp
auto result = agent.run(request);

if (!result)
{
  vix::print("Agent error:", result.error().message());
  return 1;
}

vix::print(result.value().text);
```

This keeps failure handling explicit and avoids treating an error as a valid response.

### Treating provider failures as normal text

A provider failure should be returned as an error, not as a successful response containing an error message. This lets the caller handle the failure through the same path as workspace, configuration, and tool errors.

### Enabling the wrong capability

A request should only enable the capabilities needed for the task.

```cpp
request.allow_process = false;
```

Normal explanations and project summaries usually do not need command execution. Enable process execution only when command output is part of the task.

### Hiding cache status

When cache can affect user expectations, show `from_cache`.

```cpp
vix::print("From cache:", response.from_cache);
```

This makes it clear whether the answer came from a fresh provider request or a reused local response.

## Next step

Continue with the CMake page to see how the `agent` module is built, linked, and enabled in examples or applications.
