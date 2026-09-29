# Configuration

`vix::realtime::Config` controls process limits, room lifecycle policies, replay limits, snapshots, session resumption, and presence.

A default configuration can be created directly:

```cpp
#include <vix/realtime.hpp>

vix::realtime::Config config;
```

You can then override only the values needed by the application:

```cpp
vix::realtime::Config config;

config.maxActiveRooms = 500;
config.maxSessionsPerRoom = 64;
config.snapshotEveryEvents = 250;
config.sessionResumeWindow = std::chrono::seconds{60};
```

Pass the configuration when constructing the runtime:

```cpp
vix::realtime::Server server{
    vix::realtime::NodeId{"node-1"},
    config};
```

## Default configuration

The default values are:

| Field                       |     Default | Purpose                                                     |
| --------------------------- | ----------: | ----------------------------------------------------------- |
| `maxActiveRooms`            |      `1000` | Maximum active rooms in the process                         |
| `maxSessions`               |     `10000` | Maximum logical sessions                                    |
| `maxSessionsPerRoom`        |       `256` | Maximum sessions in one room                                |
| `maxRoomsPerSession`        |        `32` | Maximum rooms joined by one session                         |
| `maxPendingCommandsPerRoom` |      `1024` | Maximum queued commands for one room                        |
| `maxReplayEvents`           |      `1000` | Maximum events processed by one replay                      |
| `maxReplayBytes`            |     `4 MiB` | Maximum serialized event data processed by one replay       |
| `maxResumeRooms`            |        `32` | Maximum rooms recovered during one session resume           |
| `snapshotEveryEvents`       |       `100` | Event interval between automatic snapshots                  |
| `snapshotsToKeep`           |         `3` | Number of recent snapshots retained per room                |
| `roomIdleTimeout`           | `300000 ms` | Idle time before an empty room becomes eligible for cleanup |
| `sessionResumeWindow`       |     `120 s` | Maximum detached duration for session resumption            |
| `presenceTimeout`           |      `90 s` | Inactivity duration used when pruning presence              |
| `replayTimeout`             |   `5000 ms` | Maximum replay processing duration                          |
| `snapshotOnRoomClose`       |      `true` | Create a snapshot when a room closes cleanly                |
| `restoreRoomsOnOpen`        |      `true` | Restore persisted room state when opening a room            |
| `enableSessionResume`       |      `true` | Enable session resumption                                   |
| `enablePresence`            |      `true` | Enable presence tracking                                    |

## Runtime capacity

### Maximum active rooms

```cpp
config.maxActiveRooms = 1000;
```

`maxActiveRooms` limits the number of rooms currently managed by one `RoomManager`.

Opening another room after the limit is reached fails with `ErrorCode::RoomLimitReached`.

The value must be greater than zero.

### Maximum sessions

```cpp
config.maxSessions = 10000;
```

`maxSessions` limits the number of logical sessions registered in the process.

The limit applies to logical `Session` objects, not individual network connections.

The value must be greater than zero.

### Maximum sessions per room

```cpp
config.maxSessionsPerRoom = 256;
```

`maxSessionsPerRoom` limits membership in each room.

A session cannot join a room that has already reached this capacity.

The value must be greater than zero.

### Maximum rooms per session

```cpp
config.maxRoomsPerSession = 32;
```

`maxRoomsPerSession` limits how many rooms one logical session may join simultaneously.

The value must be greater than zero.

## Command queue

```cpp
config.maxPendingCommandsPerRoom = 1024;
```

Each room maintains its own command queue.

`maxPendingCommandsPerRoom` limits how many commands may wait in that queue. The limit provides backpressure when commands are submitted faster than the room processes them.

The value must be greater than zero.

## Replay limits

Replay is used when reconstructing room state and when recovering missed events for resumable sessions.

Three limits control replay work.

### Event limit

```cpp
config.maxReplayEvents = 1000;
```

This limits the number of events processed by one replay operation.

The value must be greater than zero.

### Byte limit

```cpp
config.maxReplayBytes = 4 * 1024 * 1024;
```

This limits the serialized size of events processed during one replay.

The limit is measured in bytes.

The value must be greater than zero.

### Replay timeout

```cpp
config.replayTimeout =
    std::chrono::milliseconds{5000};
```

This limits how long replay processing may continue.

Use a positive duration. Negative durations are rejected by `Config::validate()`, and replay itself requires a timeout greater than zero.

Replay limits are covered in more detail in [Replay and Recovery](./replay-and-recovery).

## Session resume limits

### Enable session resume

```cpp
config.enableSessionResume = true;
```

When enabled, a detached logical session can reconnect using its resume information while it remains within the configured resume window.

Disable the feature with:

```cpp
config.enableSessionResume = false;
```

### Resume window

```cpp
config.sessionResumeWindow =
    std::chrono::seconds{120};
```

The resume window begins when the session becomes detached.

A session is resumable only while its detached duration is less than or equal to this value and the other resume requirements are satisfied.

A negative duration is invalid.

### Maximum rooms per resume

```cpp
config.maxResumeRooms = 32;
```

A session resume may require recovering missed state for every room joined by the session.

If the session belongs to more than `maxResumeRooms`, the resume request is rejected.

The value must be greater than zero.

See [Session Resume](./session-resume) for the complete resume workflow.

## Snapshots

Snapshots reduce the amount of event history required during recovery.

### Periodic snapshots

```cpp
config.snapshotEveryEvents = 100;
```

A periodic snapshot becomes eligible after the configured number of events since the previous snapshot.

Set the value to zero to disable periodic snapshots:

```cpp
config.snapshotEveryEvents = 0;
```

Zero is intentionally valid for this field.

### Snapshot retention

```cpp
config.snapshotsToKeep = 3;
```

`snapshotsToKeep` controls how many recent snapshots are retained for each room when snapshot pruning is performed.

The value must be greater than zero.

### Snapshot on room close

```cpp
config.snapshotOnRoomClose = true;
```

When enabled, closing a room cleanly can create a snapshot if the room state has advanced since the last snapshot.

Disable this behavior with:

```cpp
config.snapshotOnRoomClose = false;
```

Snapshots require a configured `SnapshotStore`. The snapshot store itself is optional.

See [Snapshots](./snapshots) for snapshot creation and recovery behavior.

## Room restoration

```cpp
config.restoreRoomsOnOpen = true;
```

When enabled, opening a room attempts to reconstruct existing persisted state.

Recovery can use:

```text
latest usable snapshot
        |
        v
events after the snapshot
        |
        v
current RoomState
```

If no usable snapshot is available, recovery can begin from the room's initial state and replay its event stream.

Disable automatic restoration with:

```cpp
config.restoreRoomsOnOpen = false;
```

Disabling restoration does not delete stored events or snapshots.

## Idle room cleanup

```cpp
config.roomIdleTimeout =
    std::chrono::milliseconds{300000};
```

An open room becomes eligible for idle cleanup when:

- it has no sessions
- its inactivity duration reaches the configured timeout

Cleanup is performed when `RoomManager::cleanup()` or its equivalent runtime operation is called.

The timeout does not create a background cleanup thread.

Set the value to zero to disable idle room cleanup:

```cpp
config.roomIdleTimeout =
    std::chrono::milliseconds{0};
```

Negative values are invalid.

## Presence

### Enable presence

```cpp
config.enablePresence = true;
```

When presence is enabled, the runtime maintains logical room presence through a `PresenceStore`.

The default `RoomManager` creates a `LocalPresenceStore`.

Disable presence with:

```cpp
config.enablePresence = false;
```

When presence is disabled, the default manager does not create a presence store.

If presence is enabled while constructing a manager with explicit dependencies, a presence store must be supplied.

### Presence timeout

```cpp
config.presenceTimeout =
    std::chrono::seconds{90};
```

`presenceTimeout` determines when a presence record is considered stale during pruning.

The runtime exposes pruning through:

```cpp
server.prune_stale_presence();
```

The timeout itself does not schedule periodic cleanup.

A negative value is invalid.

See [Presence](./presence) for presence lifecycle behavior.

## Loading from Vix core configuration

Realtime configuration can also be created from `vix::config::Config`:

```cpp
vix::config::Config core;

core.set("realtime.max_active_rooms", 500);
core.set("realtime.max_sessions_per_room", 64);
core.set("realtime.snapshot_every_events", 250);
core.set("realtime.enable_presence", true);

auto config =
    vix::realtime::Config::from_core(core);
```

`Config::from_core()` starts with the Realtime defaults, reads recognized `realtime.*` values, then validates the resulting configuration.

## Core configuration keys

The supported keys are:

| Core configuration key                   | `Config` field              |
| ---------------------------------------- | --------------------------- |
| `realtime.max_active_rooms`              | `maxActiveRooms`            |
| `realtime.max_sessions`                  | `maxSessions`               |
| `realtime.max_sessions_per_room`         | `maxSessionsPerRoom`        |
| `realtime.max_rooms_per_session`         | `maxRoomsPerSession`        |
| `realtime.max_pending_commands_per_room` | `maxPendingCommandsPerRoom` |
| `realtime.max_replay_events`             | `maxReplayEvents`           |
| `realtime.max_replay_bytes`              | `maxReplayBytes`            |
| `realtime.max_resume_rooms`              | `maxResumeRooms`            |
| `realtime.snapshot_every_events`         | `snapshotEveryEvents`       |
| `realtime.snapshots_to_keep`             | `snapshotsToKeep`           |
| `realtime.room_idle_timeout_ms`          | `roomIdleTimeout`           |
| `realtime.session_resume_window_seconds` | `sessionResumeWindow`       |
| `realtime.presence_timeout_seconds`      | `presenceTimeout`           |
| `realtime.replay_timeout_ms`             | `replayTimeout`             |
| `realtime.snapshot_on_room_close`        | `snapshotOnRoomClose`       |
| `realtime.restore_rooms_on_open`         | `restoreRoomsOnOpen`        |
| `realtime.enable_session_resume`         | `enableSessionResume`       |
| `realtime.enable_presence`               | `enablePresence`            |

Duration units are part of the key name where applicable:

```text
room_idle_timeout_ms
replay_timeout_ms

session_resume_window_seconds
presence_timeout_seconds
```

## Validation

Call `validate()` when validating a configuration independently:

```cpp
vix::realtime::Config config;

config.maxActiveRooms = 500;
config.snapshotEveryEvents = 0;

config.validate();
```

Invalid configuration throws:

```cpp
vix::realtime::Error
```

with:

```cpp
vix::realtime::ErrorCode::InvalidConfiguration
```

The following limits must be greater than zero:

```text
maxActiveRooms
maxSessions
maxSessionsPerRoom
maxRoomsPerSession
maxPendingCommandsPerRoom
maxReplayEvents
maxReplayBytes
maxResumeRooms
snapshotsToKeep
```

`snapshotEveryEvents` is the exception among the numeric snapshot limits. Zero disables periodic snapshots.

These durations cannot be negative:

```text
roomIdleTimeout
sessionResumeWindow
presenceTimeout
replayTimeout
```

For actual replay execution, `replayTimeout` must be greater than zero.

## Example configuration

A persistent application might begin with:

```cpp
vix::realtime::Config config;

config.maxActiveRooms = 2000;
config.maxSessions = 20000;
config.maxSessionsPerRoom = 128;
config.maxRoomsPerSession = 16;

config.maxPendingCommandsPerRoom = 512;

config.maxReplayEvents = 2000;
config.maxReplayBytes = 8 * 1024 * 1024;
config.replayTimeout =
    std::chrono::milliseconds{5000};

config.snapshotEveryEvents = 250;
config.snapshotsToKeep = 3;
config.snapshotOnRoomClose = true;
config.restoreRoomsOnOpen = true;

config.enableSessionResume = true;
config.sessionResumeWindow =
    std::chrono::seconds{120};
config.maxResumeRooms = 16;

config.enablePresence = true;
config.presenceTimeout =
    std::chrono::seconds{90};

config.roomIdleTimeout =
    std::chrono::minutes{5};

config.validate();
```

The appropriate values depend on room size, event volume, persistence latency, expected disconnect duration, and the application's operational limits.

Continue with [Server](./server) for how this configuration is applied to the Realtime runtime.
