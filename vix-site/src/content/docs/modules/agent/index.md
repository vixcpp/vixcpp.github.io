# Agent

The `agent` module provides a local-first AI agent runtime for Vix.cpp. It gives C++ applications and developer tools a way to ask a model to explain, inspect, or analyze a project while keeping local access explicit and bounded.

This module exists because AI features inside a developer runtime need more structure than a direct call to a model. A useful agent must know which workspace it is allowed to inspect, which model provider it should use, which tools may run, how much context can be prepared, and how errors should be reported when something fails. The `agent` module brings those concerns into a small C++ runtime that follows the rest of Vix: explicit configuration, structured results, and conservative defaults.

At the public level, most applications should start with the Vix AI aggregator:

```cpp
#include <vix/ai.hpp>
```

The lower-level runtime is available under `vix::ai::agent` for code that needs direct control over requests, providers, tools, workspace scanning, caching, and run history.

## What the agent module provides

The agent runtime is built around a protected workspace. Before the agent reads project files or executes a tool, paths are resolved through the workspace boundary, file scans are filtered by policy, and local commands are only allowed when process execution is enabled. This makes the module suitable for local developer workflows where the model needs project context but should not silently access arbitrary files on the machine.

The first model provider is Ollama, which allows the agent to work with local models through a local HTTP endpoint. The provider system is not tied to Ollama, though. Applications can inject their own `ModelProvider` when they need another backend or a test provider.

The module also includes a small tool system. Tools are explicit, named actions registered in a `ToolRegistry`. The current built-in tools focus on practical local development tasks: reading safe text files from the workspace and running allowed commands inside the workspace. The agent can include tool results in the model context and then ask the model for a final response.

## Basic shape

For normal application code, use the public AI header and the high-level agent facade.

```cpp
#include <vix/ai.hpp>
#include <vix/print.hpp>

int main()
{
  vix::ai::Agent agent;

  agent.set_model("local:llama");
  agent.set_workspace(".");
  agent.add_tool("filesystem");

  auto result = agent.run("Explain this project in simple words.");

  if (!result)
  {
    vix::print("Agent error:", result.error().message());
    return 1;
  }

  vix::print(result.value().text());

  return 0;
}
```

This example uses the public API because it is the simplest way to add an AI assistant to a Vix application. The agent uses local-first defaults, runs against the selected workspace, and only receives filesystem access because the `filesystem` tool was added explicitly.

## Runtime model

The lower-level runtime is centered on `vix::ai::agent::Agent`. It receives an `AgentRequest`, validates the request against `AgentConfig`, opens the workspace, prepares model context, optionally executes tools, and returns an `AgentResponse`.

The stable low-level call is:

```cpp
Agent::run(const AgentRequest &request)
```

Use this level when you need to configure the provider directly, inject a custom model backend, inspect tool summaries, control request modes, or work with the run history and cache.

```cpp
#include <vix/ai/agent/AgentRuntime.hpp>
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

  vix::ai::agent::Agent agent(config);

  vix::ai::agent::AgentRequest request;

  request.workspace = ".";
  request.input = "Explain the most important files in this project.";
  request.mode = vix::ai::agent::AgentRequestMode::Analyze;

  request.allow_tools = true;
  request.allow_file_read = true;
  request.allow_process = false;
  request.allow_file_write = false;

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

The explicit runtime API is more verbose, but it makes the important decisions visible. That is useful for command-line tools, build integrations, tests, and advanced applications that need predictable behavior.

## Workspace and local data

The workspace is the security boundary of an agent run. File reads, project scans, command working directories, cache files, run history, and local memory are resolved inside that workspace.

By default, the agent stores its internal data under:

```text
.vix/agent/memory
.vix/agent/cache
.vix/agent/runs
.vix/agent/logs
```

Run history is useful during development because it makes agent execution observable. A run can record the original request, the prompt sent to the model, model responses, tool results, the final response, and errors. Cache entries are also local and conservative: successful responses may be reused when the request is cacheable, but responses involving tools are not cached as plain model responses.

## Tools and permissions

Agent tools are disabled or restricted through configuration and request flags. A request cannot enable a capability that the global configuration disabled.

For example, local command execution requires both the configuration and the request to allow process execution. Even then, the command must be in the allowed program list and the working directory must remain inside the workspace.

This keeps the agent workflow explicit. Reading files, running commands, and writing files are different permissions, and file writing remains disabled by default.

## Command line workflow

The module is also used by the Vix CLI through `vix agent`.

```bash
vix agent ask "Explain what local-first software means"
vix agent analyze .
vix agent scan .
```

The CLI is useful when you want to use the agent from a project directory without writing C++ code. It uses the same runtime ideas: workspace, provider, model, timeout, cache, memory, and explicit process permissions.

## Next step

Start with the quick start page to run a minimal agent example with the public API. After that, read the configuration and workspace pages before enabling tools or using the lower-level runtime directly.
