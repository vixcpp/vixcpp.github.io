# Guides

Welcome to the Vix.cpp guides.

This section helps you move from minimal examples to real-world
applications.

------------------------------------------------------------------------

## Getting started

-   Quick start
-   Installation
-   Project setup

These pages cover the basics required to run and structure a Vix
application.

------------------------------------------------------------------------

## Core concepts

Vix is built around a few simple principles:

-   Explicit routes
-   Explicit status handling
-   Predictable request and response lifecycle
-   No hidden runtime magic

Everything starts with:

``` cpp
App app;
```

Routes are defined using:

``` cpp
app.get("/path", [](Request&, Response&){ ... });
```

And the server starts with:

``` cpp
app.run(8080);
```

------------------------------------------------------------------------

## What you will learn here

In this section, you will progressively learn:

-   Path parameters
-   Query parameters
-   Headers
-   JSON body handling
-   Status codes
-   Structured routing patterns

Each guide focuses on clarity and minimal examples.

------------------------------------------------------------------------

## Philosophy

Vix is designed to be:

-   Minimal
-   Predictable
-   Explicit
-   High performance

You control the network layer. You control the response format. You
control the runtime behavior.

Nothing is abstracted away without your knowledge.

