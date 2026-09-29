# Tools

The `agent` module has a controlled tool system. A tool is a named operation that the model can request during an agent run, but the model does not execute the operation directly. The request goes through the agent runtime, the workspace boundary, the permission checks, and the registered `ToolRegistry`.

This design is important because local tools can touch real project state. Reading a file, running a command, or later writing a file should not happen only because a model produced text that looks like an instruction. The runtime owns the decision. It checks whether tools are allowed for the request, whether the specific capability is enabled, whether the tool exists, and whether the operation stays inside the workspace.

## Header

Use the public Vix AI aggregator in normal application code:

```cpp
#include <vix/ai.hpp>
```

For code that works directly with tools and the lower-level runtime:

```cpp
#include <vix/ai/agent/AgentRuntime.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Tool workflow

A tool run is part of the agent loop. The model first receives the prompt and any prepared context. If it needs local information, it can return one or more tool calls. The agent receives those calls, executes the matching tools through the registry, adds the tool results back into the model context, and then asks the model for a final response.

The workflow has this shape:

```text
agent request
model response with tool calls
tool registry lookup
tool execution
tool results
final model response
agent response
```

The provider is responsible for generating model responses. The agent runtime is responsible for executing tools. Keeping that separation makes permissions and workspace safety easier to reason about.

## Built-in tools

The current built-in tools are focused on local developer workflows.

| Tool          | Purpose                                             |
| ------------- | --------------------------------------------------- |
| `file.read`   | Reads a safe text file inside the workspace.        |
| `command.run` | Runs an allowed local command inside the workspace. |

`file.read` is useful when the model needs the content of a specific file. `command.run` is useful for controlled diagnostics, such as running a safe command from an allowlist. These tools are documented in more detail on their own pages.

## Enabling tools in a request

Tools are only available when the request allows them.

```cpp
request.allow_tools = true;
```

The request must also allow the capability that the tool needs. For file reading:

```cpp
request.allow_tools = true;
request.allow_file_read = true;
```

For process execution:

```cpp
request.allow_tools = true;
request.allow_process = true;
```

The request cannot be treated as the only permission boundary. The global configuration must also allow the capability. A request can narrow the configuration for one run, but it should not be used to bypass it.

## Configuration permissions

The configuration defines what the agent instance may do in general.

```cpp
config.allow_file_read = true;
config.allow_process = false;
config.allow_file_write = false;
```

A safe first configuration usually allows file reading and keeps process execution disabled:

```cpp
config.allow_file_read = true;
config.allow_process = false;
config.allow_file_write = false;
```

This lets the agent inspect project context without running local commands. Process execution should be enabled only for tools or commands that really need it.

## Tool rounds

A model may need more than one tool call before it can produce a final answer. The runtime limits this with `max_tool_rounds`.

```cpp
config.max_tool_rounds = 3;
```

A small limit is usually enough. It allows the model to ask for context, receive the result, and answer. It also prevents one prompt from becoming an open-ended local automation loop.

## Tool output limits

Tool output can become large, especially when a command prints logs or a file contains too much text. The agent configuration includes a tool output limit.

```cpp
config.max_tool_output = 20'000;
```

The command tool uses this limit to keep command output bounded. This protects the model context and keeps responses easier to inspect.

## Tool calls

A tool call identifies the tool and carries arguments for that tool. A file read call uses the `file.read` tool name and a relative path inside the workspace.

```json
{
  "id": "tool_file_1",
  "name": "file.read",
  "arguments": {
    "path": "src/main.cpp"
  }
}
```

A command call uses the `command.run` tool name, a program, arguments, and a working directory.

```json
{
  "id": "tool_command_1",
  "name": "command.run",
  "arguments": {
    "program": "vix",
    "args": ["build"],
    "working_directory": "."
  }
}
```

Application code usually does not need to create these JSON objects manually. They are the shape used by the runtime when a model requests tool work.

## Tool results

A tool result tells the agent whether the tool succeeded and what it produced.

The final `AgentResponse` contains summaries of the tools used during the run.

```cpp
const auto &response = result.value();

vix::print("Tools used:", response.tools.size());

for (const auto &tool : response.tools)
{
  vix::print("-", tool.name, tool.ok ? "ok" : "failed");
}
```

This is useful for command-line output and diagnostics. The program can show that the agent used tools without forcing the user to read raw model context.

## Using file tools

For a project analysis request that can read safe project files, enable file reading in both the configuration and the request.

```cpp
config.allow_file_read = true;

request.allow_tools = true;
request.allow_file_read = true;
request.allow_process = false;
request.allow_file_write = false;
```

This allows the runtime to use file-based context while keeping command execution disabled. The file read tool still resolves paths through the workspace and the file scan policy.

## Using command tools

Command execution is disabled by default. To make it available, enable process execution and define the allowed programs.

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

This capability should be enabled carefully. It is useful for diagnostics and local development tasks, but a normal explanation or chat request usually does not need to run commands.

## ToolRegistry

`ToolRegistry` stores the tools that an agent can execute. The runtime uses the registry to find a tool by name when a model requests a tool call.

Advanced code can register custom tools directly.

```cpp
#include <memory>
#include <string_view>

#include <vix/ai/agent/AgentRuntime.hpp>
#include <vix/print.hpp>

class EchoTool final : public vix::ai::agent::Tool
{
public:
  [[nodiscard]] std::string_view name() const noexcept override
  {
    return "test.echo";
  }

  [[nodiscard]] std::string_view description() const noexcept override
  {
    return "Echo a fixed test value.";
  }

  [[nodiscard]] vix::ai::agent::AgentResult<vix::ai::agent::ToolResult>
  run(const vix::ai::agent::ToolCall &call) override
  {
    return vix::ai::agent::ToolResult::success(
        call.id,
        "test.echo",
        "echo");
  }
};

int main()
{
  vix::ai::agent::AgentConfig config;

  config.provider = "ollama";
  config.model = "llama3";
  config.model_url = "http://127.0.0.1:11434";

  vix::ai::agent::Agent agent(config);

  auto err = agent.tools().add(std::make_shared<EchoTool>());

  if (err)
  {
    vix::print("Tool error:", err.message());
    return 1;
  }

  vix::print("Tool registered");

  return 0;
}
```

Custom tools should stay focused. A good tool has a clear name, a small argument shape, predictable output, and a permission model that fits the application using it.

## Complete example

The following example allows file reading, runs an analysis request, and prints the tools used by the response.

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

  config.max_tool_output = 20'000;
  config.max_tool_rounds = 3;

  config.use_cache = false;
  config.persist_memory = true;

  vix::ai::agent::Agent agent(config);

  vix::ai::agent::AgentRequest request;

  request.workspace = ".";
  request.input = "Explain the most important files in this project.";
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

This configuration is useful for project analysis. The agent may read safe project files, but it cannot run commands or write files.

## Common mistakes

### Allowing tools without the required capability

`allow_tools` enables the tool loop, but it does not automatically enable every capability.

```cpp
request.allow_tools = true;
request.allow_file_read = false;
```

For file-based analysis, enable both:

```cpp
request.allow_tools = true;
request.allow_file_read = true;
```

### Enabling process execution for normal explanations

Most explanation requests do not need command execution.

```cpp
request.allow_process = false;
```

Enable process execution only when the task really needs a local command and the configuration has an appropriate allowlist.

### Treating tool output as trusted user text

Tool output is operational data. It should be passed through the agent runtime and displayed carefully in diagnostics. A program should not blindly treat command output as safe instructions for another action.

### Letting one request become too large

A tool can produce useful context, but too much output can weaken the model response and slow the request. Keep `max_tool_output` and `max_tool_rounds` explicit.

```cpp
config.max_tool_output = 20'000;
config.max_tool_rounds = 3;
```

## Next step

Continue with the file read tool page to see how `file.read` resolves paths through the workspace and reads safe text files.
