# Configuration

The `agent` module is configured through `vix::ai::agent::AgentConfig`. The configuration describes how an agent instance should behave before a request is executed: which provider it uses, which model it calls, which local limits apply, which capabilities are enabled, whether cache is used, and whether run data should be persisted.

This matters because an agent run is not only a prompt sent to a model. The runtime may open a workspace, scan project files, prepare context, call a provider, execute controlled tools, reuse cached responses, and write run history. `AgentConfig` keeps these decisions visible in C++ instead of hiding them behind implicit defaults.

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

## Basic configuration

A minimal local Ollama configuration looks like this:

```cpp
vix::ai::agent::AgentConfig config;

config.provider = "ollama";
config.model = "llama3";
config.model_url = "http://127.0.0.1:11434";

config.allow_file_read = true;
config.allow_process = false;
config.allow_file_write = false;

config.use_cache = true;
config.persist_memory = true;
```

This configuration uses Ollama as the model provider, selects `llama3`, and points the provider to the local Ollama endpoint. It allows safe file reading, but it does not allow process execution or file writing. That is a good starting point for analysis-style workflows because the agent can inspect project context without being allowed to run commands or modify files.

## Provider settings

The provider settings tell the agent where model responses come from.

```cpp
config.provider = "ollama";
config.model = "llama3";
config.model_url = "http://127.0.0.1:11434";
```

`provider` identifies the model backend. The default local provider is Ollama. `model` is the model name passed to the provider, and `model_url` is the local endpoint used by providers that need one.

For a smaller local model, change the model name:

```cpp
config.model = "qwen2.5-coder:1.5b";
```

The provider system is not limited to Ollama. Advanced applications can inject their own `ModelProvider` when they need another backend, a test provider, or a project-specific model integration.

## Timeout settings

Local models can be slow on the first request, especially when the model has to be loaded into memory. Use `timeout_ms` to give the provider enough time for the request.

```cpp
config.timeout_ms = 120'000;
```

Tool execution has its own timeout field:

```cpp
config.tool_timeout_ms = 30'000;
```

The model timeout controls the model request. The tool timeout is part of the tool configuration surface and is used by tool execution paths that support timeout enforcement.

## Workspace limits

The agent can prepare project context from a workspace. Workspace limits keep that process bounded so the agent does not try to read an entire machine or produce an uncontrolled prompt.

```cpp
config.max_files = 2'000;
config.max_file_size = 512 * 1024;
config.max_context_chars = 120'000;
```

`max_files` limits how many files a project scan may collect. `max_file_size` prevents very large files from being read into the agent context. `max_context_chars` limits how much context can be prepared for the model.

These limits should be chosen for the type of project you are analyzing. A small example can use lower limits. A larger repository may need higher limits, but raising them should be done deliberately because local models have practical context and performance constraints.

## Tool limits

Tool limits control how much work the agent can do when tools are enabled.

```cpp
config.max_tool_output = 20'000;
config.max_tool_rounds = 3;
```

`max_tool_output` keeps command output from becoming too large. `max_tool_rounds` limits how many times the agent can loop through model-requested tool calls before producing a final response.

A small number of tool rounds is usually enough for local developer workflows. It gives the model a chance to request context, receive a result, and answer without turning one prompt into an open-ended automation loop.

## Permission settings

The most important configuration fields are the capability flags.

```cpp
config.allow_file_read = true;
config.allow_process = false;
config.allow_file_write = false;
```

These flags define what the agent instance is allowed to do in general. A request can restrict them further, but it should not be treated as a way to bypass them. For example, if process execution is disabled in the configuration, a request should not make process execution available for that run.

File reading, process execution, and file writing are separate permissions because they carry different risks. Reading project files is useful for analysis. Running local commands is more powerful and should be enabled only when the program really needs it. File writing is disabled by default and should be treated as a separate capability, not as a side effect of analysis.

## Process execution

Process execution is disabled by default. To enable it, set `allow_process` and define the allowed programs.

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

The command tool uses this list to decide which programs may run. This keeps command execution explicit and limited. Even when process execution is enabled, commands are still expected to run inside the workspace and through the controlled tool system.

Use this capability carefully. It is useful for workflows such as asking the agent to inspect a build, run a safe diagnostic command, or call `vix` commands, but it should not be enabled for simple chat or explanation requests.

## Cache settings

The agent can reuse safe cached model responses.

```cpp
config.use_cache = true;
config.cache_ttl_ms = 5 * 60 * 1000;
```

The cache is local and conservative. It is useful when the same prompt and context are repeated during development, especially with slower local models. Cache behavior should remain predictable: it should improve repeated runs without hiding tool execution or making the agent appear to have rechecked something that it did not actually run again.

Disable cache when you want every request to call the provider:

```cpp
config.use_cache = false;
```

## Run history and local memory

When persistence is enabled, the agent writes local run information under the agent workspace data directories.

```cpp
config.persist_memory = true;
```

By default, agent data is stored under:

```text
.vix/agent/memory
.vix/agent/cache
.vix/agent/runs
.vix/agent/logs
```

Run history is useful for debugging and inspection. A run can include the prompt, model response, tool results, final response, and errors. This makes agent behavior easier to understand after the command or program has finished.

Disable persistence when you want a temporary run that does not write local run data:

```cpp
config.persist_memory = false;
```

## Offline setting

The agent is designed for local-first workflows. The `offline` field describes that expectation at the configuration level.

```cpp
config.offline = true;
```

With the default Ollama provider, the model endpoint is local. Applications that add another provider should keep this field meaningful for their own runtime policy, especially when deciding whether a provider should be allowed in environments that expect local-only behavior.

## Validate a configuration

Use `AgentConfigValidator` when configuration comes from environment variables, command-line flags, project files, or user input.

```cpp
auto err = vix::ai::agent::AgentConfigValidator::validate(config);

if (err)
{
  vix::print("Invalid config:", err.message());
  return 1;
}
```

Validation lets a program fail early with a clear message. That is better than opening a workspace, preparing a request, and discovering later that the provider name, model name, timeout, limits, or permissions are invalid.

## Load configuration from the environment

`AgentConfigLoader` can build a configuration from environment variables.

```cpp
auto config = vix::ai::agent::AgentConfigLoader::from_environment();
```

This is useful for command-line tools and local developer workflows. A program can load defaults from the environment and then override specific fields in code.

```cpp
auto config = vix::ai::agent::AgentConfigLoader::from_environment();

config.model = "qwen2.5-coder:1.5b";
config.timeout_ms = 120'000;
config.allow_process = false;
```

## Supported environment variables

The default environment variable prefix is:

```text
VIX_AGENT_
```

Common variables include:

```text
VIX_AGENT_PROVIDER
VIX_AGENT_MODEL
VIX_AGENT_MODEL_URL
VIX_AGENT_MEMORY_DIR
VIX_AGENT_CACHE_DIR
VIX_AGENT_RUNS_DIR
VIX_AGENT_LOGS_DIR
VIX_AGENT_TIMEOUT_MS
VIX_AGENT_MAX_FILES
VIX_AGENT_MAX_FILE_SIZE
VIX_AGENT_MAX_TOOL_OUTPUT
VIX_AGENT_MAX_CONTEXT_CHARS
VIX_AGENT_OFFLINE
VIX_AGENT_ALLOW_PROCESS
VIX_AGENT_ALLOW_FILE_READ
VIX_AGENT_ALLOW_FILE_WRITE
VIX_AGENT_USE_CACHE
VIX_AGENT_PERSIST_MEMORY
```

Example:

```bash
export VIX_AGENT_PROVIDER=ollama
export VIX_AGENT_MODEL=llama3
export VIX_AGENT_MODEL_URL=http://127.0.0.1:11434
export VIX_AGENT_ALLOW_FILE_READ=true
export VIX_AGENT_ALLOW_PROCESS=false
export VIX_AGENT_USE_CACHE=true
```

Then load the configuration in C++:

```cpp
auto config = vix::ai::agent::AgentConfigLoader::from_environment();
```

## Configuration and request permissions

`AgentConfig` defines what the agent instance may do. `AgentRequest` defines what one specific run may do.

```cpp
config.allow_file_read = true;
config.allow_process = false;
config.allow_file_write = false;

request.allow_file_read = true;
request.allow_process = false;
request.allow_file_write = false;
```

This separation is important. A long-running application may create one agent instance with a safe global configuration, then restrict individual requests depending on the operation. A chat request may disable file access. An analysis request may allow file reads. A diagnostic request may allow process execution only when the application has explicitly enabled it.

## Complete example

The following example loads configuration from the environment, applies a few local overrides, validates the configuration, and then runs an analysis request.

```cpp
#include <vix/ai.hpp>
#include <vix/print.hpp>

int main()
{
  auto config = vix::ai::agent::AgentConfigLoader::from_environment();

  config.model = "llama3";
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

  auto result = agent.run(request);

  if (!result)
  {
    vix::print("Agent error:", result.error().message());
    return 1;
  }

  vix::print(result.value().text);

  return 0;
}
```

This is the typical configuration workflow for a tool or local application: load defaults, make the runtime policy explicit, validate it, then run a request with permissions that match the task.

## Next step

Continue with the requests and responses page to see how `AgentRequest` and `AgentResponse` describe one agent run in detail.
