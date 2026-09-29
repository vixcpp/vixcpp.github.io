---
title: Pull Requests
description: Pull request guidelines for Vix.cpp.
---

# Pull Requests

Pull requests are the main path for improving Vix.cpp.

A good pull request is focused, easy to review, easy to test, and aligned with the architecture of the project.

## Scope

Keep each pull request focused on one clear change.

Good scopes include:

```txt
one bug fix
one CLI improvement
one module improvement
one SDK compatibility fix
one documentation update
one CI improvement
one test improvement
```

Avoid mixing unrelated work in the same pull request.

A pull request should make the reviewer understand quickly:

```txt
what changed
why it changed
how it was tested
what part of Vix is affected
```

## Before opening a pull request

Validate the project with the Vix CLI:

```bash
vix build
vix tests
vix check
```

If the change affects a specific command, validate that command directly:

```bash
vix run main.cpp
vix dev
vix tests -v
vix tests --raw
vix doctor
```

If the change affects public headers, test a consumer-style include:

```cpp
#include <vix.hpp>
#include <vix/all.hpp>

int main()
{
  return 0;
}
```

Public headers must compile cleanly and must not accidentally expose internal implementation details.

## Pull request title

Use a clear title with a conventional prefix.

Examples:

```txt
fix(cli): improve test failure diagnostics
fix(sdk): keep public aggregators lightweight
fix(p2p): avoid transport dependency in aggregate header
ci(release): improve Windows dependency resolution
docs: add contribution guide
```

Recommended prefixes:

```txt
fix:      bug fix
feat:     new feature
docs:     documentation
ci:       CI workflow change
test:     tests
chore:    maintenance
refactor: structure change without behavior change
```

## Pull request description

The description should be direct and useful.

Use this structure:

```markdown
## What changed

Describe the change.

## Why

Explain the reason.

## Testing

List the commands used to validate the change.

## Notes

Mention compatibility, SDK, module, or CI impact if relevant.
```

Example:

```markdown
## What changed

Updated the public middleware aggregate header so it no longer includes cache-specific middleware by default.

## Why

The general middleware entry point should remain lightweight and should not force optional cache dependencies.

## Testing

- `vix build`
- `vix tests`
- `vix run main.cpp`

## Notes

Specialized cache middleware remains available through explicit includes.
```

## Public API changes

Any public API change must be intentional.

Public API changes include:

```txt
new public headers
removed public headers
renamed public types
changed function signatures
changed CLI behavior
changed generated project structure
changed SDK packaging behavior
```

If a pull request changes public API behavior, explain the compatibility impact.

Do not expose internal implementation headers through public aggregators.

## Header policy

Public headers should be safe to include in real projects.

General headers should remain lightweight:

```cpp
#include <vix.hpp>
#include <vix/all.hpp>
```

Specialized features should stay explicit:

```cpp
#include <vix/p2p/transport/Tcp.hpp>
#include <vix/middleware/http_cache.hpp>
#include <vix/middleware/app/http_cache.hpp>
#include <vix/middleware/app/*>
```

Avoid forcing optional or heavy dependencies through broad aggregate headers.

## CLI behavior

The Vix CLI is the primary developer interface.

Changes that affect CLI behavior should be tested through the CLI itself:

```bash
vix run
vix build
vix dev
vix tests
vix check
vix new
vix clean
vix info
vix doctor
```

A CLI change should improve clarity, reliability, diagnostics, or workflow.

Avoid adding behavior that hides errors or makes command output harder to understand.

## Tests

Add or update tests when changing behavior.

Tests are expected for:

```txt
bug fixes
CLI output changes
build behavior
test runner behavior
public header compatibility
module integration
runtime behavior
diagnostics
```

A good test should make the original problem hard to reintroduce silently.

## CI changes

CI changes should make validation stronger and clearer.

Good CI changes:

```txt
install required dependencies explicitly
make logs more useful
avoid fragile setup steps
validate release artifacts
validate SDK consumer builds
preserve cross-platform behavior
```

Avoid weakening CI to make a failure disappear.

If a check is removed, the replacement should be stronger or the reason should be clear.

## Submodules

Some Vix modules are managed as submodules.

When changing a submodule, commit inside the submodule first:

```bash
cd modules/example
git add .
git commit -m "fix(example): describe the change"
git push origin dev
```

Then commit the updated submodule pointer in the root repository:

```bash
cd /path/to/vix
git add modules/example
git commit -m "chore(submodules): update example"
```

A root pull request is incomplete if the submodule commit was not pushed.

## Documentation

Documentation should be updated when a pull request changes:

```txt
CLI commands
public APIs
generated templates
installation behavior
release behavior
module usage
developer workflow
```

Documentation should be direct, command-driven, and easy to verify.

## Review expectations

A reviewer should be able to understand the pull request without reconstructing the full context.

Keep the diff readable.

Prefer small pull requests over large mixed changes.

Avoid unnecessary formatting noise.

Avoid unrelated renames.

Avoid changing generated files unless the generator or release workflow requires it.

## Merge readiness

A pull request is ready to merge when:

```txt
the scope is clear
the change is tested
the description explains the reason
CI is green
public headers remain safe
submodule pointers are correct
documentation is updated when needed
```

## Final checklist

Before requesting review:

```txt
scope is focused
commit messages are clear
Vix CLI validation passed
tests were added or updated when needed
public headers compile cleanly
documentation is updated when needed
submodule commits are pushed
root submodule pointers are committed
CI failures are understood or fixed
```
