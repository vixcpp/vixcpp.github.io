# CLI

The `vix tests` command is the project-level entry point for running tests from the terminal. It builds, discovers, and executes project tests without requiring the developer to remember the exact build directory, runner path, or CTest invocation used by the current project.

This command is separate from the C++ `vix::tests` API. The module API is used inside test code to define assertions, test cases, suites, registries, and runners. The CLI command is used outside the codebase to run those tests as part of the development workflow.

## Usage

```bash
vix tests [path] [options] [-- ctest args...]
```

The optional `path` argument points to the project directory. When no path is provided, Vix uses the current directory.

```bash
vix tests
```

```bash
vix tests ./examples/blog
```

## How tests are run

Vix first looks for a native test runner in the project build output. This is the preferred path when a project produces a test executable such as `tests`, `vix_tests`, `vix_tests_runner`, or another executable with a test-like name.

When no native runner is available, Vix falls back to CTest if the build directory contains CTest metadata. This makes the command work with projects that expose tests through CMake and CTest instead of a custom runner executable.

If test sources exist in the `tests/` directory but the test build has not been configured yet, Vix can prepare the test build before running it. During that preparation step, it enables CMake testing and turns on the project-specific test option.

## Run tests

Run all available tests:

```bash
vix tests
```

Vix uses the default build preset when no preset is provided. In the current workflow, the default preset is `dev-ninja`.

To run tests with another preset:

```bash
vix tests --preset release
```

The preset controls which build directory Vix inspects and which configuration it uses when tests need to be prepared.

## List tests

Use `--list` to show discovered tests without executing them.

```bash
vix tests --list
```

This is useful before applying a filter, or when checking that the project has registered the tests you expect.

## Filter tests

Use `--test` to run tests matching a name or regex.

```bash
vix tests --test tree.basic
```

The same filter can be written with the equals form:

```bash
vix tests --test=tree.basic
```

CTest-style filtering can also be written with `-R`:

```bash
vix tests -R tree.basic
```

A filter is useful when working on one behavior and keeping the feedback loop focused on the tests related to that behavior.

## Watch mode

Use `--watch` to re-run tests when project files change.

```bash
vix tests --watch
```

Watch mode observes C++ source files, headers, CMake files, `CMakeLists.txt`, and `CMakePresets.json`. It ignores common directories such as `.git`, editor folders, build directories, and distribution output. After a change is detected, Vix waits briefly for the file tree to settle before running the tests again.

## Raw output

By default, Vix formats test output into a cleaner summary. Use `--raw` when you need to inspect the original output from the underlying runner or CTest process.

```bash
vix tests --raw
```

Raw output is useful when debugging a failure that needs more context than the cleaned diagnostic view shows.

## Verbose failure details

Use `-v` or `--verbose` when you want more detailed failure information while keeping the Vix formatted output.

```bash
vix tests -v
```

```bash
vix tests --verbose
```

Verbose output is useful when the first failure summary is not enough and you want to inspect more of the captured test details.

## Fail fast

Use `--fail-fast` when the run should stop after the first failing test.

```bash
vix tests --fail-fast
```

This is useful during focused development when later failures are not helpful until the first failing behavior has been fixed.

## Run checks after tests

Use `--run` to run runtime checks after the tests pass.

```bash
vix tests --run
```

The checks are only executed when the test step succeeds. This keeps the workflow ordered: first the test suite must pass, then the broader runtime checks can run.

## Forward CTest arguments

Arguments after `--` are passed to CTest.

```bash
vix tests -- --output-on-failure
```

```bash
vix tests -- --output-on-failure -R MySuite
```

Passing raw CTest arguments forces CTest mode. Use this when you need direct access to CTest behavior that is not covered by the higher-level Vix options.

## Build and preset options

Use `--preset` to choose the build preset used for test discovery and preparation.

```bash
vix tests --preset release
```

Use `--build-target` to control the build target used while preparing tests.

```bash
vix tests --build-target all
```

In normal use, the default target is enough. The explicit option is useful when a project has a custom test preparation workflow or when you need to align the test command with a specific build target.

## Common workflow

A typical development loop starts with the normal test command.

```bash
vix tests
```

When working on one failing area, filter the run.

```bash
vix tests --test parser.empty-object
```

When the failure needs more context, use verbose or raw output.

```bash
vix tests -v
```

```bash
vix tests --raw
```

When editing the module repeatedly, switch to watch mode.

```bash
vix tests --watch
```

## Exit code

`vix tests` returns `0` when the test run succeeds. It returns a non-zero exit code when tests fail, when no runnable tests can be found, or when the test process reports an error. This makes the command suitable for local development scripts and CI jobs.

## No tests found

When Vix cannot find runnable tests, it checks whether the project contains a `tests/` directory with test source files. If no test sources are found, the command reports that no tests are available. If test sources exist but no runnable test target is generated, the project CMake configuration should be checked so that tests are enabled when the project test option is turned on.

## Next step

Continue with the CMake page to see how a project exposes test executables and CTest entries that `vix tests` can discover and run.
