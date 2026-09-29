# Distributed Presence

`vix::realtime::DistributedPresence` defines the contract for sharing presence information across multiple Realtime runtime nodes.

It extends the normal `PresenceStore` interface with node heartbeats and backend health information.

```text id="6npe1w"
Node A ──┐
         |
Node B ──┼── shared presence backend
         |
Node C ──┘
```

Presence remains non-authoritative application information. Authoritative room state continues to belong to persisted events and `RoomState`.

## Current implementation status

Realtime currently provides the `DistributedPresence` interface, but does not include a built-in Redis, PostgreSQL, or other concrete distributed presence backend.

The default runtime uses:

```cpp id="m20q13"
vix::realtime::LocalPresenceStore
```

which is process-local.

`DistributedPresence` is the public contract for applications that need to provide a shared presence backend.

## PresenceStore compatibility

`DistributedPresence` inherits from:

```cpp id="nf7x6q"
vix::realtime::PresenceStore
```

A distributed implementation must therefore support the normal presence operations:

```text id="vzva1i"
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
clear room
clear session
```

It additionally manages runtime-node presence.

## Local node

Every distributed backend identifies its local runtime node:

```cpp id="rfas7f"
const auto &nodeId =
    presence->local_node_id();
```

The node identifier distinguishes one Realtime runtime from another.

```text id="xyv6hm"
node-1
node-2
node-3
```

## Node heartbeat

A distributed backend publishes the local node heartbeat through:

```cpp id="h7e9tq"
presence->heartbeat();
```

The heartbeat indicates that the runtime node is still active.

Conceptually:

```text id="71u34s"
node-1
   |
heartbeat
   |
   v
shared presence backend
```

A heartbeat can also include non-authoritative node metadata:

```cpp id="3e3ywf"
vix::realtime::JsonObject metadata;
metadata.set_string("region", "east");

presence->heartbeat(
    vix::realtime::SystemClock::now(),
    std::move(metadata));
```

The backend implementation decides how that heartbeat is persisted and shared.

## Find a node

Find one known runtime node with:

```cpp id="gztlpe"
auto node =
    presence->find_node(
        vix::realtime::NodeId{"node-1"});
```

If the node is unknown:

```cpp id="ys5gnb"
node.has_value(); // false
```

A known node contains:

```text id="pi95c4"
NodeId
last heartbeat time
local flag
metadata
```

## List nodes

List all known nodes with:

```cpp id="kptx1h"
auto nodes =
    presence->nodes();
```

Implementations should return them in deterministic node identifier order.

## Active nodes

Find nodes whose heartbeat is still recent:

```cpp id="n5sjph"
auto nodes =
    presence->active_nodes(
        vix::realtime::SystemClock::now(),
        std::chrono::seconds{30});
```

A node is active when its last heartbeat is newer than the specified timeout.

For example:

```text id="sh2pyq"
node-1 last seen 5s ago
node-2 last seen 12s ago
node-3 last seen 40s ago

timeout = 30s

active:
node-1
node-2
```

## Check one node

Check whether one node is active with:

```cpp id="nhudxc"
bool active =
    presence->node_active(
        nodeId,
        vix::realtime::SystemClock::now(),
        std::chrono::seconds{30});
```

The node must exist and its heartbeat must still be recent.

## Stale nodes

`DistributedPresenceNode` can check whether its heartbeat is stale:

```cpp id="ev1p9t"
bool stale =
    node.stale(
        vix::realtime::SystemClock::now(),
        std::chrono::seconds{30});
```

A timeout less than or equal to zero treats the node as stale.

## Prune stale nodes

A distributed implementation can remove expired node records:

```cpp id="1oy6ry"
auto removed =
    presence->prune_stale_nodes(
        vix::realtime::SystemClock::now(),
        std::chrono::seconds{30});
```

The return value is the number of removed node records.

The backend may also remove presence records belonging to those nodes according to its own policy.

## Clear one node

Remove all presence owned by one node with:

```cpp id="0rs7rv"
auto removed =
    presence->clear_node(nodeId);
```

This operation is useful when a runtime node is intentionally removed from the shared presence system.

It returns the number of removed presence records.

## Backend status

A distributed presence backend reports one of three states:

```text id="d3uhs2"
Healthy
Degraded
Unavailable
```

Read it with:

```cpp id="xneqsf"
auto status =
    presence->distributed_status();
```

### Healthy

```text id="o2pml7"
healthy
```

means the shared backend is reachable and operating normally.

### Degraded

```text id="xwpzc3"
degraded
```

means the backend remains usable but is experiencing partial failures.

### Unavailable

```text id="zdurs9"
unavailable
```

means the shared backend cannot currently provide its normal service.

## Ping the backend

Check whether the shared backend responds with:

```cpp id="1h6oly"
bool available =
    presence->ping();
```

`ping()` is intended as a lightweight backend reachability check.

It does not determine whether a particular session or node is present.

## Distributed presence and room presence

A distributed backend still stores normal logical presence records.

For example:

```text id="b4x03l"
room-1
   |
   +---- session-1 on node-1
   +---- session-2 on node-2
```

Because `DistributedPresence` implements `PresenceStore`, normal Realtime operations can continue using presence concepts such as:

```text id="i96i19"
Present
Detached
Left
```

The difference is where those records are coordinated.

```text id="b73ej7"
LocalPresenceStore

one process only
```

compared with:

```text id="dvnn0j"
DistributedPresence

shared coordination backend
multiple runtime nodes
```

## Distributed presence is not room ownership

Distributed presence and room ownership solve different problems.

```text id="swctks"
DistributedPresence
    where sessions and runtime nodes are present

RoomDirectory
    which node owns a room
```

Knowing that `node-2` is active does not by itself mean that `node-2` owns a particular room.

See [Room Ownership](./room-ownership) for room ownership semantics.

## Distributed presence is not authoritative state

Presence should not contain application facts that must survive replay.

For example:

```text id="g2vyw3"
player score
document contents
match result
```

belong in authoritative room events and `RoomState`.

Distributed presence is intended for information such as:

```text id="myqxse"
session participation
connection state
runtime node
last activity
node heartbeat
```

The separation remains:

```text id="fyxn6z"
RoomState
    authoritative application state

DistributedPresence
    shared runtime participation
```

## Implementing a backend

A custom backend derives from:

```cpp id="slgcsk"
class MyPresence
    : public vix::realtime::DistributedPresence
{
    // Implement PresenceStore
    // and DistributedPresence operations.
};
```

The implementation must provide both:

```text id="1o6a8u"
normal presence storage
+
node coordination
```

A backend could use a shared system such as PostgreSQL, Redis, or another coordination service, but Realtime does not currently provide those concrete distributed implementations.

## Main model

The distributed presence contract is:

```text id="cpocvb"
Realtime Node
     |
     +---- heartbeat
     |
     +---- session presence
     |
     v
DistributedPresence
     |
     v
shared backend
```

The interface defines how multiple runtime nodes can share presence and node-health information while keeping presence separate from authoritative room state.

Continue with [Metrics](./metrics) for runtime counters and duration measurements.
