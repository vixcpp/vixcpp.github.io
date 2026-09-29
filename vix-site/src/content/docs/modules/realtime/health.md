# Health

`vix::realtime::HealthMonitor` inspects the current state of a Realtime runtime.

It reports information about:

```text
server lifecycle
rooms
sessions
command queues
configured stores
room ownership
presence
optional metrics
```

Health inspection is observational. It does not modify the runtime.

## Create a health monitor

A monitor requires a `Server`:

```cpp
auto server =
    std::make_shared<vix::realtime::Server>(
        vix::realtime::NodeId{"node-1"});

server->start();

vix::realtime::HealthMonitor monitor{
    server};
```

## Check health

Create a point-in-time report with:

```cpp
auto report =
    monitor.check();
```

Check whether the runtime is completely healthy:

```cpp
if (report.healthy())
{
    // Runtime is healthy.
}
```

## Health states

A report has one of four states:

```text
Healthy
Degraded
Unhealthy
Stopped
```

Read it with:

```cpp
auto status =
    report.status;
```

The stable textual values are:

```text
healthy
degraded
unhealthy
stopped
```

using:

```cpp
auto text =
    vix::realtime::to_string(
        report.status);
```

## Healthy

`Healthy` means the running runtime passed the configured health checks.

```cpp
report.status ==
    vix::realtime::HealthStatus::Healthy;
```

A running server begins health evaluation as healthy and can then be downgraded if problems are found.

## Degraded

`Degraded` means the runtime remains operational but one or more conditions require attention.

Examples include:

```text
rooms changing lifecycle state
closed rooms still registered
too many queued commands
detached sessions when configured
recorded errors above tolerance
```

A degraded runtime is still considered operational.

## Unhealthy

`Unhealthy` indicates a condition that prevents the runtime from being considered safe for normal operation.

Examples include:

```text
server failed
missing event store
missing room directory
failed rooms
invalid room ownership
required store unavailable
```

## Stopped

`Stopped` means the Realtime server is not currently running.

For example, checking a newly created server reports:

```text
stopped
```

with the issue:

```text
realtime server has not started
```

A normally stopped server also reports `Stopped`.

## Operational status

Check whether the runtime may still serve requests with:

```cpp
if (report.operational())
{
    // Healthy or degraded.
}
```

`operational()` returns `true` for:

```text
Healthy
Degraded
```

and `false` for:

```text
Unhealthy
Stopped
```

## Health issues

The report contains human-readable findings:

```cpp
for (const auto &issue : report.issues)
{
    // Inspect issue.
}
```

Check whether any were recorded with:

```cpp
if (report.has_issues())
{
    // Health findings exist.
}
```

A report can contain several issues at once.

## Server lifecycle

Health inspection includes the current server state:

```cpp
auto status =
    report.serverStatus;
```

The health mapping begins as:

| Server status | Initial health |
| ------------- | -------------- |
| `Running`     | `Healthy`      |
| `Created`     | `Stopped`      |
| `Stopping`    | `Degraded`     |
| `Stopped`     | `Stopped`      |
| `Failed`      | `Unhealthy`    |

Additional runtime checks can further change the result.

## Room information

The report contains:

```cpp
report.roomCount;
report.openRoomCount;
report.transitioningRoomCount;
report.closedRoomCount;
report.failedRoomCount;
```

For example:

```cpp
auto openRooms =
    report.openRoomCount;
```

Rooms in `Created`, `Opening`, or `Closing` contribute to:

```cpp
report.transitioningRoomCount;
```

When the server is running, transitional rooms cause a degraded report.

## Failed rooms

Rooms in the `Failed` state are counted with:

```cpp
report.failedRoomCount;
```

If at least one failed room exists, the health report becomes:

```text
Unhealthy
```

Failed rooms therefore affect overall runtime health directly.

## Room ownership

For each open room, the monitor checks that the local node currently owns it through `RoomDirectory`.

The number of open rooms owned locally is available with:

```cpp
report.locallyOwnedRoomCount;
```

An open room without valid local ownership makes the report unhealthy.

This check uses both the room identifier and the local runtime node.

See [Room Ownership](./room-ownership) for ownership behavior.

## Command queues

The report sums pending commands across managed rooms:

```cpp
auto queued =
    report.queuedCommandCount;
```

By default, queued commands do not affect health.

A degradation threshold can be configured:

```cpp
vix::realtime::HealthOptions options;

options.maxQueuedCommands = 100;
```

If the total queued command count exceeds `100`, the report becomes degraded.

Set:

```cpp
options.maxQueuedCommands = 0;
```

to disable this threshold.

Zero is the default.

## Session information

The report contains:

```cpp
report.sessionCount;
report.connectedSessionCount;
report.detachedSessionCount;
report.closedSessionCount;
```

For example:

```cpp
auto connected =
    report.connectedSessionCount;
```

Detached sessions are counted separately from connected sessions.

## Detached sessions

Detached sessions do not degrade health by default.

Enable that policy with:

```cpp
vix::realtime::HealthOptions options;

options.degradeOnDetachedSessions = true;
```

If one or more detached sessions exist, the report becomes degraded.

This option is useful when unexpected disconnections should be visible in health reporting.

## Closed sessions

If closed sessions remain registered in the manager, the health report becomes degraded.

Their count is available with:

```cpp
report.closedSessionCount;
```

Normal session removal should prevent closed sessions from remaining registered.

## Event store

The report indicates whether an authoritative event store is configured:

```cpp
report.eventStoreAvailable;
```

An event store is required for normal Realtime operation.

If it is unavailable, health becomes:

```text
Unhealthy
```

This check verifies that the manager has an event store configured. It does not perform a backend connectivity test.

## Snapshot store

Check whether a snapshot store exists with:

```cpp
report.snapshotStoreAvailable;
```

A snapshot store is optional by default, so its absence does not normally affect health.

You can require one:

```cpp
vix::realtime::HealthOptions options;

options.requireSnapshotStore = true;
```

If the store is missing, the report becomes unhealthy.

## Presence

The report indicates whether presence is enabled:

```cpp
report.presenceEnabled;
```

and whether a store is configured:

```cpp
report.presenceStoreAvailable;
```

When presence is enabled, a presence store is required by default for healthy operation.

This policy is controlled by:

```cpp
options.requirePresenceStoreWhenEnabled;
```

Its default value is:

```text
true
```

## Presence count

When a presence store is available, the monitor reads its current record count:

```cpp
auto count =
    report.presenceCount;
```

If inspecting the presence store throws an error, the health report becomes unhealthy and records the failure in `issues`.

## Room directory

The report checks whether a room ownership directory exists:

```cpp
report.roomDirectoryAvailable;
```

A missing room directory makes the runtime unhealthy.

The directory is also used to validate ownership of every open room.

## Include metrics

A metrics collector can optionally be supplied:

```cpp
auto metrics =
    std::make_shared<
        vix::realtime::Metrics>();

vix::realtime::HealthMonitor monitor{
    server,
    metrics};
```

The health report then contains:

```cpp
report.metricsAvailable;
report.metrics;
```

If no collector is supplied:

```cpp
report.metricsAvailable == false;
```

Health monitoring does not automatically create or populate metrics.

See [Metrics](./metrics) for explicit instrumentation.

## Runtime error tolerance

When metrics are provided, recorded runtime errors can affect health.

By default:

```cpp
options.recordedErrorTolerance = 0;
```

This means the first explicitly recorded runtime error causes degradation.

For example:

```cpp
options.recordedErrorTolerance = 5;
```

allows up to five recorded runtime errors before health becomes degraded.

The comparison is:

```text
errors > tolerance
```

not:

```text
errors >= tolerance
```

## Protocol error tolerance

Protocol errors use a separate threshold:

```cpp
options.protocolErrorTolerance = 0;
```

For example:

```cpp
options.protocolErrorTolerance = 10;
```

degrades health only when the metrics collector contains more than ten protocol errors.

These counters are cumulative until the metrics collector is reset.

## Health options

The available options are:

| Option                            | Default | Purpose                                           |
| --------------------------------- | ------- | ------------------------------------------------- |
| `requireSnapshotStore`            | `false` | Require a snapshot store                          |
| `requirePresenceStoreWhenEnabled` | `true`  | Require presence storage when presence is enabled |
| `degradeOnDetachedSessions`       | `false` | Degrade health when sessions are detached         |
| `maxQueuedCommands`               | `0`     | Queue threshold, zero disables it                 |
| `recordedErrorTolerance`          | `0`     | Allowed recorded runtime errors                   |
| `protocolErrorTolerance`          | `0`     | Allowed recorded protocol errors                  |

A simple customized monitor is:

```cpp
vix::realtime::HealthOptions options;

options.maxQueuedCommands = 100;
options.degradeOnDetachedSessions = true;

vix::realtime::HealthMonitor monitor{
    server,
    nullptr,
    options};
```

## Report information

A `HealthReport` also contains:

```cpp
report.checkedAt;
report.nodeId;
```

`checkedAt` records when the inspection was performed.

`nodeId` identifies the local Realtime node being inspected.

## Health checks are observational

Calling:

```cpp
auto report =
    monitor.check();
```

does not:

```text
close failed rooms
remove sessions
prune presence
clear queues
restart the server
reset metrics
change ownership
```

It only inspects the current runtime and reports findings.

Recovery and cleanup remain explicit runtime operations.

## Main model

Health inspection follows this model:

```text
Realtime Server
      |
      v
HealthMonitor
      |
      +---- server state
      +---- rooms
      +---- ownership
      +---- queues
      +---- sessions
      +---- stores
      +---- presence
      +---- optional metrics
      |
      v
HealthReport
```

The report provides a point-in-time view of whether the runtime is healthy, degraded, unhealthy, or stopped.

Continue with [Errors](./errors) for Realtime error codes and failure handling.
