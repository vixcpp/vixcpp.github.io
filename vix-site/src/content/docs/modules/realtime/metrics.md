# Metrics

`vix::realtime::Metrics` is a thread-safe collector for Realtime runtime metrics.

It records information such as:

```text
active rooms
active sessions
commands
events
snapshots
replay
session resume
presence
transport traffic
errors
durations
```

Metrics are observational. They do not affect authoritative room state, command ordering, or persistence.

## Create a metrics collector

```cpp
vix::realtime::Metrics metrics;
```

A new collector starts with all values at zero.

## Record a metric

For example, record a successfully opened room:

```cpp
metrics.record_room_opened();
```

Record a created session:

```cpp
metrics.record_session_created();
```

Record persisted events:

```cpp
metrics.record_events_persisted(2);
```

## Metrics are explicit

Creating a `Metrics` object does not automatically instrument the Realtime runtime.

For example:

```cpp
vix::realtime::Metrics metrics;

server.start();
```

does not automatically populate every counter in `metrics`.

The application or integration layer records the operations it wants to observe.

```cpp
server.start();

metrics.record_room_opened();
```

This makes `Metrics` an explicit collector rather than a hidden global monitoring system.

## Capture a snapshot

Read the current metrics with:

```cpp
auto snapshot =
    metrics.snapshot();
```

`MetricsSnapshot` contains a point-in-time copy of the collected values.

For example:

```cpp
auto snapshot =
    metrics.snapshot();

auto rooms =
    snapshot.activeRooms;

auto events =
    snapshot.eventsPersisted;
```

The snapshot is suitable for monitoring and health reporting.

Because metrics may continue changing while the snapshot is being assembled, it should not be treated as a transactional view of the runtime.

## Gauges

Some metrics describe the current runtime state.

These are gauges:

| Metric                | Meaning                                      |
| --------------------- | -------------------------------------------- |
| `activeRooms`         | Rooms currently managed                      |
| `activeSessions`      | Logical sessions currently managed           |
| `attachedConnections` | Sessions with attached connections           |
| `queuedCommands`      | Commands currently waiting in room queues    |
| `activePresence`      | Presence records currently considered active |

Set a gauge directly:

```cpp
metrics.set_active_rooms(5);
```

Or increment it:

```cpp
metrics.increment_active_rooms();
```

and decrement it:

```cpp
metrics.decrement_active_rooms();
```

Gauge decrements never go below zero.

## Room metrics

Record successful room lifecycle operations with:

```cpp
metrics.record_room_opened();
metrics.record_room_closed();
```

The snapshot exposes:

```cpp
snapshot.roomsOpened;
snapshot.roomsClosed;
```

These are cumulative counters since the latest reset.

## Session metrics

Record logical session lifecycle operations with:

```cpp
metrics.record_session_created();
metrics.record_session_closed();
```

Read them with:

```cpp
snapshot.sessionsCreated;
snapshot.sessionsClosed;
```

Current session count is tracked separately through:

```cpp
snapshot.activeSessions;
```

The distinction is:

```text
activeSessions
    current number of sessions

sessionsCreated
    total sessions created since reset
```

## Connection metrics

Record connection attachment:

```cpp
metrics.record_connection_attached();
```

and detachment:

```cpp
metrics.record_connection_detached();
```

The snapshot contains:

```cpp
snapshot.connectionsAttached;
snapshot.connectionsDetached;
snapshot.attachedConnections;
```

`attachedConnections` is the current gauge.

The other two values are cumulative counters.

## Command metrics

Record a command added to a room queue with:

```cpp
metrics.record_command_enqueued();
```

Record the final command result with:

```cpp
metrics.record_command_result(
    vix::realtime::CommandStatus::Accepted);
```

The snapshot contains:

```text
commandsEnqueued
commandsProcessed
commandsAccepted
commandsRejected
commandsIgnored
```

For example:

```cpp
auto accepted =
    snapshot.commandsAccepted;
```

Every call to `record_command_result()` increments `commandsProcessed` and the counter corresponding to the supplied status.

## Command duration

A command duration can be recorded at the same time:

```cpp
metrics.record_command_result(
    vix::realtime::CommandStatus::Accepted,
    std::chrono::microseconds{250});
```

The snapshot tracks:

```text
commandDurationCount
commandDurationTotalMicros
commandDurationMaxMicros
```

Convenience methods provide the average and maximum:

```cpp
auto average =
    snapshot.average_command_duration();

auto maximum =
    snapshot.maximum_command_duration();
```

If no command duration has been recorded, the average is zero.

## Event metrics

Record persisted authoritative events with:

```cpp
metrics.record_events_persisted(3);
```

Read the total with:

```cpp
snapshot.eventsPersisted;
```

Event delivery can also be recorded:

```cpp
metrics.record_event_dispatch(
    3,
    2,
    1);
```

The arguments represent:

```text
3 selected recipients
2 successful deliveries
1 failed delivery
```

The snapshot then tracks:

```text
eventDispatches
eventRecipients
eventDeliveriesSucceeded
eventDeliveriesFailed
```

## Event delivery success rate

Calculate the delivery success rate with:

```cpp
double rate =
    snapshot.event_delivery_success_rate();
```

For example:

```text
8 successful
2 failed

success rate = 0.8
```

When no event delivery has been attempted, the method returns:

```text
1.0
```

## Snapshot metrics

Record successful snapshot creation with:

```cpp
metrics.record_snapshot_created();
```

Record snapshot restoration with:

```cpp
metrics.record_snapshot_restored();
```

The snapshot contains:

```cpp
snapshot.snapshotsCreated;
snapshot.snapshotsRestored;
```

A duration can also be supplied:

```cpp
metrics.record_snapshot_created(
    std::chrono::microseconds{500});
```

Read duration statistics with:

```cpp
snapshot.average_snapshot_duration();
snapshot.maximum_snapshot_duration();
```

Creation and restoration durations contribute to the same snapshot-duration aggregates.

## Replay metrics

Record one successful replay with:

```cpp
metrics.record_replay(
    10,
    2048);
```

The arguments mean:

```text
10 events replayed
2048 serialized bytes processed
```

The snapshot contains:

```text
replayOperations
replayEventsApplied
replayBytes
```

A replay duration can also be recorded:

```cpp
metrics.record_replay(
    10,
    2048,
    std::chrono::microseconds{800});
```

Read timing information with:

```cpp
snapshot.average_replay_duration();
snapshot.maximum_replay_duration();
```

## Session resume metrics

Record a successful resume attempt with:

```cpp
metrics.record_resume_attempt(true);
```

Record a failed attempt with:

```cpp
metrics.record_resume_attempt(false);
```

The snapshot contains:

```text
resumeAttempts
resumeSucceeded
resumeFailed
```

Calculate the success rate with:

```cpp
double rate =
    snapshot.resume_success_rate();
```

When no resume attempt has been recorded, the method returns:

```text
1.0
```

## Presence metrics

Record logical presence joins with:

```cpp
metrics.record_presence_join();
```

and leaves with:

```cpp
metrics.record_presence_leave();
```

The snapshot contains:

```cpp
snapshot.presenceJoins;
snapshot.presenceLeaves;
snapshot.activePresence;
```

`activePresence` is a gauge and must be maintained separately when the application wants to expose the current active presence count.

## Transport metrics

Record a received transport message with its size:

```cpp
metrics.record_transport_received(512);
```

Record a sent message:

```cpp
metrics.record_transport_sent(256);
```

The snapshot tracks:

```text
transportMessagesReceived
transportBytesReceived
transportMessagesSent
transportBytesSent
```

For example:

```cpp
auto bytes =
    snapshot.transportBytesReceived;
```

## Protocol errors

Record an invalid protocol message with:

```cpp
metrics.record_protocol_error();
```

Read the cumulative value with:

```cpp
snapshot.protocolErrors;
```

## Runtime errors

Record a runtime error with:

```cpp
metrics.record_error();
```

Read the value with:

```cpp
snapshot.errors;
```

Check whether any runtime or protocol error has been recorded:

```cpp
if (snapshot.has_errors())
{
    // At least one error was recorded.
}
```

`has_errors()` returns `true` when either:

```text
errors > 0
```

or:

```text
protocolErrors > 0
```

## Reset metrics

Reset every gauge and cumulative counter with:

```cpp
metrics.reset();
```

After reset:

```cpp
auto snapshot =
    metrics.snapshot();
```

all collected values start again from zero.

Resetting metrics does not affect:

```text
rooms
sessions
events
snapshots
presence
connections
```

It only clears the metrics collector.

## Thread safety

`Metrics` is safe to update from multiple threads.

For example, different runtime integrations can share one collector:

```cpp
auto metrics =
    std::make_shared<
        vix::realtime::Metrics>();
```

Metrics updates are observational and do not synchronize authoritative application operations.

Counters saturate at the maximum `std::uint64_t` value instead of wrapping.

## Metrics and health

A metrics collector can be supplied to `HealthMonitor`.

```cpp
auto metrics =
    std::make_shared<
        vix::realtime::Metrics>();

vix::realtime::HealthMonitor monitor{
    server,
    metrics};
```

Health reports can then include the metrics snapshot and use recorded error counters when evaluating health.

See [Health](./health) for health reporting.

## Main model

The metrics flow is:

```text
runtime operation
      |
      v
Metrics::record_*()
      |
      v
Metrics
      |
      v
snapshot()
      |
      v
MetricsSnapshot
```

The important distinction is:

```text
Realtime runtime
    performs application operations

Metrics
    observes explicitly recorded operations
```

Metrics provide counters, gauges, rates, and durations without becoming part of authoritative room behavior.

Continue with [Health](./health) for runtime health inspection.
