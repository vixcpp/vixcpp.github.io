# Requests and Responses

An agent run starts with an `AgentRequest` and ends with an `AgentResponse`. The request describes what the caller wants the agent to do for one operation. The response contains the final text returned by the model, together with metadata that helps the program understand how the run behaved.

This separation is important because an agent run has more state than a normal function call. The prompt matters, but so does the workspace, the request mode, the permission set, cache behavior, timeout, and optional tool execution. `AgentRequest` keeps those choices explicit. `AgentResponse` gives the caller a structured result instead of forcing the program to parse everything from plain text.

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

## Request structure

`AgentRequest` represents one run. A request usually contains the workspace, the user input, the mode, permission flags, and cache preference.

```cpp
vix::ai::agent::AgentRequest request;

request.workspace = ".";
request.input = "Explain this project in simple words.";
request.mode = vix::ai::agent::AgentRequestMode::Analyze;

request.allow_tools = true;
request.allow_file_read = true;
request.allow_process = false;
request.allow_file_write = false;
request.use_cache = true;
```

The workspace tells the agent where the run is allowed to operate. The input is the prompt or instruction. The mode gives the runtime a high-level purpose. The permission flags decide which capabilities are available for this specific request.

## Input

`input` is the main instruction given to the agent.

```cpp
request.input = "Explain what this project does.";
```

The input should be direct and specific. A vague prompt may still produce an answer, but it gives the model less structure. For project analysis, it is better to say what kind of explanation you need.

```cpp
request.input =
    "Explain the most important folders in this project and how they fit together.";
```

The agent does not need a long prompt for every request. It needs enough context to understand the task.

## Workspace

`workspace` defines the local boundary for the run.

```cpp
request.workspace = ".";
```

When file reading or tools are enabled, the workspace becomes important. File paths are resolved through the agent workspace, project scans are limited to that workspace, and tool working directories must remain inside it.

For a project in another directory:

```cpp
request.workspace = "./examples/demo";
```

Use a stable workspace path when you want run history, cache, and project scanning to be easy to understand later.

## Request modes

`AgentRequestMode` gives the request a high-level intent.

```cpp
request.mode = vix::ai::agent::AgentRequestMode::Run;
request.mode = vix::ai::agent::AgentRequestMode::Analyze;
request.mode = vix::ai::agent::AgentRequestMode::Explain;
request.mode = vix::ai::agent::AgentRequestMode::Chat;
```

| Mode      | Use it when                                                        |
| --------- | ------------------------------------------------------------------ |
| `Run`     | The request is a general agent task.                               |
| `Analyze` | The agent should reason about a workspace or project.              |
| `Explain` | The user wants an explanation of a concept, file, or behavior.     |
| `Chat`    | The request is a normal prompt and does not need project analysis. |

The mode does not replace the input. It gives the runtime and model context a clearer direction.

## Chat request

Use `Chat` for a normal question.

```cpp
vix::ai::agent::AgentRequest request;

request.workspace = ".";
request.input = "Explain what local-first software means.";
request.mode = vix::ai::agent::AgentRequestMode::Chat;

request.allow_tools = false;
request.allow_file_read = false;
request.allow_process = false;
request.allow_file_write = false;
request.use_cache = true;
```

This request keeps the agent focused on the prompt. It does not need project files or command execution.

## Analyze request

Use `Analyze` when the agent should reason about the current project.

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

This request allows the agent to use safe file access when the global configuration also allows it. Process execution remains disabled, so the agent can inspect project context without running local commands.

## Explain request

Use `Explain` when the task is to clarify a concept or a piece of code.

```cpp
vix::ai::agent::AgentRequest request;

request.workspace = ".";
request.input = "Explain the role of Agent::run in this module.";
request.mode = vix::ai::agent::AgentRequestMode::Explain;

request.allow_tools = false;
request.allow_file_read = false;
request.allow_process = false;
request.allow_file_write = false;
request.use_cache = true;
```

If the explanation depends on project files, file reading can be enabled deliberately:

```cpp
request.allow_tools = true;
request.allow_file_read = true;
```

Keep the permission set aligned with the task. A concept explanation usually does not need process execution.

## Context

A request may include additional context when the program wants to guide the model beyond the user input.

```cpp
request.context =
    "You are explaining a local C++ project. Focus on the module layout, "
    "the runtime workflow, and the relationship between the public API and "
    "the lower-level implementation.";
```

Use context for stable instructions that belong to the application or command, not for details that should be part of the user prompt. This keeps the user input readable while still allowing the program to shape the response.

## Request permissions

Request permissions decide what this specific run may use.

```cpp
request.allow_tools = true;
request.allow_file_read = true;
request.allow_process = false;
request.allow_file_write = false;
```

These permissions are checked against the global `AgentConfig`. A request can restrict the agent further, but it should not be used to bypass the configuration. If the configuration disables process execution, setting `request.allow_process = true` should not make command execution available.

A simple chat request can disable all local capabilities:

```cpp
request.allow_tools = false;
request.allow_file_read = false;
request.allow_process = false;
request.allow_file_write = false;
```

A project analysis request usually enables tools and file reading:

```cpp
request.allow_tools = true;
request.allow_file_read = true;
request.allow_process = false;
request.allow_file_write = false;
```

A diagnostic request may enable process execution only when the configuration already allows it:

```cpp
request.allow_tools = true;
request.allow_file_read = true;
request.allow_process = true;
request.allow_file_write = false;
```

## Cache preference

`use_cache` tells the runtime whether this request may use cache.

```cpp
request.use_cache = true;
```

Cache is useful for repeated local prompts, especially when the model is slow. Disable it when the caller needs a fresh provider response.

```cpp
request.use_cache = false;
```

Cache behavior also depends on the configuration. If cache is disabled in `AgentConfig`, enabling it on the request should not make it available for the run.

## Timeout

A request can carry a timeout for the run.

```cpp
request.timeout_ms = 120'000;
```

This is useful for local models, where the first request may take longer while the model is loaded. It is also useful for CLI tools that expose a `--timeout` option to the user.

## Running a request

An agent request is executed with `Agent::run`.

```cpp
auto result = agent.run(request);
```

Always check the result before using the response.

```cpp
if (!result)
{
  vix::print("Agent error:", result.error().message());
  return 1;
}

const auto &response = result.value();
vix::print(response.text);
```

This follows the Vix result style. The caller receives either a valid response or a structured error.

## Response structure

`AgentResponse` contains the final answer and metadata about the run.

```cpp
const auto &response = result.value();

vix::print(response.text);
vix::print("Run id:", response.run_id);
vix::print("Provider:", response.provider);
vix::print("Model:", response.model);
vix::print("From cache:", response.from_cache);
vix::print("Duration:", response.duration_ms, "ms");
```

The text is the part most applications display to the user. The metadata is useful for logs, diagnostics, local history, and CLI output.

## Response text

`text` is the final model answer.

```cpp
vix::print(response.text);
```

Programs should treat this as user-facing text. If an application needs structured data, it should define a clear prompt contract and validate the response instead of assuming that every model response is machine-readable.

## Run id

`run_id` identifies the local run.

```cpp
vix::print("Run id:", response.run_id);
```

The run id is useful when persistence is enabled because it can be used to connect the displayed response to files stored under the agent run history directory.

## Provider and model

The response records which provider and model produced the answer.

```cpp
vix::print("Provider:", response.provider);
vix::print("Model:", response.model);
```

This matters when a tool or CLI can run with different local models. It makes the output easier to understand later, especially when comparing answers across models.

## Cache status

`from_cache` tells the caller whether the response came from cache.

```cpp
if (response.from_cache)
{
  vix::print("Cache:", "hit");
}
```

This is useful for developer tools because a cached answer should be understood differently from a fresh model request. The response may still be valid, but the program can choose to show that it was reused.

## Tool summaries

When tools are used, the response contains summaries of those tool calls.

```cpp
vix::print("Tools used:", response.tools.size());

for (const auto &tool : response.tools)
{
  vix::print("-", tool.name, tool.ok ? "ok" : "failed");
}
```

Tool summaries let a program explain what happened during the run without mixing operational details into the model text. A CLI can show tool usage, while a graphical application can store it for inspection.

## Complete example

The following example builds a configuration, creates an analysis request, runs it, and prints the response metadata.

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
    return 1;
  }

  const auto &response = result.value();

  vix::print(response.text);
  vix::print();
  vix::print("Run id:", response.run_id);
  vix::print("Provider:", response.provider);
  vix::print("Model:", response.model);
  vix::print("From cache:", response.from_cache);
  vix::print("Duration:", response.duration_ms, "ms");

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

This example keeps the request explicit. File reading is allowed because the task is project analysis. Process execution and file writing remain disabled because the task does not need them.

## Common mistakes

### Enabling a request capability without enabling it in the configuration

The configuration is the global runtime policy. The request can narrow that policy for one run, but it should not be used as the main permission boundary.

```cpp
config.allow_process = false;
request.allow_process = true;
```

This is not a useful configuration. Enable process execution in `AgentConfig` only when the agent instance is meant to support command tools.

### Using analysis mode without a workspace

Project analysis needs a workspace.

```cpp
request.mode = vix::ai::agent::AgentRequestMode::Analyze;
request.workspace = ".";
```

A workspace gives the agent a clear boundary for project context, run data, and tool operations.

### Allowing tools without the needed capability

Tools are controlled by both `allow_tools` and the specific capability flags.

```cpp
request.allow_tools = true;
request.allow_file_read = false;
```

This enables the tool loop but does not allow file reading. For project analysis that depends on files, enable both:

```cpp
request.allow_tools = true;
request.allow_file_read = true;
```

## Next step

Continue with the workspace page to understand how the agent resolves paths, protects the project boundary, and stores local run data.
