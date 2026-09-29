# Room Ownership

Room ownership identifies which Realtime node is responsible for operating a logical room.

```text
Room
  |
  v
RoomOwner
  |
  v
NodeId
```

`RoomManager` uses a `RoomDirectory` to coordinate this ownership.

## Automatic ownership

Normal applications do not need to acquire ownership manually.

When a manager opens a room:

```cpp
auto room = manager.open_room(
    vix::realtime::RoomId{"room-1"},
    "counter");
```

the manager acquires ownership for its local node before creating the room.

Conceptually:

```text
open_room()
    |
    v
acquire ownership
    |
    v
create room
    |
    v
open room
```

If room creation or opening fails, the manager releases the ownership claim.

## Room owner

A `RoomOwner` describes one ownership claim.

It contains:

```text
room ID
node ID
generation
status
acquisition time
optional lease expiration
metadata
```

For example:

```cpp
auto owner =
    directory.resolve(
        vix::realtime::RoomId{"room-1"});

if (owner)
{
    const auto &node =
        owner->node_id();
}
```

## Ownership status

An ownership claim has three possible states:

```text
Active
Releasing
Released
```

### Active

An active owner may operate the room.

```cpp
if (owner->status() ==
    vix::realtime::RoomOwnerStatus::Active)
{
    // Ownership is active.
}
```

### Releasing

`Releasing` means the owner is in the process of giving up the room.

A releasing claim is no longer returned by `resolve()`, but it continues to block another acquisition until it is fully released or its lease expires.

### Released

`Released` means the ownership claim has ended.

Released ownership is considered expired and cannot operate the room.

## Resolve an owner

Find the current active owner with:

```cpp
auto owner =
    directory.resolve(roomId);
```

If there is no active owner:

```cpp
owner.has_value(); // false
```

`resolve()` does not return:

```text
expired claims
releasing claims
released claims
```

## Inspect a claim

Use `inspect()` when you need to see the currently stored claim even if it is not active:

```cpp
auto owner =
    directory.inspect(roomId);
```

Unlike `resolve()`, `inspect()` may return a releasing or expired claim.

The distinction is:

```text
resolve()
    active ownership only

inspect()
    currently stored ownership descriptor
```

## Ownership generation

Every ownership claim has a generation:

```cpp
auto generation =
    owner->generation();
```

The generation begins at:

```text
1
```

and increases whenever a new ownership claim replaces an older one.

For example:

```text
node-a owns room
generation 1

ownership released

node-b acquires room
generation 2
```

A later owner cannot reuse an older generation.

## Why generations matter

A node identifier alone is not enough to identify one ownership claim.

Consider:

```text
node-a
generation 1
    |
    v
ownership ends

node-a
generation 2
```

These are two different ownership periods.

Realtime can therefore validate both:

```text
NodeId
+
generation
```

when checking whether an operation belongs to the current ownership claim.

## Check ownership

Check whether a node currently owns a room:

```cpp
bool owns =
    directory.owns(
        roomId,
        nodeId);
```

To verify the complete ownership identity:

```cpp
bool matches =
    directory.matches(
        roomId,
        nodeId,
        generation);
```

`matches()` requires an active claim with the same node and generation.

## Acquire ownership

Ownership can also be acquired directly:

```cpp
vix::realtime::RoomDirectory directory;

auto owner =
    directory.acquire(
        vix::realtime::RoomId{"room-1"},
        vix::realtime::NodeId{"node-1"});
```

Without a lease duration, the ownership does not expire automatically.

Only one unexpired ownership claim can exist for a room.

Attempting to acquire the same room while another valid claim exists fails.

## Release ownership

Release a current ownership claim with:

```cpp
auto released =
    directory.release(
        roomId,
        nodeId,
        generation);
```

The current claim is removed from the directory.

Its generation history remains recorded.

For example:

```text
generation 3
    |
release
    |
    v
no active owner

latest generation remains 3
```

A later acquisition receives generation `4`.

## Latest generation

Read the latest generation observed for a room with:

```cpp
auto generation =
    directory.latest_generation(
        roomId);
```

If the directory has never observed the room:

```text
0
```

is returned.

Generation history remains available after normal release or expired-claim pruning.

## Releasing ownership

A claim can first enter the releasing state:

```cpp
auto owner =
    directory.begin_release(
        roomId,
        nodeId,
        generation);
```

The lifecycle becomes:

```text
Active
   |
   v
Releasing
   |
   v
Released
```

While releasing, `resolve()` no longer reports the claim as an active owner.

Another node still cannot acquire the room until the claim is released or expires.

## Transfer ownership

Ownership can be transferred directly to another node:

```cpp
auto next =
    directory.transfer(
        roomId,
        currentNode,
        currentGeneration,
        vix::realtime::NodeId{"node-2"});
```

Transfer creates a new active claim with the next generation.

For example:

```text
node-1
generation 4
    |
    v
transfer
    |
    v
node-2
generation 5
```

The transfer replaces the current owner atomically inside the local directory.

## Ownership leases

Ownership can optionally expire after a configured duration.

For example:

```cpp
auto owner =
    directory.acquire(
        roomId,
        nodeId,
        std::chrono::seconds{30});
```

This creates a lease:

```text
acquired
   |
   | 30 seconds
   v
expires
```

The lease duration must be positive.

## Check for a lease

Use:

```cpp
if (owner.has_lease())
{
    auto expiration =
        owner.expires_at();
}
```

A claim without an expiration timestamp is permanent until explicitly released or transferred.

## Lease expiration

Check whether a claim has expired:

```cpp
bool expired =
    owner.expired(
        vix::realtime::SystemClock::now());
```

An expired claim is no longer considered active.

```text
Active
   |
lease expires
   |
   v
not active
```

`resolve()` therefore stops returning it.

## Renew a lease

An active lease can be renewed:

```cpp
auto renewed =
    directory.renew(
        roomId,
        nodeId,
        generation,
        std::chrono::seconds{30});
```

The new expiration begins from the renewal time.

```text
old expiration
      |
renew
      |
      v
new expiration
```

An expired or inactive claim cannot be renewed.

## Make ownership permanent

A leased claim can be converted into non-expiring ownership:

```cpp
auto owner =
    directory.make_permanent(
        roomId,
        nodeId,
        generation);
```

Its expiration timestamp is removed.

The claim remains active until explicitly released or transferred.

## Remove expired claims

Expired claims can be removed from the directory:

```cpp
auto removed =
    directory.prune_expired();
```

Generation history is preserved.

```text
expired generation 7
        |
        v
prune_expired()
        |
        v
claim removed

latest generation = 7
```

The next acquisition therefore receives generation `8`.

## Ownership metadata

An ownership claim can contain non-authoritative metadata.

```cpp
vix::realtime::JsonObject metadata;
metadata.set_string(
    "region",
    "east");

auto owner =
    directory.acquire(
        roomId,
        nodeId,
        std::nullopt,
        vix::realtime::SystemClock::now(),
        std::move(metadata));
```

Read it with:

```cpp
owner.metadata();
```

Ownership metadata must not be treated as authoritative room state.

Application state that needs persistence and replay belongs in `RoomState` and room events.

## List active owners

Get all active ownership claims with:

```cpp
auto owners =
    directory.active_owners();
```

The results are sorted by room identifier.

To list active rooms owned by one node:

```cpp
auto owners =
    directory.owned_by(nodeId);
```

## RoomManager ownership

`RoomManager` uses its own `NodeId` when opening rooms.

```cpp
const auto &nodeId =
    manager.node_id();
```

The normal relationship is:

```text
RoomManager
    |
    | NodeId
    v
RoomDirectory
    |
    v
RoomOwner
    |
    v
Room
```

When the room closes successfully, the manager releases its ownership claim.

Applications using normal `Server` or `RoomManager` room operations therefore do not need to manage ownership manually.

## Process-local directory

The built-in `RoomDirectory` is process-local.

```text
Process A
    |
    v
RoomDirectory A

Process B
    |
    v
RoomDirectory B
```

These directories do not automatically share ownership information.

The ownership model provides concepts needed for coordination, including:

```text
NodeId
generation
leases
transfer
renewal
release
```

but the built-in directory is not a distributed cluster coordinator.

Applications that need ownership shared across multiple machines require an external coordination implementation that preserves the same ownership rules.

## Main model

The important ownership relationship is:

```text
RoomId
   |
   v
RoomOwner
   |
   +---- NodeId
   +---- Generation
   +---- Status
   +---- Optional lease
```

For normal single-process Realtime use, `RoomManager` handles this automatically.

The generation and lease model provides the ownership semantics required for safer coordination when ownership changes over time.

Continue with [Distributed Presence](./distributed-presence) for the interface used to extend presence coordination beyond one process.
