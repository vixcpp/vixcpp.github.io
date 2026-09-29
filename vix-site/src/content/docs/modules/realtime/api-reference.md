# API Reference

This page summarizes the public C++ API of Vix Realtime.

For normal use, include the umbrella header:

```cpp
#include <vix/realtime.hpp>
```

and link:

```cmake
vix::realtime
```

The public API is in:

```cpp
namespace vix::realtime
```

Protocol types use:

```cpp
namespace vix::realtime::protocol
```

Detailed behavior is covered by the dedicated Realtime guides. This page is intended as a compact reference.

## Version

Current module version:

```text
0.1.0
```

Compile-time values:

```cpp
vix::realtime::version_major
vix::realtime::version_minor
vix::realtime::version_patch
vix::realtime::version
```

Compatibility check:

```cpp
vix::realtime::version_compatible(0, 1);
```

Version macros:

```text
VIX_REALTIME_VERSION_MAJOR
VIX_REALTIME_VERSION_MINOR
VIX_REALTIME_VERSION_PATCH
VIX_REALTIME_VERSION_STRING
```

## Common types

Realtime defines these common aliases:

| Type              | Meaning                          |
| ----------------- | -------------------------------- |
| `JsonObject`      | Realtime JSON object             |
| `VersionValue`    | Numeric room-version value       |
| `EventIdValue`    | Numeric event identifier value   |
| `SystemClock`     | System clock                     |
| `SteadyClock`     | Steady clock                     |
| `Timestamp`       | System-clock timestamp           |
| `SteadyTimestamp` | Steady-clock timestamp           |
| `Identity`        | Application identity string      |
| `ConnectionId`    | Transport connection identifier  |
| `CorrelationId`   | Operation correlation identifier |
| `RequestId`       | Request identifier               |
| `ResumeToken`     | Session resume credential        |
| `SchemaVersion`   | Application state schema version |

## Identifiers

### `RoomId`

Identifies one logical room.

```cpp
vix::realtime::RoomId roomId{"room-1"};
```

Important members:

```text
value()
view()
empty()
size()
is_valid()
validate()
```

Maximum length:

```text
128
```

`RoomId` supports equality, ordering, and `std::hash`.

### `SessionId`

Identifies one logical session.

```cpp
vix::realtime::SessionId sessionId{
    "session-1"};
```

Important members:

```text
value()
view()
empty()
size()
is_valid()
validate()
```

Maximum length:

```text
128
```

`SessionId` supports equality, ordering, and `std::hash`.

### `NodeId`

Identifies one Realtime runtime node.

```cpp
vix::realtime::NodeId nodeId{"node-1"};
```

Important members:

```text
value()
view()
empty()
size()
is_valid()
validate()
```

Maximum length:

```text
128
```

`NodeId` supports equality, ordering, and `std::hash`.

### `RoomVersion`

Represents the logical version of authoritative room state.

```cpp
vix::realtime::RoomVersion version{3};
```

Important members:

```text
value()
is_initial()
next()
increment()
```

Initial value:

```text
0
```

### `EventId`

Represents one persistent position in a room event stream.

```cpp
vix::realtime::EventId eventId{3};
```

Important members:

```text
value()
empty()
next()
increment()
```

Empty value:

```text
0
```

Persistent event identifiers normally begin at `1`.

## Errors

### `ErrorCode`

Realtime error codes include:

```text
None
InvalidConfiguration
MissingDependency

RoomNotFound
RoomAlreadyExists
RoomFull
RoomLimitReached
RoomNotReady
RoomClosed

CommandQueueFull
InvalidCommand
CommandRejected
CommandTimeout
Unauthorized

SessionNotFound
SessionExpired
InvalidResumeToken
ConnectionNotAttached
MembershipNotFound
AlreadyJoined

InvalidProtocolMessage
UnsupportedProtocolVersion
PayloadTooLarge

EventStoreFailure
SnapshotStoreFailure
CorruptedState
EventApplyFailure

ReplayUnavailable
ReplayLimitExceeded

TransportFailure
Cancelled
Timeout
InternalError

SessionAlreadyConnected
SessionNotDetached
```

Convert a code to its stable textual form with:

```cpp
vix::realtime::to_string(code);
```

### `Error`

Realtime exceptions use:

```cpp
vix::realtime::Error
```

Important members:

```text
code()
what()
```

Example:

```cpp
catch (const vix::realtime::Error &error)
{
    auto code = error.code();
}
```

See [Errors](./errors).

## Configuration

### `Config`

Runtime configuration:

```cpp
vix::realtime::Config config;
```

Public fields:

```text
maxActiveRooms
maxSessions
maxSessionsPerRoom
maxRoomsPerSession
maxPendingCommandsPerRoom

maxReplayEvents
maxReplayBytes
maxResumeRooms

snapshotEveryEvents
snapshotsToKeep

roomIdleTimeout
sessionResumeWindow
presenceTimeout
replayTimeout

snapshotOnRoomClose
restoreRoomsOnOpen
enableSessionResume
enablePresence
```

Important operations:

```text
Config::from_core()
validate()
```

See [Configuration](./configuration).

## Server

### `ServerStatus`

```text
Created
Running
Stopping
Stopped
Failed
```

### `Server`

Main public Realtime facade.

```cpp
vix::realtime::Server server{
    vix::realtime::NodeId{"node-1"}};
```

Lifecycle:

```text
start()
stop()
status()
running()
stopped()
```

Room operations:

```text
register_factory()
unregister_factory()

open_room()
close_room()
find_room()
```

Session operations:

```text
create_session()
find_session()
connect()
disconnect()
close_session()
```

Membership:

```text
join_room()
leave_room()
```

Commands:

```text
execute()
enqueue()
process_next()
```

Messaging:

```text
send()
```

Cleanup:

```text
prune_expired_sessions()
prune_stale_presence()
```

Runtime access:

```text
manager()
node_id()
config()
```

Pointer alias:

```cpp
vix::realtime::ServerPtr
```

See [Server](./server).

## Rooms

### `RoomStatus`

```text
Created
Opening
Open
Closing
Closed
Failed
```

### `Room`

Represents one authoritative room runtime.

Lifecycle:

```text
open()
close()
status()
is_open()
is_closed()
failed()
```

Commands:

```text
execute()
command()
process_command()
execute_command()

enqueue()
process_next()
pending_command_count()
```

Membership:

```text
join()
join_session()
add_session()
add_member()
leave()

has_session()
sessions()
session_count()
member_count()
empty()
```

State and position:

```text
state()
serialize_state()
version()
last_event_id()
```

Events:

```text
broadcast()
broadcast_event()
publish_event()
emit()
```

Snapshots:

```text
snapshot()
```

Other state:

```text
id()
type()
config()
last_activity_at()

owner_node_id()
set_owner_node_id()
clear_owner_node_id()

metadata()
set_metadata()
```

Pointer aliases:

```cpp
vix::realtime::RoomPtr
vix::realtime::WeakRoomPtr
```

See [Rooms](./rooms).

## Room state

### `RoomState`

Application-defined authoritative room state.

Required interface:

```cpp
class State : public vix::realtime::RoomState
{
public:
    vix::realtime::SchemaVersion
    schema_version() const noexcept override;

    void apply(
        const vix::realtime::RoomEvent &) override;

    vix::realtime::JsonObject
    serialize() const override;

    void restore(
        const vix::realtime::JsonObject &,
        vix::realtime::SchemaVersion) override;

    std::unique_ptr<vix::realtime::RoomState>
    clone() const override;
};
```

Pointer alias:

```cpp
vix::realtime::RoomStatePtr
```

See [Room State](./room-state).

## Room context

### `RoomContext`

Immutable information supplied to application room handlers.

Important accessors:

```text
room_id()
room_version()
last_event_id()

next_room_version()
next_event_id()

session_id()
request_id()
correlation_id()
node_id()

now()
metadata()

is_valid()
validate()
```

## Room handlers

### `RoomHandler`

Application behavior for one room type.

Required command callback:

```text
handle_command()
```

Lifecycle callbacks:

```text
on_open()
on_join()
on_leave()
on_close()
```

Lifecycle callbacks have default implementations that return an accepted result.

Pointer alias:

```cpp
vix::realtime::RoomHandlerPtr
```

See [Room Handlers](./room-handlers).

## Room factories

### `RoomComponents`

Contains:

```text
state
handler
```

Operations:

```text
is_valid()
validate()
```

### `RoomFactory`

Creates state and handlers for one application room type.

Required interface:

```text
room_type()
create_state()
create_handler()
```

Convenience operation:

```text
create()
```

Validation helper:

```text
is_valid_type()
```

Maximum room type length:

```text
128
```

Pointer alias:

```cpp
vix::realtime::RoomFactoryPtr
```

## Commands

### `RoomCommand`

Represents client intent.

Basic construction:

```cpp
vix::realtime::RoomCommand command{
    roomId,
    sessionId,
    "counter.increment"};
```

Accessors:

```text
room_id()
session_id()
type()
payload()

request_id()
correlation_id()
expected_version()

created_at()
metadata()
```

Modifiers:

```text
set_correlation_id()
set_expected_version()
clear_expected_version()
set_created_at()
set_metadata()
```

Validation:

```text
is_valid()
validate()
is_valid_type()
```

Maximum command type length:

```text
128
```

See [Commands and Results](./commands-and-results).

## Command results

### `CommandStatus`

```text
Accepted
Rejected
Ignored
```

### `CommandResult`

Factory methods:

```text
accepted()
rejected()
ignored()
```

Inspection:

```text
status()

is_accepted()
is_rejected()
is_ignored()

has_events()
event_count()
events()

error_code()
message()
metadata()
```

Modification:

```text
add_event()
set_message()
set_metadata()
```

Validation:

```text
is_valid()
validate()
```

See [Commands and Results](./commands-and-results).

## Command queue status

### `CommandQueueStatus`

```text
Success
Full
Empty
Closed
Timeout
```

Convert to text with:

```cpp
vix::realtime::to_string(status);
```

## Events

### `EventAudience`

```text
Room
Sender
Others
Session
Internal
```

See [Events](./events) for recipient semantics.

### `RoomEvent`

Represents one authoritative room fact.

Accessors:

```text
event_id()
room_id()
room_version()

type()
payload()
audience()

target_session()
source_session()

request_id()
correlation_id()

schema_version()
created_at()
metadata()
```

Modifiers:

```text
set_event_id()
set_room_version()

set_audience()

set_target_session()
clear_target_session()

set_source_session()
clear_source_session()

set_request_id()
set_correlation_id()

set_schema_version()
set_created_at()
set_metadata()
```

Validation:

```text
is_valid()
validate()
is_valid_type()
```

Maximum event type length:

```text
128
```

See [Events](./events).

## Room snapshots

### `RoomSnapshot`

Represents one serialized room-state checkpoint.

Accessors:

```text
room_id()
room_version()
last_event_id()

state()
schema_version()
created_at()

checksum()
metadata()
```

Modifiers:

```text
set_room_version()
set_last_event_id()
set_schema_version()
set_created_at()

set_checksum()
clear_checksum()

set_metadata()
```

Validation:

```text
is_valid()
validate()
```

See [Snapshots](./snapshots).

## Event stores

### `EventStore`

Abstract authoritative event persistence interface.

Required operations:

```text
append()
append_batch()
load_after()
latest_event_id()
count()
clear_room()
```

Pointer alias:

```cpp
vix::realtime::EventStorePtr
```

### `MemoryEventStore`

Thread-safe process-memory implementation of `EventStore`.

Additional operations:

```text
clear()
room_count()
```

See [Event Store](./event-store).

## Snapshot stores

### `SnapshotStore`

Abstract snapshot persistence interface.

Required operations:

```text
save()
load_latest()
load_at_or_before()
load_recent()
count()
prune()
clear_room()
```

Pointer alias:

```cpp
vix::realtime::SnapshotStorePtr
```

### `MemorySnapshotStore`

Thread-safe process-memory implementation.

Additional operations:

```text
clear()
room_count()
```

See [Snapshots](./snapshots).

## Sessions

### `SessionStatus`

```text
Connected
Detached
Closed
```

Compatibility alias:

```cpp
vix::realtime::SessionState
```

### `Session`

Represents one logical client.

Identity:

```text
id()
identity()
```

Lifecycle:

```text
status()
connected()
detached()
closed()
close()
```

Connections:

```text
attach()
detach()
connection()
connection_id()
```

Membership:

```text
join_room()
leave_room()
has_room()
rooms()
room_count()
```

Recovery positions:

```text
acknowledge()
last_event_id()
```

Resume state:

```text
resume_token()
set_resume_token()
clear_resume_token()
can_resume()
```

Activity:

```text
created_at()
last_seen_at()
detached_at()
touch()
```

Messaging:

```text
send()
```

Metadata:

```text
metadata()
set_metadata()
```

Pointer aliases:

```cpp
vix::realtime::SessionPtr
vix::realtime::WeakSessionPtr
```

See [Sessions](./sessions).

## Connections

### `Connection`

Transport-independent client connection interface.

Required operations:

```text
id()
is_open()
send()
close()
```

Optional metadata:

```text
metadata()
```

Pointer aliases:

```cpp
vix::realtime::ConnectionPtr
vix::realtime::WeakConnectionPtr
```

See [Connections](./connections).

## Session resume

### `SessionResumeResult`

Contains:

```text
session
replacedConnection
resumeToken
tokenRotated
```

It can be checked with:

```text
success()
```

### `SessionResume`

Session reconnection and recovery service.

Token operations:

```text
issue()
rotate()
revoke()
matches()
```

Eligibility:

```text
can_resume()
```

Resume:

```text
resume()
```

Runtime information:

```text
resume_window()
manager()
```

Pointer alias:

```cpp
vix::realtime::SessionResumePtr
```

See [Session Resume](./session-resume).

## Presence

### `PresenceStatus`

```text
Present
Detached
Left
```

### `Presence`

Represents one logical session's presence in one room.

Identity:

```text
room_id()
session_id()
identity()
```

Placement:

```text
node_id()
connection_id()
```

Status:

```text
status()
logically_present()
connected()
detached()
left()
```

Timestamps:

```text
joined_at()
last_seen_at()
detached_at()
left_at()
```

Lifecycle modifiers include operations for:

```text
touching activity
marking present
marking detached
marking left
updating node information
updating connection information
```

Metadata:

```text
metadata()
set_metadata()
```

Validation:

```text
is_valid()
validate()
```

See [Presence](./presence).

## Presence stores

### `PresenceStore`

Abstract presence persistence interface.

Operations include:

```text
upsert()
find()

touch()
mark_present()
mark_detached()
mark_left()

list_room()
list_session()

erase()
prune_stale()

count_room()
count()

clear_room()
clear_session()
```

Pointer alias:

```cpp
vix::realtime::PresenceStorePtr
```

### `LocalPresenceStore`

Thread-safe process-local implementation.

Additional helpers include:

```text
prune_expired()
clear()
room_count()
```

See [Presence](./presence).

## Distributed presence

### `DistributedPresenceStatus`

```text
Healthy
Degraded
Unavailable
```

### `DistributedPresenceNode`

Contains:

```text
nodeId
lastSeen
local
metadata
```

It also provides stale-node evaluation.

### `DistributedPresence`

Extends `PresenceStore` with multi-node coordination operations.

Important operations:

```text
local_node_id()
heartbeat()

find_node()
nodes()
active_nodes()
node_active()

prune_stale_nodes()
clear_node()

distributed_status()
ping()
```

Pointer alias:

```cpp
vix::realtime::DistributedPresencePtr
```

Realtime currently defines this interface but does not provide a concrete distributed backend.

See [Distributed Presence](./distributed-presence).

## Room ownership

### `RoomOwnerGeneration`

```cpp
using RoomOwnerGeneration = std::uint64_t;
```

### `RoomOwnerStatus`

```text
Active
Releasing
Released
```

### `RoomOwner`

Represents an ownership claim and exposes information including:

```text
room_id()
node_id()
generation()
status()

acquired_at()
renewed_at()
expires_at()
released_at()

has_lease()
expired()
active()
```

It also provides ownership lifecycle operations used by room coordination.

Metadata:

```text
metadata()
set_metadata()
```

Validation:

```text
is_valid()
validate()
```

See [Room Ownership](./room-ownership).

### `RoomDirectory`

Process-local room ownership directory.

Ownership operations include:

```text
acquire()
renew()
make_permanent()

begin_release()
release()
transfer()

resolve()
inspect()

owns()
matches()

latest_generation()
active_owners()
owned_by()

prune_expired()
```

The directory also keeps local room registrations used by `RoomManager`.

See [Room Ownership](./room-ownership).

## Room manager

### `RoomManager`

Process-local coordinator for rooms, sessions, membership, presence, and ownership.

Factories:

```text
register_factory()
unregister_factory()
find_factory()
has_factory()
factory_types()
```

Rooms:

```text
open_room()
open()
get_or_open_room()

close_room()

find_room()
require_room()
has_room()

room_ids()
room_count()
```

Sessions:

```text
create_session()

find_session()
require_session()
has_session()

session_ids()
session_count()

close_session()
```

Connections:

```text
attach_connection()
detach_connection()
```

Membership:

```text
join_room()
leave_room()
```

Commands:

```text
execute()
enqueue()
process_next()
```

Presence:

```text
find_presence()
room_presence()
```

Cleanup:

```text
cleanup()
cleanup_inactive()
shutdown()
```

Dependencies:

```text
event_store()
snapshot_store()
presence_store()
room_directory()
```

Runtime information:

```text
node_id()
config()
```

Pointer alias:

```cpp
vix::realtime::RoomManagerPtr
```

See [Room Manager](./room-manager).

## Protocol

Protocol types are in:

```cpp
vix::realtime::protocol
```

### `protocol::Version`

Fields:

```text
major
minor
```

Check compatibility with:

```cpp
protocol::is_supported(version);
```

Current protocol:

```text
1.0
```

### `protocol::MessageKind`

```text
Request
Response
Event
Error
Snapshot
Control
```

Compatibility alias:

```text
Command = Request
```

Helpers:

```text
is_valid()
to_string()
parse_message_kind()
```

### `protocol::Envelope`

Core accessors:

```text
version()
kind()
type()
payload()

message_id()
request_id()
correlation_id()

room_id()
session_id()

room_version()
event_id()
schema_version()

created_at()
metadata()
```

The class also provides setters for the optional identifiers and metadata.

Validation:

```text
is_valid()
validate()
is_valid_type()
```

Protocol conversion helpers include:

```text
from_command()
from_event()
from_snapshot()
make_error()
```

Serialization:

```text
serialize()
parse()
```

See [Protocol](./protocol).

## Transport

Callback aliases:

```text
TransportOpenHandler
TransportEnvelopeHandler
TransportCloseHandler
TransportErrorHandler
```

### `TransportHandlers`

Callbacks:

```text
onOpen
onEnvelope
onClose
onError
```

Helper:

```text
empty()
```

### `Transport`

Abstract network adapter interface.

Required operations:

```text
set_handlers()
handlers()

attach()
detach()
attached()

connection_count()
```

Pointer alias:

```cpp
vix::realtime::TransportPtr
```

See [Transport](./transport).

## WebSocket adapter

Available when:

```text
VIX_REALTIME_WITH_WEBSOCKET
```

is enabled.

### `WebSocketAdapterOptions`

Fields:

```text
maxMessageSize
closeOnProtocolError
connectionIdPrefix
```

Validation:

```text
validate()
```

Defaults:

```text
maxMessageSize       = 64 KiB
closeOnProtocolError = true
connectionIdPrefix   = "ws"
```

### `WebSocketAdapter`

Implements `Transport`.

Transport operations:

```text
set_handlers()
handlers()

attach()
detach()
attached()

connection_count()
```

Connection access:

```text
find_connection()
connections()
```

Adapter information:

```text
websocket_server()
options()
```

Pointer alias:

```cpp
vix::realtime::WebSocketAdapterPtr
```

See [WebSocket Integration](./websocket-integration).

## PostgreSQL event store

PostgreSQL support is compiled when:

```text
VIX_REALTIME_WITH_POSTGRES
```

is enabled.

### `PostgresEventStoreOptions`

Fields:

```text
connectionString
schema
table
createSchemaIfMissing
createTableIfMissing
reconnect
```

Defaults:

```text
schema                = public
table                 = vix_realtime_events
createSchemaIfMissing = false
createTableIfMissing  = true
reconnect             = true
```

Validation:

```text
validate()
```

### `PostgresEventStore`

Implements `EventStore`.

Operations:

```text
append()
append_batch()
load_after()
latest_event_id()
count()
clear_room()
```

PostgreSQL-specific operations:

```text
ping()
options()
compiled_with_postgres()
```

Pointer alias:

```cpp
vix::realtime::PostgresEventStorePtr
```

See [PostgreSQL](./postgresql).

## PostgreSQL snapshot store

### `PostgresSnapshotStoreOptions`

Fields:

```text
connectionString
schema
table
createSchemaIfMissing
createTableIfMissing
reconnect
```

Defaults:

```text
schema                = public
table                 = vix_realtime_snapshots
createSchemaIfMissing = false
createTableIfMissing  = true
reconnect             = true
```

Validation:

```text
validate()
```

### `PostgresSnapshotStore`

Implements `SnapshotStore`.

Operations:

```text
save()
load_latest()
load_at_or_before()
load_recent()
count()
prune()
clear_room()
```

PostgreSQL-specific operations:

```text
ping()
options()
compiled_with_postgres()
```

Pointer alias:

```cpp
vix::realtime::PostgresSnapshotStorePtr
```

See [PostgreSQL](./postgresql).

## Metrics

### `MetricsSnapshot`

Contains point-in-time counters, gauges, and duration aggregates for:

```text
rooms
sessions
connections
commands
events
snapshots
replay
resume
presence
transport
protocol errors
runtime errors
```

Convenience calculations include:

```text
average_command_duration()
maximum_command_duration()

average_snapshot_duration()
maximum_snapshot_duration()

average_replay_duration()
maximum_replay_duration()

event_delivery_success_rate()
resume_success_rate()

has_errors()
```

### `Metrics`

Thread-safe explicit metrics collector.

Gauge operations cover:

```text
active rooms
active sessions
attached connections
queued commands
active presence
```

Recording operations cover:

```text
room lifecycle
session lifecycle
connection lifecycle
commands
event persistence
event dispatch
snapshots
replay
session resume
presence
transport traffic
protocol errors
runtime errors
```

Read current values with:

```text
snapshot()
```

Reset the collector with:

```text
reset()
```

Pointer alias:

```cpp
vix::realtime::MetricsPtr
```

See [Metrics](./metrics).

## Health

### `HealthStatus`

```text
Healthy
Degraded
Unhealthy
Stopped
```

### `HealthOptions`

Fields:

```text
requireSnapshotStore
requirePresenceStoreWhenEnabled
degradeOnDetachedSessions

maxQueuedCommands
recordedErrorTolerance
protocolErrorTolerance
```

### `HealthReport`

Contains:

```text
status
checkedAt
nodeId
serverStatus

room counts
ownership count
queued command count

session counts
presence count

store availability
presence availability
room-directory availability
metrics availability

metrics
issues
```

Helpers:

```text
healthy()
operational()
has_issues()
```

### `HealthMonitor`

Create from a server:

```cpp
vix::realtime::HealthMonitor monitor{
    server};
```

Operations:

```text
check()
server()
metrics()
options()
```

Pointer alias:

```cpp
vix::realtime::HealthMonitorPtr
```

See [Health](./health).

## Public headers

The public Realtime headers are:

```text
vix/realtime.hpp

vix/realtime/api.hpp
vix/realtime/realtime.hpp
vix/realtime/version.hpp
vix/realtime/types.hpp
vix/realtime/errors.hpp
vix/realtime/config.hpp

vix/realtime/room_id.hpp
vix/realtime/session_id.hpp
vix/realtime/node_id.hpp
vix/realtime/room_version.hpp
vix/realtime/event_id.hpp

vix/realtime/room_command.hpp
vix/realtime/command_result.hpp
vix/realtime/command_queue_status.hpp
vix/realtime/room_event.hpp
vix/realtime/event_audience.hpp
vix/realtime/room_snapshot.hpp

vix/realtime/room_state.hpp
vix/realtime/room_context.hpp
vix/realtime/room_handler.hpp
vix/realtime/room_factory.hpp

vix/realtime/room.hpp
vix/realtime/room_manager.hpp
vix/realtime/server.hpp

vix/realtime/connection.hpp
vix/realtime/session.hpp
vix/realtime/session_resume.hpp

vix/realtime/presence.hpp
vix/realtime/presence_store.hpp
vix/realtime/local_presence_store.hpp
vix/realtime/distributed_presence.hpp

vix/realtime/event_store.hpp
vix/realtime/memory_event_store.hpp
vix/realtime/snapshot_store.hpp
vix/realtime/memory_snapshot_store.hpp

vix/realtime/room_owner.hpp
vix/realtime/room_directory.hpp

vix/realtime/protocol.hpp
vix/realtime/transport.hpp
vix/realtime/websocket_adapter.hpp

vix/realtime/postgres_event_store.hpp
vix/realtime/postgres_snapshot_store.hpp

vix/realtime/metrics.hpp
vix/realtime/health.hpp
```

Headers under:

```text
vix/realtime/internal/
```

are implementation details and are not part of the stable public API.

## Pointer aliases

Common ownership aliases include:

```text
RoomPtr
WeakRoomPtr

SessionPtr
WeakSessionPtr

ConnectionPtr
WeakConnectionPtr

RoomManagerPtr
ServerPtr

RoomStatePtr
RoomHandlerPtr
RoomFactoryPtr

EventStorePtr
SnapshotStorePtr
PresenceStorePtr
DistributedPresencePtr

TransportPtr
WebSocketAdapterPtr

SessionResumePtr

PostgresEventStorePtr
PostgresSnapshotStorePtr

MetricsPtr
HealthMonitorPtr
```

Use the public aliases where they make ownership intent clearer.

## Main API relationships

The primary public types fit together as:

```text
Server
  |
  v
RoomManager
  |
  +---- RoomFactory
  |       |
  |       +---- RoomState
  |       +---- RoomHandler
  |
  +---- Room
  |       |
  |       +---- RoomCommand
  |       +---- CommandResult
  |       +---- RoomEvent
  |
  +---- Session
  |       |
  |       +---- Connection
  |
  +---- EventStore
  +---- SnapshotStore
  +---- PresenceStore
  +---- RoomDirectory
```

Transport integration remains separate:

```text
Transport
   |
   v
Connection + protocol::Envelope
   |
   v
application integration
   |
   v
Server
```

The stable application model is:

```text
RoomCommand
    |
    v
RoomHandler
    |
    v
CommandResult
    |
    v
RoomEvent
    |
    v
EventStore
    |
    v
RoomState
```

For a first application, start with [Quick Start](./quick-start). For the behavioral model behind these types, see [Core Concepts](./core-concepts).
