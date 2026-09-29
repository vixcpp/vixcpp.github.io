# WAL

The `wal` package provides a small write-ahead log for sync-related records. A WAL is an append-only file where each record describes a durable state transition, such as adding an operation, marking an operation as done, or recording a retryable failure.

The purpose of a WAL is to make recovery explicit. Instead of only storing the latest state, an application can append ordered records and replay them later to rebuild state. This is useful in systems where the order of changes matters and where recovery after a restart must be predictable.

In the current `sync` module, the WAL is a lower-level primitive. The default `FileOutboxStore` persists its own JSON state and does not automatically write through the WAL. Use the WAL when you need append-only records and replay as part of a custom sync or storage design.

## Header

Use the public sync header:

```cpp id="fmyv7c"
#include <vix/sync.hpp>
```

For examples that print output:

```cpp id="sc6f4v"
#include <vix/print.hpp>
```

## Create a WAL

A `Wal` is created with a file path. The file is binary and append-only.

```cpp id="k1s7bf"
#include <vix/sync.hpp>

int main()
{
  vix::sync::wal::Wal wal(
    vix::sync::wal::Wal::Config{
      .file_path = "./.vix/wal.log"
    }
  );

  return 0;
}
```

The parent directory is created when records are written. Use a path that belongs to the application state directory, not a temporary path that may be removed while the application is running.

## Append a record

A `WalRecord` stores the operation id, record type, timestamp, optional payload, optional error, and next retry time.

```cpp id="z9aq6b"
#include <chrono>
#include <cstdint>
#include <string>

#include <vix/print.hpp>
#include <vix/sync.hpp>

static std::int64_t now_ms()
{
  using namespace std::chrono;

  return duration_cast<milliseconds>(
    steady_clock::now().time_since_epoch()
  ).count();
}

int main()
{
  using namespace vix::sync::wal;

  Wal wal(
    Wal::Config{
      .file_path = "./.vix/wal.log"
    }
  );

  std::string payload = R"({"kind":"message.send","target":"/api/messages"})";

  WalRecord rec;
  rec.id = "op-message-1";
  rec.type = RecordType::PutOperation;
  rec.ts_ms = now_ms();
  rec.payload.assign(payload.begin(), payload.end());

  const auto offset = wal.append(rec);

  vix::print("record appended at offset", offset);

  return 0;
}
```

`append()` returns the file offset where the record was written. That offset can be useful when a higher-level system wants to keep track of replay progress.

## Replay records

Replay reads records in order from a given offset and calls a callback for each record.

```cpp id="jlyvl2"
#include <vix/print.hpp>
#include <vix/sync.hpp>

int main()
{
  using namespace vix::sync::wal;

  Wal wal(
    Wal::Config{
      .file_path = "./.vix/wal.log"
    }
  );

  const auto last = wal.replay(
    0,
    [](const WalRecord &rec) {
      vix::print(
        "record",
        rec.id,
        "type",
        static_cast<int>(rec.type)
      );
    }
  );

  vix::print("last replay offset", last);

  return 0;
}
```

Replay is the recovery side of the WAL. A custom store can read records from the log and rebuild the latest state by applying each record in order.

## Record types

The WAL currently defines three record types.

| Type           | Meaning                                                |
| -------------- | ------------------------------------------------------ |
| `PutOperation` | A new operation was added to the system.               |
| `MarkDone`     | An operation completed successfully.                   |
| `MarkFailed`   | An operation failed and may include retry information. |

These record types mirror the basic lifecycle of sync work. A custom outbox implementation can append a `PutOperation` record before making an operation visible, append `MarkDone` after completion, and append `MarkFailed` when a retryable failure must be preserved.

## Record fields

`WalRecord` is intentionally small and stores only the information needed to describe one durable event.

| Field              | Purpose                                             |
| ------------------ | --------------------------------------------------- |
| `id`               | Identifier of the operation affected by the record. |
| `type`             | Kind of WAL record.                                 |
| `ts_ms`            | Timestamp when the record was created.              |
| `payload`          | Opaque bytes associated with the record.            |
| `error`            | Optional error message for failure records.         |
| `next_retry_at_ms` | Retry timestamp used by retryable failure records.  |

The payload is stored as bytes, not as a parsed JSON object. This lets the WAL stay independent from the application format. A higher-level layer can decide whether the payload contains JSON, a serialized operation, a command envelope, or another binary format.

## Failure record example

A failed operation can be recorded with an error message and a retry timestamp.

```cpp id="khhmkq"
#include <chrono>
#include <cstdint>

#include <vix/print.hpp>
#include <vix/sync.hpp>

static std::int64_t now_ms()
{
  using namespace std::chrono;

  return duration_cast<milliseconds>(
    steady_clock::now().time_since_epoch()
  ).count();
}

int main()
{
  using namespace vix::sync::wal;

  Wal wal(
    Wal::Config{
      .file_path = "./.vix/failures.log"
    }
  );

  const auto now = now_ms();

  WalRecord rec;
  rec.id = "op-message-1";
  rec.type = RecordType::MarkFailed;
  rec.ts_ms = now;
  rec.error = "temporary network error";
  rec.next_retry_at_ms = now + 1'000;

  const auto offset = wal.append(rec);

  vix::print("failure record appended", offset);

  return 0;
}
```

This record does not retry the operation by itself. It only records the durable fact that a failure happened and that the operation may become eligible again at a later time. The code that replays the log decides how to apply that record to its own state.

## WalWriter and WalReader

`Wal` is a convenience wrapper around `WalWriter` and `WalReader`.

`WalWriter` appends records to a WAL file and returns offsets. It is useful when a component only needs to write records.

```cpp id="e4ulnq"
vix::sync::wal::WalWriter writer(
  vix::sync::wal::WalWriter::Config{
    .file_path = "./.vix/wal.log"
  }
);
```

`WalReader` reads records sequentially from a WAL file. It is useful when a component needs direct control over seeking and reading.

```cpp id="igqqnf"
vix::sync::wal::WalReader reader("./.vix/wal.log");

reader.seek(0);

while (auto rec = reader.next())
{
  vix::print("read record", rec->id);
}
```

Use `Wal` when the simple append and replay interface is enough. Use `WalWriter` and `WalReader` when you need lower-level control.

## Complete example

This example appends two records and then replays the log.

```cpp id="4u6hla"
#include <chrono>
#include <cstdint>
#include <filesystem>
#include <string>

#include <vix/print.hpp>
#include <vix/sync.hpp>

static std::int64_t now_ms()
{
  using namespace std::chrono;

  return duration_cast<milliseconds>(
    steady_clock::now().time_since_epoch()
  ).count();
}

static const char *record_type_name(vix::sync::wal::RecordType type)
{
  using vix::sync::wal::RecordType;

  switch (type)
  {
  case RecordType::PutOperation:
    return "PutOperation";
  case RecordType::MarkDone:
    return "MarkDone";
  case RecordType::MarkFailed:
    return "MarkFailed";
  }

  return "Unknown";
}

int main()
{
  using namespace vix::sync::wal;

  const std::filesystem::path dir = "./.vix_wal_example";

  std::error_code ec;
  std::filesystem::remove_all(dir, ec);
  std::filesystem::create_directories(dir, ec);

  Wal wal(
    Wal::Config{
      .file_path = dir / "wal.log"
    }
  );

  std::string payload = R"({"kind":"message.send","target":"/api/messages"})";

  WalRecord put;
  put.id = "op-message-1";
  put.type = RecordType::PutOperation;
  put.ts_ms = now_ms();
  put.payload.assign(payload.begin(), payload.end());

  wal.append(put);

  WalRecord done;
  done.id = "op-message-1";
  done.type = RecordType::MarkDone;
  done.ts_ms = now_ms();

  wal.append(done);

  wal.replay(
    0,
    [](const WalRecord &rec) {
      vix::print(
        "replayed",
        rec.id,
        record_type_name(rec.type)
      );
    }
  );

  return 0;
}
```

Output shape:

```txt id="h4lpak"
replayed op-message-1 PutOperation
replayed op-message-1 MarkDone
```

The example does not rebuild an outbox. It only shows the append and replay mechanics. A real recovery layer would apply each record to an in-memory or persistent state model.

## WAL and outbox

The outbox stores the latest state of operations. The WAL stores ordered records. These two models solve related but different problems.

A state store is convenient when you want to know what an operation looks like now. An append-only log is convenient when you want to know what happened over time and replay those events. A custom sync store may use both: append a WAL record first, then update the current operation state.

The default `FileOutboxStore` already persists operations in JSON. It should not be described as WAL-backed unless the application explicitly builds that integration.

## Durability notes

`Wal::Config` and `WalWriter::Config` include `fsync_on_write`. The option represents the durability policy expected by the writer configuration. When a system depends on strong crash durability, test the behavior on the target platform and storage layer instead of assuming that a flush alone gives the same guarantees as a full disk sync.

For many local development and test workflows, the default behavior is enough. For production systems that depend on exact recovery after power loss, the storage policy should be reviewed carefully.

## Common mistakes

Do not use the WAL as a general database. It is an append-only log. It can help rebuild state, but it does not provide indexes, queries, or compaction by itself.

Do not confuse replay with conflict resolution. Replaying records restores local state from the log. It does not decide how to merge remote changes or resolve application-level conflicts.

Do not edit the WAL file by hand. The file is binary and is meant to be written and read by the WAL APIs.

Do not assume the default outbox is automatically WAL-backed. The WAL is available as a lower-level primitive for custom designs.

## Next step

Continue with CMake to see how to link the sync module from a Vix or CMake-based project.

```md id="bm2y8w"
[CMake](./cmake.md)
```
