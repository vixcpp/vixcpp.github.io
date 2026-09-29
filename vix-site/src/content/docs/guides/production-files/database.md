---
title: Production Database
description: Configure SQLite storage, migrations, status checks, and backups for production projects.
---

# Production Database

The production database section describes how Vix inspects and manages the database files used by a deployed application. In the current production workflow, Vix focuses on SQLite because it is simple to ship, easy to inspect on a server, and useful for many small and medium C++ services.

Vix reads database metadata from the `database` section in `vix.json`. The same configuration is used by `vix db status`, `vix db migrate`, and `vix db backup`, so the project has one clear place to describe where the database file lives, where migrations are stored, and how the storage directory should be checked.

## Why database metadata matters

A C++ application can start correctly but still fail when it tries to open its database. The storage directory may not exist, the service user may not have write permission, the migrations directory may be missing, or the database file may be in a different path from the one used by the application.

Vix keeps this information in the project so database checks can happen before and after deployment. The database command does not replace the application’s database layer. It gives the project a small operational workflow for checking storage, applying SQL migrations, and creating safe backup copies of SQLite files.

## Basic configuration

A minimal SQLite configuration looks like this:

```json
{
  "name": "myapp",

  "database": {
    "engine": "sqlite",
    "sqlite": {
      "path": "storage/myapp.db"
    },
    "storage": "storage",
    "migrations": "migrations"
  }
}
```

The database path points to the SQLite file used by the application. The storage directory is the directory that should exist and be writable. The migrations directory contains SQL migration files that Vix can apply.

## Flat SQLite path

Vix also accepts a flat SQLite path for projects that prefer a shorter configuration.

```json
{
  "name": "myapp",

  "database": {
    "engine": "sqlite",
    "sqlite_path": "storage/myapp.db",
    "storage": "storage",
    "migrations": "migrations"
  }
}
```

Both forms describe the same thing. The nested form is clearer for larger configuration files, while the flat form is convenient for small projects.

## Fields

| Field                  | Purpose                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `database.engine`      | Database engine used by the project. Current command support is focused on `sqlite`. |
| `database.sqlite.path` | SQLite database file path, using the nested form.                                    |
| `database.sqlite_path` | SQLite database file path, using the flat form.                                      |
| `database.storage`     | Storage directory that should exist and be writable.                                 |
| `database.migrations`  | Directory containing file-based SQL migrations.                                      |

If a project name can be resolved from `vix.json`, Vix uses it when building default paths. When no database path is configured, the default path follows this shape:

```txt
storage/<project>.db
```

## Commands

Inspect the database storage state:

```bash
vix db status
```

Print the status report as JSON:

```bash
vix db status --json
```

Apply pending migrations:

```bash
vix db migrate
```

Create a timestamped SQLite backup:

```bash
vix db backup
```

The default `vix db` command is the same as `vix db status`.

```bash
vix db
```

## Database status

`vix db status` checks the configured database storage without changing the database.

```bash
vix db status
```

The command checks whether the database looks like SQLite, whether the storage directory exists, whether it is writable, whether the database file exists, whether SQLite WAL and SHM sidecar files are present, and whether the migrations directory exists.

This is useful before running migrations, after installing a service, or when the application starts but cannot open the database.

```txt
storage/
migrations/
```

If the storage directory is missing or not writable, Vix treats it as a blocking problem. If the database file does not exist yet, Vix reports a warning because a new SQLite database may be created later during migration or application startup.

## Migrations

`vix db migrate` applies file-based SQL migrations from the configured migrations directory.

```bash
vix db migrate
```

The current migration workflow is intentionally focused on SQLite. Vix expects the storage directory and migrations directory to exist before running the command. If the SQLite database file does not exist yet, the migration step can create it.

A typical layout looks like this:

```txt
storage/
  myapp.db

migrations/
  001_create_users.up.sql
  002_create_posts.up.sql
```

The migration files should be kept small and explicit. They are part of the project history, so they should be readable by another developer without needing to understand the full application code.

## Backups

`vix db backup` creates a timestamped copy of the configured SQLite database.

```bash
vix db backup
```

Backups are written to:

```txt
backups/
```

The generated backup name includes the database file stem and a timestamp.

```txt
backups/myapp-20260703-142530.db
```

When SQLite sidecar files are present, Vix also copies the WAL and SHM files beside the database backup.

```txt
backups/myapp-20260703-142530.db
backups/myapp-20260703-142530.db-wal
backups/myapp-20260703-142530.db-shm
```

This matters because SQLite may keep recent writes in the WAL file depending on how the database is configured and how the application is running.

## SQLite sidecar files

SQLite can create sidecar files next to the main database file.

```txt
storage/myapp.db
storage/myapp.db-wal
storage/myapp.db-shm
```

The WAL file can contain recent database changes. The SHM file is used for shared-memory coordination. Vix reports whether those files exist during `vix db status`, and copies them when creating a backup if they are present.

Do not delete these files casually while the application is running. If you need to inspect or move a database, stop the service first or use a backup workflow that respects SQLite’s runtime files.

## Using database commands with an existing C++ project

An existing C++ project can use Vix database commands without using a Vix-generated template. The project only needs a `vix.json` file that describes the database paths used by the deployed application.

```json
{
  "name": "legacy-api",

  "database": {
    "engine": "sqlite",
    "sqlite": {
      "path": "storage/legacy-api.db"
    },
    "storage": "storage",
    "migrations": "migrations"
  },

  "production": {
    "service": {
      "name": "legacy-api",
      "user": "deploy",
      "working_dir": "/srv/legacy-api",
      "exec": "/srv/legacy-api/build/legacy-api"
    }
  }
}
```

The application can keep its own CMake files, its own database wrapper, and its own directory layout. Vix only uses the metadata to check storage, apply migrations, and create backups from the project root.

## Database and deployment

Database checks should normally happen before deployment when a release depends on storage or migrations.

```bash
vix db status
vix db backup
vix db migrate
vix deploy --dry-run
```

For a production server, take a backup before applying migrations that change existing data.

```bash
vix service status
vix db backup
vix db migrate
vix health local
```

The exact order depends on the application, but the principle is stable: confirm the service state, back up the current database, apply migrations, then verify the application through health checks.

## Database and health checks

A health endpoint should not perform heavy database work, but it can be useful for the application to fail health checks when the database is unavailable. This helps deployment catch runtime problems after the service restart.

```json
{
  "production": {
    "health": {
      "service": "myapp",
      "local": "http://127.0.0.1:8080/health",
      "expected_status": 200,
      "timeout_ms": 2000,
      "max_response_ms": 1000
    }
  }
}
```

After a migration, run:

```bash
vix health local
vix logs errors --repeated
```

If the application cannot open the database, the health check or logs should make the problem visible quickly.

## Common problems

If Vix reports that the storage directory is missing, create it before running migrations or starting the service.

```bash
mkdir -p storage
vix db status
```

If the storage directory is not writable, fix ownership or permissions for the user that runs the application.

```bash
sudo chown -R deploy:deploy storage
vix db status
```

If the migrations directory is missing, create it and add SQL migration files.

```bash
mkdir -p migrations
vix db status
```

If `vix db backup` fails because the database file does not exist, create the database first by running migrations or starting the application, depending on the project workflow.

```bash
vix db migrate
vix db backup
```

If `vix db migrate` says SQLite support is not available in the current CLI build, rebuild or install a Vix CLI build that includes the database module.

## Practical workflow

A clean database workflow starts with status.

```bash
vix db status
```

Before changing schema or data, create a backup.

```bash
vix db backup
```

Then apply migrations and check the application.

```bash
vix db migrate
vix health local
vix logs errors --repeated
```

Keep the database paths accurate. The storage directory should match the directory used by the running service, the migrations directory should be committed with the project, and backups should be created before changes that may affect existing data.

## Next step

Continue with the WebSocket documentation to configure local and public WebSocket checks for applications that expose real-time connections.
