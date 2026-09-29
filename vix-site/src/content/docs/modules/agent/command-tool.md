# Command Tool

The `command.run` tool lets the agent run an allowed local command inside the current workspace. It is useful for controlled development tasks such as running a small diagnostic command, checking a build command, or asking the agent to inspect command output before producing a final answer.

This tool is intentionally more restricted than file reading. A command can observe the environment, produce large output, or affect local state depending on the program being executed. For that reason, `command.run` is disabled by default. It only becomes available when process execution is enabled in the configuration, enabled on the request, and limited to an explicit list of allowed programs.

## Header

Use the public Vix AI aggregator in normal application code:

```cpp
#include <vix/ai.hpp>
```

For code that works directly with the lower-level command tool runtime:

```cpp
#include <vix/ai/agent/AgentRuntime.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Tool name

The command tool is named:

```text
command.run
```

A model-requested command call uses that name with a program, an argument list, and a working directory.

```json
{
  "program": "vix",
  "args": ["build"],
  "working_directory": "."
}
```

The working directory is resolved through the agent workspace. The program is checked against the configured allowlist before it is executed.

## Enabling command execution

Command execution must be allowed by the configuration and by the request.

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

For one request:

```cpp
request.allow_tools = true;
request.allow_process = true;
```

Both layers matter. `AgentConfig` defines the runtime policy for the agent instance. `AgentRequest` decides whether this specific run may use that capability. A request cannot make process execution available when the configuration disabled it.

## Safe defaults

A normal analysis request does not need command execution.

```cpp
config.allow_file_read = true;
config.allow_process = false;
config.allow_file_write = false;
```

This is the right default when the agent only needs to read project context. Enable `command.run` only when the task needs command output and the allowed program list is clear.

## Allowed programs

The command tool only runs programs listed in `config.allowed_programs`.

```cpp
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

This list should stay small and intentional. It is better to allow a few predictable commands than to expose a general shell. The command tool receives a program name and arguments; it is not meant to become an unrestricted terminal.

For a build-oriented local tool, `vix`, `cmake`, and `ninja` may be enough. For a simple demo, `echo` is usually sufficient.

## Blocked programs

Some programs are blocked even when process execution is enabled. These are commands that can remove files, alter system state, or escalate privileges.

```text
rm
rmdir
mv
dd
mkfs
shutdown
reboot
poweroff
sudo
su
```

The allowlist is still the main control, but the blocked list gives the runtime another guardrail for dangerous command names.

## Workspace boundary

The command working directory must stay inside the workspace.

```json
{
  "program": "vix",
  "args": ["build"],
  "working_directory": "."
}
```

A command can run from the workspace root or from a subdirectory inside it. It should not run from a path outside the workspace. This keeps command execution tied to the project selected by the caller.

```json
{
  "program": "git",
  "args": ["status"],
  "working_directory": "."
}
```

Use workspace-relative paths for command working directories. They are easier to audit in run history and easier to reason about than absolute paths.

## Tool output limit

Commands can produce a lot of output. The command tool uses `max_tool_output` to keep the output bounded before it is returned to the model context.

```cpp
config.max_tool_output = 20'000;
```

This limit is important for local models. A long build log can consume the model context and weaken the final answer. Keeping command output bounded makes the agent response more predictable.

## Tool rounds

A command may be part of a larger tool loop. The agent limits how many tool rounds can happen during one run.

```cpp
config.max_tool_rounds = 3;
```

A small number of rounds is usually enough for a model to request a command, receive the output, and produce a final response. It also prevents one prompt from becoming an open-ended automation loop.

## Tool timeout

The configuration includes a tool timeout field:

```cpp
config.tool_timeout_ms = 30'000;
```

This field is part of the command tool configuration surface. Keep it explicit in application configuration, especially for CLI tools and local diagnostics. Command output is already bounded by `max_tool_output`, and real process timeout enforcement depends on the process layer used by the runtime.

## Use through an agent request

Most applications do not call `CommandTool` directly. They enable process execution and let the agent runtime execute `command.run` only when the model requests it.

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
  config.allow_process = true;
  config.allow_file_write = false;

  config.allowed_programs = {
      "vix",
      "cmake",
      "ninja",
      "git",
      "echo"
  };

  config.max_tool_output = 20'000;
  config.max_tool_rounds = 3;

  config.use_cache = false;
  config.persist_memory = true;

  vix::ai::agent::Agent agent(config);

  vix::ai::agent::AgentRequest request;

  request.workspace = ".";
  request.input = "Run a safe diagnostic command if it helps explain the project state.";
  request.mode = vix::ai::agent::AgentRequestMode::Run;

  request.allow_tools = true;
  request.allow_file_read = true;
  request.allow_process = true;
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

This configuration allows the agent to use command output, but only through the allowed program list. File writing remains disabled.

## Direct command tool usage

Advanced code can run `CommandTool` directly. This is useful for tests and diagnostics because it checks command behavior without involving a model provider.

```cpp
#include <vix/ai/agent/AgentRuntime.hpp>
#include <vix/json/json.hpp>
#include <vix/print.hpp>

int main()
{
  vix::ai::agent::AgentConfig config;

  config.allow_file_read = false;
  config.allow_process = true;
  config.allow_file_write = false;

  config.allowed_programs = {"echo"};
  config.max_tool_output = 20'000;

  auto workspace = vix::ai::agent::AgentWorkspace::open(".", config);

  if (!workspace)
  {
    vix::print("Workspace error:", workspace.error().message());
    return 1;
  }

  vix::ai::agent::CommandTool tool(workspace.value(), config);

  vix::ai::agent::ToolCall call;

  call.id = "tool_echo_1";
  call.name = "command.run";
  call.arguments = vix::json::Json::object();
  call.arguments["program"] = "echo";
  call.arguments["args"] = vix::json::Json::array();
  call.arguments["args"].push_back("hello from command.run");
  call.arguments["working_directory"] = ".";

  auto result = tool.run(call);

  if (!result)
  {
    vix::print("Tool error:", result.error().message());
    return 1;
  }

  const auto &tool_result = result.value();

  if (!tool_result.ok)
  {
    vix::print("Command failed:", tool_result.error);
    return 1;
  }

  vix::print(tool_result.output);

  return 0;
}
```

Direct usage exposes the pieces that the agent normally prepares for you: workspace, configuration, tool call, and tool result.

## Tool call shape

A `command.run` call needs an id, the tool name, a program, an argument list, and a working directory.

```json
{
  "id": "tool_command_1",
  "name": "command.run",
  "arguments": {
    "program": "echo",
    "args": ["hello from command.run"],
    "working_directory": "."
  }
}
```

The `id` connects the result to the call. The `name` selects the tool. The `program` is checked against the allowlist. The `args` array is passed as program arguments. The `working_directory` must stay inside the workspace.

## Tool result

A command returns a `ToolResult`.

```cpp
const auto &tool_result = result.value();

vix::print(tool_result.name);
vix::print(tool_result.ok ? "ok" : "failed");
vix::print(tool_result.output);
```

When the command fails, the tool result contains an error message. When it succeeds, the output is available to the agent and can be added back into the model context.

## CLI usage

The `vix agent` command exposes command execution through `--allow-process`.

```bash
vix agent ask "Run vix tests if useful" --allow-process
```

The flag enables the safe `command.run` path for that request. The CLI still builds the agent configuration, validates it, opens the workspace, and runs the request through the same runtime used by C++ code.

Use this flag only when the task needs local command output. For normal explanations, leave process execution disabled.

## Command output in agent responses

When a command tool is used during a run, the final response contains tool summaries.

```cpp
const auto &response = result.value();

vix::print("Tools used:", response.tools.size());

for (const auto &tool : response.tools)
{
  vix::print("-", tool.name, tool.ok ? "ok" : "failed");
}
```

This lets a CLI or application show that a command was used without mixing operational details into the final model text.

## Cache behavior

A request that runs tools is not the same as a plain model prompt. Tool execution represents local work performed during the run, so tool-based responses should not be treated like simple cached model responses.

For command-based workflows, disable cache while testing:

```cpp
config.use_cache = false;
request.use_cache = false;
```

This makes it clear that the command output came from the current run. Cache can still be used for plain model responses that do not involve tools.

## Common mistakes

### Enabling request process access without configuration access

The configuration must allow process execution before a request can use it.

```cpp
config.allow_process = false;
request.allow_process = true;
```

This is not a useful setup. Enable process execution deliberately in the configuration and define the allowed programs.

```cpp
config.allow_process = true;
config.allowed_programs = {"vix", "cmake", "ninja"};
```

### Forgetting the allowlist

Process execution without an allowlist does not give the command tool useful permission to run programs.

```cpp
config.allow_process = true;
config.allowed_programs = {"echo"};
```

Keep the list small and aligned with the tool you are building.

### Using command execution for simple questions

A normal explanation request should not need local command execution.

```cpp
request.allow_process = false;
```

Use `command.run` when command output is part of the answer, not as a default capability for every agent request.

### Expecting shell behavior

`command.run` receives a program and an argument list. Treat it as a controlled process call, not as a raw shell.

```json
{
  "program": "echo",
  "args": ["hello"],
  "working_directory": "."
}
```

Do not design prompts or tools around arbitrary shell strings. Use explicit program names and explicit arguments.

### Running outside the workspace

The working directory belongs to the workspace.

```json
{
  "working_directory": "."
}
```

Avoid paths that escape the project. The workspace is the boundary of the run, and command execution should remain tied to that boundary.

## Complete example

The following example uses a small custom provider that asks the runtime to execute `command.run` once, then returns a final response after the tool result has been added back into the model context.

```cpp
#include <memory>
#include <string_view>

#include <vix/ai/agent/AgentRuntime.hpp>
#include <vix/json/json.hpp>
#include <vix/print.hpp>

namespace
{
  class CommandToolProvider final : public vix::ai::agent::ModelProvider
  {
  public:
    [[nodiscard]] std::string_view name() const noexcept override
    {
      return "command-tool-demo";
    }

    [[nodiscard]] bool local() const noexcept override
    {
      return true;
    }

    [[nodiscard]] vix::ai::agent::AgentResult<bool> available() const override
    {
      return true;
    }

    [[nodiscard]] vix::ai::agent::AgentResult<vix::ai::agent::ModelResponse>
    generate(const vix::ai::agent::ModelRequest &request) override
    {
      ++calls_;

      vix::ai::agent::ModelResponse response;
      response.model = request.model;
      response.provider = "command-tool-demo";
      response.status = vix::ai::agent::ModelResponseStatus::Completed;

      if (calls_ == 1)
      {
        vix::ai::agent::ToolCall call;

        call.id = "tool_echo_1";
        call.name = "command.run";
        call.reason = "Run a safe command to demonstrate the command tool.";
        call.arguments = vix::json::Json::object();
        call.arguments["program"] = "echo";
        call.arguments["args"] = vix::json::Json::array();
        call.arguments["args"].push_back("hello from command.run");
        call.arguments["working_directory"] = ".";

        response.text = "I need to run a safe command first.";
        response.tool_calls.push_back(std::move(call));

        return response;
      }

      response.text =
          "The command tool was executed successfully and its result was "
          "returned to the model context.";

      return response;
    }

  private:
    int calls_{0};
  };
}

int main()
{
  vix::ai::agent::AgentConfig config;

  config.provider = "command-tool-demo";
  config.model = "command-tool-demo-model";

  config.allow_file_read = false;
  config.allow_process = true;
  config.allow_file_write = false;

  config.allowed_programs = {"echo"};

  config.max_tool_output = 20'000;
  config.max_tool_rounds = 3;

  config.use_cache = false;
  config.persist_memory = true;

  auto provider = std::make_shared<CommandToolProvider>();

  vix::ai::agent::Agent agent(config, provider);

  vix::ai::agent::AgentRequest request;

  request.workspace = ".";
  request.mode = vix::ai::agent::AgentRequestMode::Run;
  request.input = "Demonstrate command.run with a safe command.";

  request.allow_tools = true;
  request.allow_file_read = false;
  request.allow_process = true;
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

This example is useful for testing the tool loop because the provider deterministically requests `command.run`. It avoids depending on whether a real model decides to call a tool.

## Next step

Continue with the cache and run history page to understand how agent responses, tool results, and run files are stored locally.
