# What is Vix.cpp?

Vix.cpp is a C++ developer platform for building native applications.

A Vix project is still a normal C++ project. The code is written in C++, compiled by a C++ compiler, and produces native executables or libraries. Existing tools such as CMake, Ninja and native C++ libraries remain part of the development model.

Vix does not try to replace that ecosystem. It focuses on the work that usually grows around a C++ application: running code, organizing the project, building it, managing dependencies, testing it, diagnosing problems and using the runtime capabilities the application needs.

A simple way to understand Vix is to think of it as three parts:

```txt
                     Vix.cpp

        Workflow   Project Model   Runtime
```

The workflow is how you work with the application. The project model is how Vix understands and builds the project. The runtime provides the capabilities used by the application while it is running.

## Workflow

The Vix CLI gives common development tasks a consistent entry point.

You can start with a single file:

```bash
vix run main.cpp
```

When that file becomes a project, the same tool continues to handle the normal development cycle:

```bash
vix new app
cd app
vix dev
```

You can then build, run, test and inspect the project without switching between several unrelated workflows:

```bash
vix build
vix run
vix tests
vix check
```

The value of this workflow is not that the commands are shorter. The important part is that the project has one predictable way to move through development.

In a traditional C++ project, those responsibilities are often spread across CMake commands, shell scripts, package tools and conventions that differ from one repository to another. Vix gives those operations a common interface while keeping the underlying tools available.

## Project Model

Vix can work with projects that already use CMake.

If a repository already has a `CMakeLists.txt`, there is no requirement to replace it. Vix can use the existing project and provide its workflow around it.

```txt
CMakeLists.txt
      |
      v
     Vix
      |
      v
native build
```

For applications that do not need custom CMake configuration, Vix also provides `vix.app`.

```txt
vix.app
   |
   v
  Vix
   |
   v
generated CMake project
   |
   v
native build
```

A `vix.app` file describes the application in terms of sources, dependencies, libraries, compile options and application modules. Vix uses that information to generate the native build configuration internally.

The generated project is not hidden. It can still be inspected when necessary.

This gives smaller applications a simpler starting point while allowing larger or existing projects to keep direct control over CMake.

## Runtime

The runtime is the part of Vix used by the application itself.

It provides reusable C++ capabilities for areas such as HTTP, asynchronous execution, WebSockets, middleware, configuration, filesystems, processes, validation, databases, caching and synchronization.

These capabilities are provided through Vix modules.

For example, a backend application might use the core runtime for HTTP handling, middleware for request processing, validation for incoming data and a database module for persistence.

The runtime is independent from the project model. An existing CMake project can use Vix runtime modules without adopting `vix.app`.

In the same way, using `vix.app` does not mean that the project must use every Vix runtime module.

This distinction is useful:

```txt
Workflow
  how you work with the project

Project Model
  how the project is described and built

Runtime
  what the application can use while running
```

These three parts are related, but they solve different problems.

## How they fit together

Imagine a backend application described with `vix.app`.

The project model describes what belongs to the application and how it should be built.

During development, the CLI provides commands such as:

```bash
vix dev
vix build
vix tests
```

Inside the application, Vix modules can provide HTTP, middleware, validation, database access and other runtime capabilities.

All of this still ends in the normal native C++ toolchain.

```txt
                  Vix.cpp

       +-------------+-------------+
       |             |             |
   Workflow     Project Model    Runtime
       |             |             |
       +-------------+-------------+
                     |
                     v
              Native C++ toolchain
                     |
                     v
           executable or library
```

Vix adds structure around the development process without introducing another language or another execution model.

## Why Vix exists

C++ already has mature compilers, native performance and a large ecosystem. Vix is not trying to replace those strengths.

The difficulty often appears when a C++ program grows into an application.

At that point, the project usually needs build configuration, dependencies, tests, development commands, diagnostics, packaging and runtime infrastructure. None of these problems is new, and there are already good tools for solving them individually.

The friction comes from having to assemble all of them into one project and maintain that setup over time.

Vix exists to make that part of C++ development more consistent.

The goal is not to hide how the system works. The goal is to remove repetitive work while keeping the compiler, build configuration, dependencies and native outputs understandable.

## Vix and the C++ ecosystem

Vix is designed to work with the tools C++ developers already use.

CMake can remain the build system for projects that need it. Ninja can remain part of the build process. Existing libraries can still be linked normally, and the compiler remains a standard C++ compiler.

This is also why Vix is not limited to web development.

HTTP servers and backend applications are important use cases, but they are only part of the runtime. The same platform can be used for command-line tools, libraries, desktop applications, data-oriented applications, realtime systems and other native C++ software.

## Vix Modules and Application Modules

The documentation uses two similar terms that refer to different things.

**Vix Modules** are capabilities provided by Vix itself. Examples include core, async, filesystem, process, validation, middleware, WebSocket, cache and sync.

**Application Modules** belong to your own application.

A larger project might be organized like this:

```txt
modules/
  auth/
  billing/
  projects/
  notifications/
```

Those modules describe the architecture of the application. They can have their own implementation, public interfaces, tests and dependencies.

So the distinction is simple:

```txt
Vix Module
  provides a capability

Application Module
  organizes part of your application
```

## What Vix is not

Vix is not a new C++ language, a replacement compiler or a virtual machine.

It does not replace CMake, although it can provide a simpler project model when full CMake control is not needed.

It is also not only a web framework. Web development is one part of the platform, not the definition of the project.

Vix is a developer platform built around native C++ applications.

## Where to continue

If you want to understand how the platform is designed, continue with the mental model.

From there, the rest of the documentation is organized around what you are trying to do:

- **Build Applications** covers projects, `vix.app`, application modules, templates and practical development.
- **Vix Modules** documents the runtime capabilities available to applications.
- **Tooling** covers the CLI, SDK profiles, packages, diagnostics and development tools.
- **Reference** contains exact command and API information.
- **Internals** explains architecture, build behavior, caching, runtime design and performance.

Next: [Mental Model](/book/03-mental-model)
