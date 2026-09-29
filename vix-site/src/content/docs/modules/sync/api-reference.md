# API Reference

This page is a compact reference for the public API exposed by the `sync` module. It lists the main types, configuration structures, methods, and namespaces used by the offline-first operation pipeline.

For conceptual explanations and workflow examples, read the earlier pages first. This page is meant for lookup once the model is already understood.

## Public header

Use the public module header in normal application code:

```cpp id="jx3fx9"
#include <vix/sync.hpp>
```

This header includes the public sync components:

```txt id="f222gz"
Operation
RetryPolicy
Outbox
OutboxStore
FileOutboxStore
SendResult
ISyncTransport
SyncWorker
SyncEngine
Wal
WalReader
WalRecord
WalWriter
```

For examples that print output, include:

```cpp id="mks6oa"
#include <vix/print.hpp>
```

## Namespaces

The sync module is organized into a few focused namespaces.

| Namespace           | Purpose                                           |
| ------------------- | ------------------------------------------------- |
| `vix::sync`         | Core operation and retry types.                   |
| `vix::sync::outbox` | Durable outbox and outbox store interfaces.       |
| `vix::sync::engine` | Sync workers, engine, transport, and send result. |
| `vix::sync::wal`    | Write-ahead log records, reader, writer, and WAL. |

## `vix::sync::OperationStatus`

`OperationStatus` represents the durable lifecycle state of a sync operation.

```cpp id="er38nd"
enum class OperationStatus : std::uint8_t
{
  Pending = 0,
  InFlight,
  Done,
  Failed,
  PermanentFailed
};
```

| Value             | Meaning                                          |
| ----------------- | ------------------------------------------------ |
| `Pending`         | Operation is stored and waiting to be processed. |
| `InFlight`        | Operation has been claimed by a worker.          |
| `Done`            | Operation completed successfully.                |
| `Failed`          | Operation failed, but may be retried.            |
| `PermanentFailed` | Operation failed and should not be retried.      |

## `vix::sync::Operation`

`Operation` is the durable unit of work stored in the outbox and processed by the sync engine.

```cpp id="ukgr5x"
struct Operation
{
  std::string id;
  std::string kind;
  std::string target;
  std::string payload;
  std::string idempotency_key;

  std::int64_t created_at_ms{0};
  std::int64_t updated_at_ms{0};
  std::uint32_t attempt{0};
  std::int64_t next_retry_at_ms{0};

  OperationStatus status{OperationStatus::Pending};
  std::string last_error;

  bool is_done() const noexcept;
  bool is_pending() const noexcept;
  bool is_failed() const noexcept;

  void fail(std::string err, std::int64_t now_ms);
  void done(std::int64_t now_ms);
};
```

### Fields

| Field              | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| `id`               | Local operation identifier.                             |
| `kind`             | Logical operation type, such as `message.send`.         |
| `target`           | Destination understood by the transport.                |
| `payload`          | Opaque application payload.                             |
| `idempotency_key`  | Stable key used by the receiver to deduplicate retries. |
| `created_at_ms`    | Creation timestamp in milliseconds.                     |
| `updated_at_ms`    | Last update timestamp in milliseconds.                  |
| `attempt`          | Number of delivery attempts recorded for the operation. |
| `next_retry_at_ms` | Time when the operation becomes eligible for retry.     |
| `status`           | Current lifecycle status.                               |
| `last_error`       | Last recorded error message.                            |

### Helpers

```cpp id="r9cr08"
bool is_done() const noexcept;
bool is_pending() const noexcept;
bool is_failed() const noexcept;
```

These helpers check the current status.

```cpp id="s8ohj3"
void fail(std::string err, std::int64_t now_ms);
void done(std::int64_t now_ms);
```

These methods update the in-memory operation value. When the operation is already stored in an outbox, prefer `Outbox::fail()` and `Outbox::complete()` so the persistent store is updated.

## `vix::sync::RetryPolicy`

`RetryPolicy` computes retry timing for retryable failures.

```cpp id="wj5h73"
struct RetryPolicy
{
  std::uint32_t max_attempts{8};
  std::int64_t base_delay_ms{500};
  std::int64_t max_delay_ms{30'000};
  double factor{2.0};
  double jitter_ratio{0.2};

  bool can_retry(std::uint32_t attempt) const noexcept;
  std::int64_t compute_delay_ms(std::uint32_t attempt) const noexcept;
};
```

### Fields

| Field           | Purpose                                                  |
| --------------- | -------------------------------------------------------- |
| `max_attempts`  | Maximum number of retry attempts allowed by the policy.  |
| `base_delay_ms` | Delay used as the base for the first retry.              |
| `max_delay_ms`  | Maximum retry delay.                                     |
| `factor`        | Exponential backoff multiplier.                          |
| `jitter_ratio`  | Jitter setting exposed to higher-level scheduling logic. |

### Methods

```cpp id="p6qx27"
bool can_retry(std::uint32_t attempt) const noexcept;
```

Returns true when the given attempt count is still within the retry limit.

```cpp id="um9k1e"
std::int64_t compute_delay_ms(std::uint32_t attempt) const noexcept;
```

Returns the deterministic exponential backoff delay for the attempt. The delay is clamped between `base_delay_ms` and `max_delay_ms`.

`compute_delay_ms()` does not apply randomness. The `jitter_ratio` field is available for higher-level code that wants to apply jitter explicitly.

## `vix::sync::outbox::ListOptions`

`ListOptions` controls how an `OutboxStore` lists operations.

```cpp id="xlp5l5"
struct ListOptions
{
  std::size_t limit{50};
  std::int64_t now_ms{0};
  bool only_ready{true};
  bool include_inflight{false};
};
```

| Field              | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `limit`            | Maximum number of operations to return.              |
| `now_ms`           | Current time used for readiness checks.              |
| `only_ready`       | Excludes operations waiting for a future retry time. |
| `include_inflight` | Includes operations currently marked as `InFlight`.  |

## `vix::sync::outbox::OutboxStore`

`OutboxStore` is the abstract persistence interface used by `Outbox`.

```cpp id="fr4fag"
class OutboxStore
{
public:
  virtual ~OutboxStore() = default;

  virtual void put(const vix::sync::Operation &op) = 0;

  virtual std::optional<vix::sync::Operation>
  get(const std::string &id) = 0;

  virtual std::vector<vix::sync::Operation>
  list(const ListOptions &opt) = 0;

  virtual bool claim(
    const std::string &id,
    const std::string &owner,
    std::int64_t now_ms
  ) = 0;

  virtual bool mark_done(
    const std::string &id,
    std::int64_t now_ms
  ) = 0;

  virtual bool mark_failed(
    const std::string &id,
    const std::string &error,
    std::int64_t now_ms,
    std::int64_t next_retry_at_ms
  ) = 0;

  virtual std::size_t prune_done(
    std::int64_t older_than_ms
  ) = 0;

  virtual bool mark_permanent_failed(
    const std::string &id,
    const std::string &error,
    std::int64_t now_ms
  ) = 0;

  virtual std::size_t requeue_inflight_older_than(
    std::int64_t now_ms,
    std::int64_t timeout_ms
  ) = 0;
};
```

### Methods

| Method                        | Purpose                                               |
| ----------------------------- | ----------------------------------------------------- |
| `put`                         | Inserts or updates an operation.                      |
| `get`                         | Retrieves an operation by id.                         |
| `list`                        | Lists operations matching `ListOptions`.              |
| `claim`                       | Marks an operation as in-flight and assigns an owner. |
| `mark_done`                   | Marks an operation as completed.                      |
| `mark_failed`                 | Marks an operation as failed with a retry time.       |
| `prune_done`                  | Removes completed operations older than a cutoff.     |
| `mark_permanent_failed`       | Marks an operation as permanently failed.             |
| `requeue_inflight_older_than` | Requeues old in-flight operations after a timeout.    |

Custom stores should implement this interface when the default file-backed store is not enough.

## `vix::sync::outbox::FileOutboxStore`

`FileOutboxStore` is the default JSON-backed implementation of `OutboxStore`.

```cpp id="prjt91"
class FileOutboxStore final : public OutboxStore
{
public:
  struct Config
  {
    std::filesystem::path file_path{"./.vix/outbox.json"};
    bool pretty_json{false};
    bool fsync_on_write{false};
  };

  explicit FileOutboxStore(Config cfg);

  void put(const vix::sync::Operation &op) override;

  std::optional<vix::sync::Operation>
  get(const std::string &id) override;

  std::vector<vix::sync::Operation>
  list(const ListOptions &opt) override;

  bool claim(
    const std::string &id,
    const std::string &owner,
    std::int64_t now_ms
  ) override;

  bool mark_done(
    const std::string &id,
    std::int64_t now_ms
  ) override;

  bool mark_failed(
    const std::string &id,
    const std::string &error,
    std::int64_t now_ms,
    std::int64_t next_retry_at_ms
  ) override;

  std::size_t prune_done(
    std::int64_t older_than_ms
  ) override;

  bool mark_permanent_failed(
    const std::string &id,
    const std::string &error,
    std::int64_t now_ms
  ) override;

  std::size_t requeue_inflight_older_than(
    std::int64_t now_ms,
    std::int64_t timeout_ms
  ) override;
};
```

### Configuration

| Field            | Purpose                                               |
| ---------------- | ----------------------------------------------------- |
| `file_path`      | JSON file used to persist operations.                 |
| `pretty_json`    | Writes formatted JSON for easier inspection.          |
| `fsync_on_write` | Durability policy option carried by the store config. |

### Example

```cpp id="zil7jm"
auto store = std::make_shared<vix::sync::outbox::FileOutboxStore>(
  vix::sync::outbox::FileOutboxStore::Config{
    .file_path = "./.vix/outbox.json",
    .pretty_json = true
  }
);
```

## `vix::sync::outbox::Outbox`

`Outbox` is the high-level durable queue used by application code and sync workers.

```cpp id="vm9zxs"
class Outbox
{
public:
  struct Config
  {
    std::string owner{"vix-sync"};
    RetryPolicy retry{};
    bool auto_generate_ids{true};
    bool auto_generate_idempotency_key{true};
  };

  Outbox(Config cfg, std::shared_ptr<OutboxStore> store);

  std::string enqueue(
    vix::sync::Operation op,
    std::int64_t now_ms
  );

  std::vector<vix::sync::Operation> peek_ready(
    std::int64_t now_ms,
    std::size_t limit = 50
  );

  bool claim(
    const std::string &id,
    std::int64_t now_ms
  );

  bool complete(
    const std::string &id,
    std::int64_t now_ms
  );

  bool fail(
    const std::string &id,
    const std::string &error,
    std::int64_t now_ms,
    bool retryable = true
  );

  std::shared_ptr<OutboxStore> store() const noexcept;

  const Config &config() const noexcept;
};
```

### Configuration

| Field                           | Purpose                                                  |
| ------------------------------- | -------------------------------------------------------- |
| `owner`                         | Logical owner used when claiming operations.             |
| `retry`                         | Retry policy used for retryable failures.                |
| `auto_generate_ids`             | Generates an operation id when `Operation::id` is empty. |
| `auto_generate_idempotency_key` | Generates an idempotency key when missing.               |

### Methods

| Method       | Purpose                                                        |
| ------------ | -------------------------------------------------------------- |
| `enqueue`    | Persists an operation and returns its id.                      |
| `peek_ready` | Returns operations ready for processing without claiming them. |
| `claim`      | Claims an operation using the configured owner.                |
| `complete`   | Marks an operation as done.                                    |
| `fail`       | Records a retryable or permanent failure.                      |
| `store`      | Returns the underlying store.                                  |
| `config`     | Returns the outbox configuration.                              |

### Example

```cpp id="jvwixy"
vix::sync::Operation op;
op.kind = "message.send";
op.target = "/api/messages";
op.payload = R"({"text":"hello"})";

const auto id = outbox.enqueue(op, now_ms);
```

## `vix::sync::engine::SendResult`

`SendResult` is returned by transports after a delivery attempt.

```cpp id="qu73z7"
struct SendResult
{
  bool ok{false};
  bool retryable{true};
  std::string error;
};
```

| Field       | Purpose                                                |
| ----------- | ------------------------------------------------------ |
| `ok`        | True when the operation was delivered successfully.    |
| `retryable` | True when a failed delivery may be retried.            |
| `error`     | Diagnostic error message for failed delivery attempts. |

## `vix::sync::engine::ISyncTransport`

`ISyncTransport` is the abstract delivery boundary used by workers.

```cpp id="uil4x6"
class ISyncTransport
{
public:
  virtual ~ISyncTransport() = default;

  virtual SendResult send(
    const vix::sync::Operation &op
  ) = 0;
};
```

### Example

```cpp id="d9d5mh"
class AppTransport final : public vix::sync::engine::ISyncTransport
{
public:
  vix::sync::engine::SendResult
  send(const vix::sync::Operation &op) override
  {
    return {
      .ok = true,
      .retryable = false,
      .error = {}
    };
  }
};
```

The transport owns protocol-specific delivery. The worker owns operation lifecycle updates.

## `vix::sync::engine::SyncWorker`

`SyncWorker` processes ready operations from an outbox.

```cpp id="ltyfy4"
class SyncWorker
{
public:
  struct Config
  {
    std::size_t batch_limit{25};
    std::int64_t idle_sleep_ms{250};
    std::int64_t offline_sleep_ms{500};
    std::int64_t inflight_timeout_ms{10'000};
  };

  SyncWorker(
    Config cfg,
    std::shared_ptr<vix::sync::outbox::Outbox> outbox,
    std::shared_ptr<vix::net::NetworkProbe> probe,
    std::shared_ptr<ISyncTransport> transport
  );

  std::size_t tick(std::int64_t now_ms);
};
```

### Configuration

| Field                 | Purpose                                               |
| --------------------- | ----------------------------------------------------- |
| `batch_limit`         | Maximum operations processed per tick.                |
| `idle_sleep_ms`       | Timing value used by higher-level orchestration.      |
| `offline_sleep_ms`    | Offline timing value carried by worker configuration. |
| `inflight_timeout_ms` | Timeout for requeueing old in-flight operations.      |

### Method

```cpp id="l02lm2"
std::size_t tick(std::int64_t now_ms);
```

Processes a batch of ready operations for the given time. The method returns a best-effort count of processed operations.

During a tick, the worker can requeue old in-flight operations, check network availability through `NetworkProbe`, claim ready operations, send them through the transport, and update the outbox.

## `vix::sync::engine::SyncEngine`

`SyncEngine` coordinates one or more sync workers.

```cpp id="ambnz1"
class SyncEngine
{
public:
  struct Config
  {
    std::size_t worker_count{1};
    std::int64_t idle_sleep_ms{250};
    std::int64_t offline_sleep_ms{500};
    std::size_t batch_limit{25};
    std::int64_t inflight_timeout_ms{10'000};
  };

  SyncEngine(
    Config cfg,
    std::shared_ptr<vix::sync::outbox::Outbox> outbox,
    std::shared_ptr<vix::net::NetworkProbe> probe,
    std::shared_ptr<ISyncTransport> transport
  );

  ~SyncEngine();

  std::size_t tick(std::int64_t now_ms);

  void start();

  void stop();

  bool running() const noexcept;
};
```

### Configuration

| Field                 | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `worker_count`        | Number of worker instances created by the engine.        |
| `idle_sleep_ms`       | Sleep duration when the background loop is idle.         |
| `offline_sleep_ms`    | Offline timing value propagated to worker configuration. |
| `batch_limit`         | Maximum operations pulled per worker batch.              |
| `inflight_timeout_ms` | Timeout for requeueing old in-flight operations.         |

### Methods

```cpp id="ss481l"
std::size_t tick(std::int64_t now_ms);
```

Runs one engine iteration and returns the number of operations processed by workers.

```cpp id="u9uj1r"
void start();
```

Starts the internal background loop. Calling `start()` while already running has no effect.

```cpp id="zv8h4o"
void stop();
```

Stops the background loop and joins the engine thread. Calling `stop()` while not running has no effect.

```cpp id="r2jc7b"
bool running() const noexcept;
```

Returns whether the engine background loop is currently running.

### Example

```cpp id="o1mvrx"
vix::sync::engine::SyncEngine engine(
  vix::sync::engine::SyncEngine::Config{
    .worker_count = 1,
    .batch_limit = 10
  },
  outbox,
  probe,
  transport
);

const auto processed = engine.tick(now_ms);
```

## `vix::sync::wal::RecordType`

`RecordType` identifies the kind of record stored in the write-ahead log.

```cpp id="c7e6ds"
enum class RecordType : std::uint8_t
{
  PutOperation = 1,
  MarkDone = 2,
  MarkFailed = 3,
};
```

| Value          | Meaning                                                |
| -------------- | ------------------------------------------------------ |
| `PutOperation` | A new operation was added.                             |
| `MarkDone`     | An operation completed successfully.                   |
| `MarkFailed`   | An operation failed and may include retry information. |

## `vix::sync::wal::WalRecord`

`WalRecord` is a single append-only record in the WAL.

```cpp id="xcihb0"
struct WalRecord
{
  std::string id;
  RecordType type{RecordType::PutOperation};
  std::int64_t ts_ms{0};
  std::vector<std::uint8_t> payload;
  std::string error;
  std::int64_t next_retry_at_ms{0};
};
```

| Field              | Purpose                                     |
| ------------------ | ------------------------------------------- |
| `id`               | Identifier of the affected operation.       |
| `type`             | WAL record type.                            |
| `ts_ms`            | Record timestamp in milliseconds.           |
| `payload`          | Opaque payload bytes.                       |
| `error`            | Optional error message for failure records. |
| `next_retry_at_ms` | Retry timestamp used by failure records.    |

## `vix::sync::wal::WalWriter`

`WalWriter` appends records to a WAL file.

```cpp id="kocuu6"
class WalWriter
{
public:
  struct Config
  {
    std::filesystem::path file_path;
    bool fsync_on_write{false};
  };

  explicit WalWriter(Config cfg);

  ~WalWriter();

  std::int64_t append(const WalRecord &rec);

  void flush();
};
```

### Methods

| Method   | Purpose                                       |
| -------- | --------------------------------------------- |
| `append` | Appends a record and returns its file offset. |
| `flush`  | Flushes buffered output.                      |

### Example

```cpp id="ryo9vb"
vix::sync::wal::WalWriter writer(
  vix::sync::wal::WalWriter::Config{
    .file_path = "./.vix/wal.log"
  }
);

vix::sync::wal::WalRecord rec;
rec.id = "op-1";
rec.type = vix::sync::wal::RecordType::PutOperation;

const auto offset = writer.append(rec);
```

## `vix::sync::wal::WalReader`

`WalReader` reads WAL records sequentially.

```cpp id="bd6zsk"
class WalReader
{
public:
  explicit WalReader(std::filesystem::path file_path);

  void seek(std::int64_t offset);

  std::optional<WalRecord> next();

  std::int64_t current_offset() const noexcept;
};
```

### Methods

| Method           | Purpose                                            |
| ---------------- | -------------------------------------------------- |
| `seek`           | Moves the reader to a byte offset in the WAL file. |
| `next`           | Reads the next record, or returns `std::nullopt`.  |
| `current_offset` | Returns the current reader offset.                 |

### Example

```cpp id="sfk21o"
vix::sync::wal::WalReader reader("./.vix/wal.log");

reader.seek(0);

while (auto rec = reader.next())
{
  vix::print("record", rec->id);
}
```

## `vix::sync::wal::Wal`

`Wal` is a convenience wrapper around `WalWriter` and `WalReader`.

```cpp id="e2b85h"
class Wal
{
public:
  struct Config
  {
    std::filesystem::path file_path{"./.vix/wal.log"};
    bool fsync_on_write{false};
  };

  explicit Wal(Config cfg);

  std::int64_t append(const WalRecord &rec);

  std::int64_t replay(
    std::int64_t from_offset,
    const std::function<void(const WalRecord &)> &on_record
  );
};
```

### Methods

| Method   | Purpose                                                         |
| -------- | --------------------------------------------------------------- |
| `append` | Appends one record and returns the record offset.               |
| `replay` | Reads records from an offset and calls a callback for each one. |

### Example

```cpp id="cr6lu0"
vix::sync::wal::Wal wal(
  vix::sync::wal::Wal::Config{
    .file_path = "./.vix/wal.log"
  }
);

wal.replay(
  0,
  [](const vix::sync::wal::WalRecord &rec) {
    vix::print("replayed", rec.id);
  }
);
```

## Direct headers

For most application code, prefer:

```cpp id="xc9vg3"
#include <vix/sync.hpp>
```

Direct headers are available when a file intentionally depends on a narrower part of the module.

```txt id="jr4dyk"
<vix/sync/Operation.hpp>
<vix/sync/RetryPolicy.hpp>
<vix/sync/engine/SyncEngine.hpp>
<vix/sync/engine/SyncWorker.hpp>
<vix/sync/outbox/Outbox.hpp>
<vix/sync/outbox/OutboxStore.hpp>
<vix/sync/outbox/FileOutboxStore.hpp>
<vix/sync/wal/Wal.hpp>
<vix/sync/wal/WalReader.hpp>
<vix/sync/wal/WalRecord.hpp>
<vix/sync/wal/WalWriter.hpp>
```

## Link target

Link the module with:

```cmake id="zu3kh7"
target_link_libraries(my_app
  PRIVATE
    vix::sync
)
```

Use `PUBLIC` only when your public headers expose sync types.

## Summary

The sync API is centered on a small set of durable synchronization concepts. `Operation` describes the work, `Outbox` persists and coordinates it, `OutboxStore` provides the storage contract, `ISyncTransport` performs delivery, and `SyncEngine` drives workers over time. The WAL types provide a lower-level append-only log for custom recovery designs.

For normal application code, include `<vix/sync.hpp>`, create an outbox with a store, provide a transport, and let the engine process operations with `tick()` or `start()`.
