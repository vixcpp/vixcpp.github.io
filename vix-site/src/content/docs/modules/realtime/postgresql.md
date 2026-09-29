# PostgreSQL

Vix Realtime provides PostgreSQL-backed implementations for authoritative events and room snapshots.

```text
PostgresEventStore
    durable event history

PostgresSnapshotStore
    durable recovery checkpoints
```

Unlike the default memory stores, PostgreSQL data survives process restarts.

## Enable PostgreSQL support

PostgreSQL support is disabled by default.

Enable it when building the Realtime module:

```bash
cmake -S . -B build \
  -DVIX_REALTIME_WITH_POSTGRES=ON
```

Then build normally:

```bash
cmake --build build
```

The build requires PostgreSQL `libpq`.

The option controls whether the PostgreSQL implementations are compiled into Realtime.

## Check PostgreSQL support

At runtime, support can be checked with:

```cpp
if (vix::realtime::PostgresEventStore::
        compiled_with_postgres())
{
    // PostgreSQL support is available.
}
```

The snapshot store provides the same check:

```cpp
vix::realtime::PostgresSnapshotStore::
    compiled_with_postgres();
```

Constructing either PostgreSQL store when Realtime was built without PostgreSQL support throws `ErrorCode::MissingDependency`.

## Connection string

Both stores use a standard PostgreSQL `libpq` connection string.

For example:

```text
host=localhost dbname=myapp user=postgres password=secret
```

A simple event store can be created with:

```cpp
auto events =
    std::make_shared<
        vix::realtime::PostgresEventStore>(
            "host=localhost dbname=myapp user=postgres");
```

A snapshot store is created the same way:

```cpp
auto snapshots =
    std::make_shared<
        vix::realtime::PostgresSnapshotStore>(
            "host=localhost dbname=myapp user=postgres");
```

The connection string cannot be empty.

## Event store

`PostgresEventStore` implements the normal `EventStore` interface.

```text
append()
append_batch()
load_after()
latest_event_id()
count()
clear_room()
```

Code using `EventStore` does not need different replay or room logic when moving from memory to PostgreSQL.

## Event store options

For more control, use `PostgresEventStoreOptions`:

```cpp
vix::realtime::PostgresEventStoreOptions options;

options.connectionString =
    "host=localhost dbname=myapp user=postgres";

auto events =
    std::make_shared<
        vix::realtime::PostgresEventStore>(
            options);
```

The defaults are:

| Option                  | Default                 |
| ----------------------- | ----------------------- |
| `schema`                | `"public"`              |
| `table`                 | `"vix_realtime_events"` |
| `createSchemaIfMissing` | `false`                 |
| `createTableIfMissing`  | `true`                  |
| `reconnect`             | `true`                  |

## Event table creation

By default, Realtime creates the event table when it does not exist:

```cpp
options.createTableIfMissing = true;
```

The default table name is:

```text
vix_realtime_events
```

The configured PostgreSQL schema itself is not created by default.

To allow Realtime to create it:

```cpp
options.schema = "realtime";
options.createSchemaIfMissing = true;
```

## Custom event table

A custom table can be configured:

```cpp
options.table = "room_events";
```

Schema and table names must be valid PostgreSQL-style identifiers accepted by Realtime.

For example:

```text
realtime
room_events
events_2026
```

are valid.

Names containing characters such as `-` or `.` are rejected by configuration validation.

## Persistent event ordering

`PostgresEventStore` preserves event ordering independently for each room.

```text
room-1

EventId 1
EventId 2
EventId 3
```

The database table enforces uniqueness for:

```text
(room_id, event_id)
```

and:

```text
(room_id, room_version)
```

This prevents duplicate event positions or room versions from being stored for the same room.

## Atomic event batches

When one command produces several events, Realtime persists them through:

```cpp
append_batch();
```

The PostgreSQL implementation performs the batch inside a transaction.

```text
BEGIN
  event 1
  event 2
  event 3
COMMIT
```

If the operation fails, the transaction is rolled back.

The complete event batch is therefore committed together.

## Multiple runtime processes

`PostgresEventStore` uses a PostgreSQL transaction advisory lock for each room while appending events.

Conceptually:

```text
Process A ──┐
            |
            v
        Room stream
            ^
            |
Process B ──┘
```

Only one append transaction can assign the next positions for that room at a time.

This preserves contiguous event IDs and room versions when multiple runtime processes use the same event table.

The database remains the coordination point for persisted event positions.

## Snapshot store

`PostgresSnapshotStore` implements the normal `SnapshotStore` interface.

It supports:

```text
save()
load_latest()
load_at_or_before()
load_recent()
count()
prune()
clear_room()
```

Create one with:

```cpp
auto snapshots =
    std::make_shared<
        vix::realtime::PostgresSnapshotStore>(
            "host=localhost dbname=myapp user=postgres");
```

## Snapshot store options

Use `PostgresSnapshotStoreOptions` for custom configuration:

```cpp
vix::realtime::PostgresSnapshotStoreOptions options;

options.connectionString =
    "host=localhost dbname=myapp user=postgres";

auto snapshots =
    std::make_shared<
        vix::realtime::PostgresSnapshotStore>(
            options);
```

The defaults are:

| Option                  | Default                    |
| ----------------------- | -------------------------- |
| `schema`                | `"public"`                 |
| `table`                 | `"vix_realtime_snapshots"` |
| `createSchemaIfMissing` | `false`                    |
| `createTableIfMissing`  | `true`                     |
| `reconnect`             | `true`                     |

The default snapshot table is:

```text
vix_realtime_snapshots
```

## Snapshot identity

Snapshots are uniquely identified by:

```text
room ID
+
room version
```

For example:

```text
room-1
version 42
```

can have only one stored snapshot position.

Saving the same room version again is allowed only when the existing and replacement snapshots reference the same `last_event_id`.

A conflicting position is rejected.

## Use PostgreSQL with Realtime

Create both stores:

```cpp
auto events =
    std::make_shared<
        vix::realtime::PostgresEventStore>(
            connectionString);

auto snapshots =
    std::make_shared<
        vix::realtime::PostgresSnapshotStore>(
            connectionString);
```

Then provide them to `RoomManager`:

```cpp
vix::realtime::Config config;

auto manager =
    std::make_shared<vix::realtime::RoomManager>(
        vix::realtime::NodeId{"node-1"},
        config,
        events,
        snapshots,
        std::make_shared<
            vix::realtime::LocalPresenceStore>(),
        std::make_shared<
            vix::realtime::RoomDirectory>());

vix::realtime::Server server{manager};
```

Rooms managed by this server now use PostgreSQL for events and snapshots.

Application room handlers and states do not need to change.

## Events survive restart

With PostgreSQL event storage:

```text
process A
   |
   v
persist events
   |
   v
PostgreSQL

process stops

process B
   |
   v
open room
   |
   v
load events
```

When `restoreRoomsOnOpen` is enabled, the new runtime can reconstruct the room from its persisted history.

## Snapshots survive restart

Snapshots are durable in the same way:

```text
PostgreSQL snapshot
       |
process restarts
       |
       v
restore snapshot
       |
       v
replay later events
       |
       v
current RoomState
```

See [Replay and Recovery](./replay-and-recovery) for the complete restoration process.

## Connection health

Both PostgreSQL stores provide:

```cpp
bool healthy =
    events->ping();
```

and:

```cpp
bool healthy =
    snapshots->ping();
```

`ping()` returns `true` when PostgreSQL responds successfully.

It returns `false` when the connection cannot be used.

## Reconnection

Automatic connection reset is enabled by default:

```cpp
options.reconnect = true;
```

If the owned PostgreSQL connection enters a failed state, the store attempts to reset it before the next operation.

Disable this behavior with:

```cpp
options.reconnect = false;
```

With reconnection disabled, an unavailable connection causes the operation to fail.

## One connection per store

Each PostgreSQL store instance owns one `libpq` connection.

Operations on that store instance are serialized.

```text
PostgresEventStore
       |
       v
one libpq connection
```

The same applies to `PostgresSnapshotStore`.

Applications that require more database concurrency can use multiple store instances or place a connection-pool adapter behind the persistence interface.

## Failure behavior

Database failures are reported through Realtime errors.

Event-store failures use:

```text
EventStoreFailure
```

Snapshot-store failures use:

```text
SnapshotStoreFailure
```

For authoritative commands, an event-store failure prevents the room from applying the new events to its state.

```text
database append fails
        |
        v
event not committed
        |
        v
state not advanced
```

This preserves the rule that authoritative events are persisted before state application.

## Event store vs snapshot store

The two PostgreSQL stores have different responsibilities:

```text
PostgresEventStore
    authoritative history
    required for durable event recovery

PostgresSnapshotStore
    recovery checkpoints
    optional optimization
```

A room can use PostgreSQL events without PostgreSQL snapshots.

When both are configured, recovery can restore a recent snapshot and replay only the events that followed it.

Continue with [Protocol](./protocol) for the messages exchanged between Realtime and transport integrations.
