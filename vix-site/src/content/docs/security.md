---
title: Security
description: Security policy for Vix.cpp.
---

# Security

Security matters in Vix.cpp because the project touches runtime execution, networking, build workflows, SDK packaging, CLI behavior, and developer systems.
This page explains how to report security issues and what kinds of issues should be handled privately.

## Reporting a vulnerability

Do not open a public issue for a security vulnerability.
Report security issues privately by email:

```txt
security@vixcpp.com
```

If that address is not available yet, use the project maintainer contact listed on the official repository or website.
Include enough information to reproduce and understand the issue:

```txt
affected version
affected module or command
operating system
compiler version
impact
reproduction steps
proof of concept if available
logs or diagnostics
suggested fix if known
```

A good report is clear, minimal, and reproducible.

## What to report privately

Report the following privately:

```txt
remote code execution
arbitrary file write
path traversal
command injection
unsafe process execution
TLS or certificate validation issues
authentication bypass
authorization bypass
secret exposure
supply-chain compromise
malicious package behavior
unsafe SDK packaging behavior
privilege escalation
sandbox escape
denial of service with security impact
```

If the issue could put users, systems, releases, credentials, packages, or infrastructure at risk, report it privately first.

## What can be public

Some issues can be opened publicly when they do not expose users to immediate risk.

Examples:

```txt
normal bugs
documentation mistakes
non-sensitive build failures
non-sensitive CI failures
ordinary crashes without exploitability
performance regressions without security impact
missing validation that does not create a vulnerability
```

When unsure, report privately.

## Responsible disclosure

Please give maintainers time to investigate and fix confirmed vulnerabilities before publishing details.
Do not publicly share exploit code, attack steps, or sensitive details before a fix is available.
Responsible disclosure helps protect users while still allowing the project to improve openly.

## Maintainer response

Security reports are handled with priority.

The expected process is:

```txt
acknowledge the report
confirm the affected area
reproduce the issue
assess severity
prepare a fix
validate the fix
release the fix when needed
publish advisory details when appropriate
```

The timeline depends on severity, complexity, affected platforms, and release impact.

## Supported versions

Security fixes target the actively maintained release line.
For serious vulnerabilities, maintainers may also provide guidance for older versions when practical.
Users should keep Vix.cpp updated, especially when using:

```txt
networking modules
WebSocket support
P2P support
process execution
deployment commands
SDK packages
release binaries
```

## Security-sensitive areas

Security review is especially important for changes that affect:

```txt
CLI command execution
process spawning
path handling
file writes
archive extraction
package installation
registry access
network protocols
TLS configuration
WebSocket sessions
P2P transport
authentication middleware
authorization middleware
release signing
SDK packaging
installer scripts
```

Changes in these areas should be reviewed carefully and tested thoroughly.

## CLI security

The Vix CLI should remain explicit and predictable.
CLI commands must avoid hidden dangerous behavior.
Security-sensitive CLI behavior includes:

```txt
running external commands
writing generated files
modifying project configuration
installing packages
updating dependencies
publishing packages
creating release artifacts
deploying services
reading environment variables
handling secrets
```

Commands should produce clear diagnostics and should not silently ignore dangerous states.

## Installer security

The official install commands are:
Shell, Linux and macOS:

```bash
curl -fsSL https://vixcpp.com/install.sh | bash
```

PowerShell, Windows:

```powershell
irm https://vixcpp.com/install.ps1 | iex
```

Installer changes must be reviewed carefully because they affect user machines directly.
Installer scripts should be:

```txt
minimal
auditable
version-aware
clear about what they install
clear about where files are written
safe on repeated execution
careful with PATH changes
```

## Dependency and supply-chain security

Dependency changes should be intentional.
Avoid adding dependencies unless they clearly improve the project.
When adding or updating dependencies, consider:

```txt
license
maintenance status
platform support
security history
build impact
package size
transitive dependencies
release reproducibility
```

Release workflows should prefer reproducible, explicit dependency setup.

## Secrets

Never commit secrets.

This includes:

```txt
API keys
tokens
private keys
certificates
passwords
deployment credentials
signing keys
registry credentials
cloud credentials
```

If a secret is committed by mistake, rotate it immediately and remove it from history where appropriate.

## Security fixes

Security fixes should be small, direct, and easy to audit.
A good security fix should:

```txt
remove the unsafe behavior
add validation where needed
preserve compatibility when possible
add tests for the failure mode
improve diagnostics when useful
avoid hiding the original issue
```

When a security fix changes behavior, document the compatibility impact.

## Public advisories

For confirmed vulnerabilities, the project may publish a security advisory after a fix is available.
An advisory should include:

```txt
affected versions
impact
fixed version
recommended action
technical summary
credit when appropriate
```

Exploit details may be limited when publishing them would put users at unnecessary risk.

## Credit

Security researchers and contributors may be credited when they report issues responsibly.
Credit can be omitted on request.

## Final note

Security in Vix.cpp is part of the project’s reliability model.
The goal is not only to fix vulnerabilities, but to keep the runtime, CLI, SDK, and release process understandable, auditable, and safe for real projects.
