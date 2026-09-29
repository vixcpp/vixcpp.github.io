# Session Resume

`vix::realtime::SessionResume` reconnects a detached logical session through a new transport connection.

The same session keeps its identity, room memberships, and recovery positions.

```text
Session
   |
connection lost
   |
   v
Detached
   |
new connection
   |
   v
Connected
```

Session resumption is enabled by default.

## Create the resume service

Create `SessionResume` from the room manager:

```cpp
vix::realtime::SessionResume resume{
    server.manager()};
```

The service uses the manager's session registry, event store, snapshot store, presence store, and Realtime configuration.

## Issue a resume token

A session needs a resume token before it can be resumed.

```cpp
auto token = resume.issue(
    session->id());
```

The token is stored on the logical session.

If the session already had a token, issuing a new one immediately replaces it.

Resume tokens should be treated as credentials and sent only to the client that owns the session.

## Disconnect the session

When the transport connection disappears, detach it through the runtime:

```cpp
server.disconnect(
    session->id(),
    connectionId);
```

The session becomes `Detached`, but remains registered.

Its room memberships are preserved.

```text
Connected
   |
   v
Detached

rooms remain joined
session remains registered
```

This is what makes later resumption possible.

## Resume the session

When the client reconnects with its token:

```cpp
auto result = resume.resume(
    session->id(),
    token,
    newConnection);
```

On success:

```cpp
result.session;
result.resumeToken;
result.tokenRotated;
```

The logical session is now attached to `newConnection`.

## Resume requirements

A resume operation succeeds only when:

- session resumption is enabled
- the session still exists
- the session is not permanently closed
- the session is detached
- the supplied token matches
- the resume window has not expired
- the replacement connection exists
- the replacement connection has an identifier
- the replacement connection is open
- the session does not exceed the configured resume room limit
- required room recovery succeeds

If one of these conditions fails, `resume()` throws a Realtime error.

## Resume window

The maximum detached duration is configured with:

```cpp
config.sessionResumeWindow =
    std::chrono::seconds{120};
```

The default is 120 seconds.

A session detached longer than this window cannot be resumed.

```text
detach
  |
  |------ resume window ------|
                              |
                              v
                           expired
```

Check the effective window with:

```cpp
auto window =
    resume.resume_window();
```

## Check whether a session can resume

You can check eligibility before attempting a resume:

```cpp
if (resume.can_resume(
        session->id(),
        token))
{
    // Session is currently resumable.
}
```

`can_resume()` verifies the token and the current session lifecycle state.

It does not attach a connection.

## Check only the token

Use `matches()` when you only need to verify token ownership:

```cpp
bool valid = resume.matches(
    session->id(),
    token);
```

This check does not require the session to be detached or inside the resume window.

The distinction is:

```text
matches()
    token belongs to session

can_resume()
    token matches
    +
    session can currently resume
```

## Missing room events

A detached session may miss events while it has no connection.

Each session stores its last known event position for joined rooms.

For example:

```text
room events

1  2  3  4  5
      ^
      |
session cursor
```

If the session last received event `3`, resumption attempts to recover events `4` and `5`.

The recovery happens before the new connection becomes the active session connection.

## Multiple rooms

Recovery is performed independently for every room joined by the session.

```text
Session
   |
   +---- Room A
   |       recover missing events
   |
   +---- Room B
           recover missing events
```

The maximum number of rooms that can participate in one resume operation is controlled by:

```cpp
config.maxResumeRooms
```

The default is:

```text
32
```

A session that belongs to more rooms than this limit cannot resume.

## Replay limits

Missing events are recovered using the configured replay limits:

```cpp
config.maxReplayEvents;
config.maxReplayBytes;
config.replayTimeout;
```

These limits prevent one resume operation from performing unbounded recovery work.

For example, if too many events are missing, direct replay may not be possible.

## Snapshot fallback

When direct event replay exceeds the event limit, Realtime can use a suitable stored snapshot when a snapshot store is available.

Conceptually:

```text
session cursor
     |
     | too much history
     v
latest usable snapshot
     |
     v
events after snapshot
     |
     v
current position
```

The replacement connection receives the snapshot first, followed by events that occurred after it.

If recovery still exceeds the configured limits, the resume operation fails.

See [Replay and Recovery](./replay-and-recovery) for the detailed replay model.

## Recovery order

A successful resume follows this model:

```text
validate session and token
          |
          v
recover joined rooms
          |
          v
send missing snapshots/events
          |
          v
attach new connection
          |
          v
restore presence
          |
          v
update room cursors
          |
          v
resume complete
```

The session cursors are updated only after room recovery succeeds.

This prevents a failed recovery from falsely recording events as recovered.

## Recovery failure

If recovery fails before the replacement connection is attached, the logical session remains detached.

Its existing room cursors remain unchanged, and its previous resume token remains valid.

For example:

```text
Room A recovery succeeds
Room B recovery fails
        |
        v
resume fails

session remains detached
cursors remain unchanged
old token remains valid
```

The candidate connection may already have received recovery messages from an earlier room before a later room fails.

Those bytes cannot be taken back from the transport. The rollback applies to the server-side session state.

## Token rotation

By default, a successful resume rotates the token.

```cpp
auto result = resume.resume(
    session->id(),
    token,
    newConnection);

auto nextToken =
    result.resumeToken;
```

After successful rotation:

```text
old token
    invalid

new token
    used for next resume
```

Check whether rotation occurred with:

```cpp
result.tokenRotated;
```

The new token should be returned to the client and stored for the next reconnection.

## Resume without token rotation

Token rotation can be disabled for a specific call:

```cpp
auto result = resume.resume(
    session->id(),
    token,
    newConnection,
    vix::realtime::SystemClock::now(),
    false);
```

In that case, the current token remains valid.

For normal use, keep the default rotation behavior.

## Rotate a token manually

A token can also be rotated explicitly:

```cpp
auto newToken =
    resume.rotate(session->id());
```

The previous token becomes invalid immediately.

`rotate()` has the same token replacement behavior as issuing a new token.

## Revoke a token

Remove the current resume credential with:

```cpp
resume.revoke(
    session->id());
```

Revoking the token does not close the session or its current connection.

It only prevents that token from being used for future resumption.

## Presence after resume

When presence is enabled, connection detachment marks the session presence as `Detached`.

A successful resume attaches the replacement connection through `RoomManager`, which restores joined-room presence to `Present`.

```text
Present
   |
disconnect
   v
Detached
   |
resume
   v
Present
```

Presence is separate from authoritative room state.

## Common resume failures

An unknown session produces:

```text
SessionNotFound
```

An incorrect or invalid token produces:

```text
InvalidResumeToken
```

Trying to resume an already connected session produces:

```text
SessionAlreadyConnected
```

A session that has never entered the detached state produces:

```text
SessionNotDetached
```

An expired or permanently closed session produces:

```text
SessionExpired
```

An invalid replacement connection produces:

```text
ConnectionNotAttached
```

Recovery limits can produce:

```text
ReplayLimitExceeded
```

Incomplete recovery can produce:

```text
ReplayUnavailable
```

## Basic workflow

The normal workflow is:

```cpp
vix::realtime::SessionResume resume{
    server.manager()};

auto token =
    resume.issue(session->id());

// Connection is later detached.

auto result =
    resume.resume(
        session->id(),
        token,
        newConnection);

token = result.resumeToken;
```

The important model is:

```text
issue token
    |
    v
session disconnects
    |
    v
session stays detached
    |
    v
client reconnects
    |
    v
recover missed room data
    |
    v
attach new connection
    |
    v
rotate token
```

Session resumption preserves the logical session while allowing its transport connection to change.

Continue with [Presence](./presence) for how connected, detached, and departed participants are represented.
