# Sessions

A `vix::realtime::Session` represents one logical client in the Realtime runtime.

A session can survive the loss of its current network connection. It keeps information such as its identity, room memberships, resume token, and room event positions independently from the transport connection.

```text
Session
   |
   +---- identity
   +---- rooms
   +---- resume information
   |
   +---- active connection, when connected
```

## Create a session

Sessions are normally created through `Server`:

```cpp
auto session = server.create_session(
    vix::realtime::SessionId{"session-1"},
    "user-1");
```

A newly created session has no active connection, so its initial status is `Detached`.

```cpp
session->detached(); // true
```

The identity may be empty for an anonymous session.

## Session states

A session has three states:

```text
Connected
Detached
Closed
```

Check the current state with:

```cpp
session->status();
```

or:

```cpp
session->connected();
session->detached();
session->closed();
```

The normal lifecycle is:

```text
Detached
   |
   | attach connection
   v
Connected
   |
   | connection detached
   v
Detached
   |
   | resume
   v
Connected
```

A permanently closed session moves to:

```text
Closed
```

and cannot be attached again.

## Session identity

Each session has a stable identifier:

```cpp
const auto &id = session->id();
```

and an application-defined identity:

```cpp
const auto &identity = session->identity();
```

The identity is fixed when the session is created.

For example:

```cpp
auto session = server.create_session(
    vix::realtime::SessionId{"session-1"},
    "alice");
```

Here:

```text
session ID = session-1
identity   = alice
```

The session ID identifies the Realtime session. The identity identifies the application user or client associated with it.

## Attach a connection

A session becomes connected when an open `Connection` is attached:

```cpp
session->attach(connection);
```

After attachment:

```cpp
session->connected(); // true
```

The active connection is available with:

```cpp
auto connection = session->connection();
```

and its identifier with:

```cpp
auto id = session->connection_id();
```

A session can have at most one active connection.

## Replace a connection

Attaching another connection replaces the current one:

```cpp
auto previous =
    session->attach(newConnection);
```

`attach()` returns the previous connection.

It does not close that previous connection itself. The caller decides how to handle it.

This behavior is useful when replacing a transport connection during reconnection.

## Detach a connection

Detach the current connection with:

```cpp
auto connection = session->detach();
```

The session becomes detached:

```text
Connected
   |
   v
Detached
```

The logical session remains alive.

Its identity and room memberships remain available.

Detaching a session does not close the transport connection returned by `detach()`.

## Detach by connection ID

A connection can also be detached only if its identifier matches the currently attached connection:

```cpp
session->detach(connectionId);
```

If the identifier does not match, nothing is detached.

This prevents an old connection close notification from accidentally detaching a newer connection that has already replaced it.

## Room memberships

A session keeps track of the rooms it has joined.

For normal application code, use `Server`:

```cpp
server.join_room(
    session->id(),
    room->id());
```

Check membership with:

```cpp
session->has_room(room->id());
```

Get all joined rooms with:

```cpp
auto rooms = session->rooms();
```

and the number of rooms with:

```cpp
auto count = session->room_count();
```

The session, not the transport connection, owns these memberships.

This means a temporary disconnection does not remove the logical client from its rooms.

## Leave a room

Use:

```cpp
server.leave_room(
    session->id(),
    room->id());
```

The server coordinates both the session and room membership.

Direct session membership methods also exist, but normal application workflows should use `Server` or `RoomManager` so both sides remain consistent.

## Room event positions

A session can remember the latest event position it has acknowledged for each room.

```cpp
session->acknowledge(
    roomId,
    eventId);
```

Read the stored position with:

```cpp
auto eventId =
    session->last_event_id(roomId);
```

These positions are used during session recovery to determine which room updates may have been missed.

Conceptually:

```text
Room events

1  2  3  4  5
      ^
      |
session last event = 3
```

The session may need events `4` and `5` after reconnecting.

Detailed recovery behavior is covered in [Session Resume](./session-resume).

## Resume token

A session can contain a resume token:

```cpp
auto token = session->resume_token();
```

A token can be assigned with:

```cpp
session->set_resume_token(token);
```

and removed with:

```cpp
session->clear_resume_token();
```

A `Session` stores the token, while `SessionResume` manages the actual resume workflow and token validation.

A session without a resume token cannot be resumed.

## Resume eligibility

A session can check whether it is still eligible for resumption:

```cpp
bool resumable =
    session->can_resume(
        now,
        std::chrono::seconds{120});
```

A session is eligible only when:

- it is not closed
- it has no active open connection
- it has a resume token
- it has been detached
- the resume window has not expired

This check does not perform the actual resume operation.

See [Session Resume](./session-resume) for that workflow.

## Activity time

The session records its latest observed activity:

```cpp
auto time = session->last_seen_at();
```

Update it with:

```cpp
session->touch();
```

Attaching and detaching connections also update the activity timestamp.

The creation timestamp is available with:

```cpp
auto created = session->created_at();
```

## Detachment time

After a connection is detached:

```cpp
auto detachedAt =
    session->detached_at();
```

This timestamp is used when checking whether the session remains inside its resume window.

## Metadata

A session can contain application-defined metadata:

```cpp
vix::realtime::JsonObject metadata;
metadata.set_string("device", "mobile");

session->set_metadata(
    std::move(metadata));
```

Read it with:

```cpp
auto metadata = session->metadata();
```

Session metadata is not authoritative room state.

## Send a message

A connected session can send a protocol envelope through its active connection:

```cpp
session->send(envelope);
```

Sending fails if the session:

- is closed
- has no active connection
- has a connection that is no longer open

The session delegates the actual transmission to its `Connection`.

```text
Session
   |
   v
Connection
   |
   v
Transport
```

## Close a session

A session can be permanently closed:

```cpp
session->close();
```

Closing:

- closes the active connection when one exists
- removes the active connection
- clears the resume token
- clears room memberships
- clears stored room cursors
- marks the session as `Closed`

A closed session cannot be attached or resumed again.

For normal runtime use, prefer:

```cpp
server.close_session(
    session->id());
```

The server coordinates room membership cleanup before removing the logical session from the runtime.

## Detach vs close

Detaching and closing have different purposes.

```text
detach
    temporary connection loss
    session remains alive
    room memberships remain
    session may resume

close
    permanent session end
    connection is closed
    memberships are cleared
    resume token is cleared
    session cannot resume
```

Use detachment for recoverable network loss.

Use closing when the logical session is finished permanently.

## Main model

The important relationship is:

```text
Logical client
      |
      v
   Session
      |
      +---- Room A
      +---- Room B
      |
      v
  Connection
      |
      v
  Transport
```

The `Session` is the stable logical client. The `Connection` is only its current transport attachment.

Continue with [Connections](./connections) for the transport connection interface.
