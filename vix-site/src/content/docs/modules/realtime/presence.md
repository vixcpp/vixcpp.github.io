# Presence

Presence describes whether a logical session is currently participating in a room.

It is separate from authoritative `RoomState`.

```text
RoomState
    application state

Presence
    session participation
```

Examples of presence information include whether a session is connected, temporarily detached, or has left the room.

## Presence states

A presence record has three states:

```text
Present
Detached
Left
```

The normal lifecycle is:

```text
Present
   |
disconnect
   v
Detached
   |
reconnect
   v
Present
```

When the session permanently leaves the room:

```text
Present or Detached
        |
        v
       Left
```

## Read room presence

Presence is normally managed automatically by `RoomManager`.

List the current presence records for a room with:

```cpp
auto records =
    server.manager()->room_presence(
        roomId);
```

Each record represents one logical session in that room.

## Find one presence

Find the presence of one session with:

```cpp
auto presence =
    server.manager()->find_presence(
        roomId,
        sessionId);
```

The result is optional:

```cpp
if (presence)
{
    auto status = presence->status();
}
```

## Present

`Present` means the logical session is currently present in the room.

Check it with:

```cpp
if (presence->status() ==
    vix::realtime::PresenceStatus::Present)
{
    // Present in the room.
}
```

A present record may also contain an active connection identifier.

Check whether it currently represents an attached connection with:

```cpp
if (presence->connected())
{
    // An active connection ID is available.
}
```

`Present` and `connected()` are not identical. A presence can be logically present without exposing a connection identifier.

## Detached

A detached session remains logically present in the room even though its transport connection has been lost.

```cpp
if (presence->detached())
{
    // Temporarily disconnected.
}
```

Its active connection identifier is cleared.

The room membership remains intact, which allows session resumption to restore the transport connection later.

```text
room membership
      |
      v
   Present
      |
connection lost
      |
      v
   Detached
```

See [Session Resume](./session-resume) for reconnection behavior.

## Left

`Left` means the session permanently left the room.

```cpp
if (presence->left())
{
    // No longer logically present.
}
```

A left presence is no longer considered logically present.

```cpp
presence->logically_present();
```

returns `false` for `Left`.

## Logical presence

Use:

```cpp
bool present =
    presence->logically_present();
```

This returns `true` for:

```text
Present
Detached
```

and `false` for:

```text
Left
```

A temporary network disconnection therefore does not immediately remove the logical participant from the room.

## Join behavior

When a session joins a room through the manager:

```cpp
server.join_room(
    sessionId,
    roomId);
```

Realtime creates a presence record when presence tracking is enabled.

If the session has an active connection, the presence starts as:

```text
Present
```

If the session has no active connection, it starts as:

```text
Detached
```

Presence creation is coordinated with room membership. If the join operation fails, the new presence record is removed.

## Connection attachment

When a connection is attached:

```cpp
server.manager()->attach_connection(
    sessionId,
    connection);
```

Realtime marks the session as present in each room it has joined.

```text
Detached
   |
connection attached
   v
Present
```

The presence record receives the active connection identifier and the local node identifier.

## Connection detachment

When the current connection is detached:

```cpp
server.manager()->detach_connection(
    sessionId,
    connectionId);
```

Realtime marks the session's joined-room presence as detached.

```text
Present
   |
connection detached
   v
Detached
```

The room membership remains unchanged.

## Leave behavior

When a session leaves:

```cpp
server.leave_room(
    sessionId,
    roomId);
```

its presence is marked:

```text
Left
```

A left record can remain stored until it is pruned or explicitly removed.

Normal room presence listings exclude records that have already reached `Left`.

## Presence activity

Each presence record tracks:

```cpp
presence->joined_at();
presence->last_seen_at();
```

For detached records, it also tracks:

```cpp
presence->detached_at();
```

For left records:

```cpp
presence->left_at();
```

These timestamps allow the runtime to distinguish recent presence from stale records.

## Command activity

Executing or enqueueing a command through `RoomManager` updates the presence activity timestamp for that room membership.

For example:

```cpp
server.execute(command);
```

updates the corresponding presence before routing the command to the room.

Presence activity is best-effort runtime information. A presence update failure does not replace the room's authoritative event processing.

## Presence timeout

Stale presence cleanup uses:

```cpp
config.presenceTimeout
```

The default is:

```text
90 seconds
```

A presence becomes stale when its inactivity reaches the configured timeout.

Both present and detached records can become stale.

A `Left` record is always considered stale.

## Remove stale presence

The server can remove stale presence records with:

```cpp
auto removed =
    server.prune_stale_presence();
```

The operation uses the configured `presenceTimeout`.

For example:

```text
last activity
     |
     | presenceTimeout
     v
presence becomes stale
     |
     v
prune_stale_presence()
     |
     v
record removed
```

Cleanup is explicit. Realtime does not start a background presence-cleanup thread.

## Presence store

Presence records are stored through the `PresenceStore` interface.

The default runtime uses:

```cpp
vix::realtime::LocalPresenceStore
```

when presence tracking is enabled.

The configured store is available with:

```cpp
auto store =
    server.manager()->presence_store();
```

It may be null when presence is disabled.

## Disable presence

Presence tracking is enabled by default:

```cpp
config.enablePresence = true;
```

Disable it with:

```cpp
config.enablePresence = false;
```

Rooms, sessions, commands, and authoritative event processing can still operate without a presence store.

Presence is an additional participation model, not the source of authoritative room state.

## PresenceStore operations

A presence store supports operations such as:

```text
upsert
find
touch
mark present
mark detached
mark left
list room
list session
erase
prune stale
```

Most applications should use `Server` and `RoomManager` for normal membership and connection workflows rather than updating the store manually.

This keeps session membership and presence transitions coordinated.

## Presence metadata

Presence can contain application-defined metadata:

```cpp
auto metadata =
    presence->metadata();
```

Metadata is non-authoritative.

It can be used for information associated with a participant, but application state that must survive replay should live in `RoomState` and persisted events.

## Node information

A presence record may contain the node currently reporting it:

```cpp
auto nodeId =
    presence->node_id();
```

The local `RoomManager` records its own `NodeId` when it creates or restores managed presence.

This field supports the presence model used by multi-node coordination, but the default `LocalPresenceStore` remains local to one process.

Distributed presence is covered separately in [Distributed Presence](./distributed-presence).

## Presence and room state

Presence must not be confused with authoritative state.

For example:

```text
authoritative RoomState

score = 10
match = running
document = "hello"
```

belongs in persisted room events and state.

Information such as:

```text
session is connected
session is detached
last activity time
connection ID
```

belongs in presence.

The separation is:

```text
RoomState
    durable application truth
    reconstructed through events

Presence
    runtime participation
    connection-aware
    may expire
```

## Main lifecycle

The normal presence workflow is:

```text
join room
    |
    v
Present or Detached
    |
    +---- connection attaches
    |          |
    |          v
    |       Present
    |
    +---- connection detaches
    |          |
    |          v
    |       Detached
    |
    +---- leave room
               |
               v
              Left
```

Presence tracks the lifecycle of a logical participant without making temporary network state part of the room's authoritative application state.

Continue with [Event Store](./event-store) for how authoritative room events are persisted.
