# Welcome to Vix.cpp

Vix.cpp is a C++ developer platform for building native applications with a more consistent development workflow.

Your code is still C++. It is compiled by a C++ compiler and produces normal native executables and libraries. Vix works around that toolchain to make common application work easier to manage, from running a single file to building, testing and maintaining a larger project.

If you are new to Vix, you do not need to understand the whole platform before using it. Start with one C++ file.

## Try Vix

Install the CLI on Linux or macOS:

```bash
curl -fsSL https://vixcpp.com/install.sh | bash
```

On Windows PowerShell:

```powershell
irm https://vixcpp.com/install.ps1 | iex
```

Check that Vix is available:

```bash
vix --version
```

Vix uses SDK profiles to install the development environment required by different kinds of applications. The [installation guide](/getting-started/installation) explains which profile to choose and how to configure your environment.

Now create `main.cpp`:

```cpp
#include <vix.hpp>

int main()
{
    vix::print("Hello from Vix.cpp");
    return 0;
}
```

Run it:

```bash
vix run main.cpp
```

That is enough to start using Vix. You do not need to create a project just to experiment with a C++ file.

## When one file becomes a project

As the code grows, you can move to a normal application without changing the way you think about the workflow.

```bash
vix new api
cd api
vix dev
```

From there, the same CLI can build the project, run it, execute tests and inspect common problems.

```bash
vix build
vix run
vix tests
vix check
```

Vix is designed so that the workflow remains familiar as the application becomes more complex.

## Why Vix exists

C++ already has mature compilers, excellent performance, native binaries and a large ecosystem.

The difficult part is often everything that grows around the language.

A real application needs more than source files. It usually needs build configuration, dependencies, tests, development commands, diagnostics, packaging and eventually production tooling. These pieces can all be assembled separately, but the project then has to maintain the conventions and integration between them.

Vix provides a common application workflow around those existing C++ tools.

It does not try to replace the language or create a closed environment around your project.

## How Vix fits into C++

Vix works with the native C++ ecosystem rather than sitting outside it.

If a project already uses CMake, Vix can work with its existing `CMakeLists.txt`.

```text
CMakeLists.txt
      |
      v
     Vix
      |
      v
native build
```

For applications that do not need custom CMake configuration, Vix can use a `vix.app` manifest as the project description.

```text
vix.app
   |
   v
Vix generates the internal CMake project
   |
   v
native build
```

The generated build files remain inspectable.

This means a small project can begin with a simpler application model while a larger or existing C++ project can keep direct control over CMake when it needs it.

Vix is not a replacement for CMake, a new compiler or a new programming language. It provides the workflow around the application while keeping the underlying C++ toolchain available.

## What can you build?

Vix is not limited to one type of C++ application.

You can use it for command-line programs, HTTP services, APIs, WebSocket applications, database-backed systems, reusable libraries, desktop applications, P2P software and local-first systems.

The platform includes runtime modules for common application needs such as HTTP, middleware, asynchronous work, WebSockets, configuration, filesystems, processes, databases, serialization, caching, validation and logging.

You do not need to learn all of those modules before starting.

Learn the parts that your application actually needs.

## Follow the Getting Started path

If this is your first time using Vix, continue through these pages in order:

1. [What is Vix.cpp?](/getting-started/what-is-vixcpp)
2. [Installation](/getting-started/installation)
3. [Set Up Your Environment](/getting-started/setup-environment)
4. [Run Your First C++ File](/getting-started/run-your-first-file)
5. [Create Your First Project](/getting-started/create-your-first-project)
6. [Your First HTTP Server](/getting-started/first-http-server)

The goal of Getting Started is not to teach every Vix feature. It is to make the basic development workflow familiar enough that the rest of the documentation becomes easier to explore.

## If you already know C++

You can move directly to the parts of the documentation that matter to your project.

The Vix Book explains the application model and goes deeper into routes, requests, responses, JSON APIs, middleware, validation, databases, WebSockets, async execution, caching, synchronization, P2P and production workflows.

If you are interested in how Vix itself works, the documentation also covers the build model, runtime workflow, application modules and the relationship between Vix and the native C++ toolchain.

## What do you need to know?

Basic C++ is enough to begin.

You should be comfortable with functions, headers, strings, simple lambdas and basic terminal commands.

You do not need to be a CMake expert.

Learning CMake is still valuable for serious C++ development, and Vix does not try to prevent you from using it. The goal is simply to make CMake expertise unnecessary for your first steps with the platform.

## Vix Note

If you prefer experimenting visually, Vix Note provides a workspace for executable notes, examples and diagnostics while using the normal Vix environment underneath.

```bash
vix note
```

It is optional. You can learn and use Vix entirely from normal source files and projects.

## Documentation and resources

The documentation is available online at [docs.vixcpp.com](https://docs.vixcpp.com).

You can also use:

- [Vix.cpp](https://vixcpp.com) for the project website
- [Vix Registry](https://registry.vixcpp.com) for reusable C++ packages
- [Engineering Notes](https://blog.vixcpp.com) for technical articles, benchmarks and development notes
- [GitHub](https://github.com/vixcpp/vix) for the source code and project development

Offline versions of the documentation are also available:

- [English PDF](/vixcpp-documentation.pdf)
- [French PDF](/vixcpp-documentation-fr.pdf)

## Next

If you want to understand the platform before installing anything, continue with:

[What is Vix.cpp?](/getting-started/what-is-vixcpp)
