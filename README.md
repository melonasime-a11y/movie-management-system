# Movie Management System API

A REST API for managing a cinema: movies, screening sessions, users, and ticket purchases. Built with NestJS following a Domain-Driven Design (DDD) layered architecture.

Managers maintain the movie catalogue and the screening schedule. Customers register, buy tickets for sessions they are old enough to attend, watch movies with their tickets, and review their watch history.

## Technologies

| Area | Technology |
| --- | --- |
| Framework | [NestJS](https://nestjs.com) 12, TypeScript |
| Persistence | TypeORM with SQLite (`better-sqlite3` driver) |
| Authentication | JWT (`@nestjs/jwt`), passwords hashed with `bcrypt` |
| Validation | `class-validator` / `class-transformer` via a global `ValidationPipe` |
| API docs | Swagger / OpenAPI (`@nestjs/swagger`) |
| Testing | Jest, Supertest, `@nestjs/testing` |
| Linting / formatting | oxlint, Prettier |

## Features and business rules

### Users and authentication
- Public registration (`POST /auth/register`) always creates a **customer**. The request body cannot set a role; unknown properties are rejected.
- Passwords are hashed with bcrypt (cost factor 10). Password hashes are never returned by any endpoint.
- Login (`POST /auth/login`) returns a JWT that is valid for 1 day. Its payload contains the user id (`sub`), `username`, and `role`.
- Duplicate usernames are rejected with `409 Conflict`.

### Roles
- **Manager**: create, update, and delete movies and sessions.
- **Customer**: buy tickets, watch movies, and view their own tickets.
- Any authenticated user can list and view movies and sessions.

### Movies
- Fields: `name` (unique) and `ageRestriction` (integer, 0 or more).
- Creating or renaming a movie to a name that already exists returns `409 Conflict`.

### Sessions (screenings)
- A session belongs to one movie and has a `date` (`YYYY-MM-DD`), a `timeSlot`, and a `roomNumber` (positive integer).
- Allowed time slots: `10-12`, `12-14`, `14-16`, `16-18`, `18-20`, `20-22`, `22-00`.
- The referenced movie must exist (`404` otherwise).
- A room cannot have two sessions on the same date and time slot (`409 Conflict`). This is enforced by the application and by a database unique constraint.

### Tickets
- Only customers can buy tickets. The buyer is always the authenticated user; a `userId` in the request body is rejected.
- The session (and its movie) must exist.
- The customer's age must be greater than or equal to the movie's `ageRestriction`; otherwise `403 Forbidden`.
- A customer cannot buy two tickets for the same session (`409 Conflict`, also enforced by a unique constraint on `(userId, sessionId)`).
- A customer can only watch using a ticket they own (`403` for someone else's ticket). Watching marks the ticket as `watched`; watching the same ticket again returns `409 Conflict`.
- Watch history returns only the customer's watched tickets; unused tickets returns only their unwatched tickets.

### Cross-cutting
- **Swagger UI** at `/docs`, with Bearer JWT support.
- **Request logging middleware**: logs the HTTP method, URL, and timestamp of every request. Request bodies and headers (passwords, tokens) are never logged.
- **Response time interceptor**: adds an `X-Response-Time` header (for example `3ms`) without changing the response body.
- **Domain error mapping**: domain errors are translated into HTTP responses by a global exception filter. Raw database errors are not exposed.

## Architecture

Each feature module is split into four layers. Dependencies point inward: presentation depends on application, application depends on domain, and infrastructure implements interfaces defined by the domain.

| Layer | Responsibility | Depends on |
| --- | --- | --- |
| `domain` | Pure TypeScript entities, domain errors, and repository interfaces with injection tokens (for example `MOVIE_REPOSITORY`). No NestJS, TypeORM, or HTTP imports. | Nothing |
| `application` | Use cases (one class per operation) and DTOs. Use cases depend on repository interfaces, never on TypeORM. | `domain` |
| `infrastructure` | TypeORM persistence entities, mappers between persistence and domain entities, repository implementations, and other adapters (for example bcrypt). | `domain` |
| `presentation` | Thin HTTP controllers: request, DTO validation, use case, response. Authorization is declared with guards and the `@Roles` decorator. | `application` |

Modules collaborate through repository tokens rather than each other's TypeORM repositories. For example, ticket purchase uses `USER_REPOSITORY`, `SESSION_REPOSITORY`, and `MOVIE_REPOSITORY` to load the user, session, and movie.

```
src/
├── main.ts                     # Bootstrap: global ValidationPipe, Swagger at /docs
├── app.module.ts               # Root module: config, TypeORM, feature modules, middleware, filter, interceptor
├── auth/
│   ├── application/            # dto/, errors/, use-cases/ (register, login)
│   ├── guards/                 # JwtAuthGuard, RolesGuard
│   └── presentation/           # controllers/, decorators/ (@Roles)
├── user/
│   ├── domain/                 # entities/ (User, UserRole), errors/, repositories/, services/ (PasswordHasher)
│   ├── application/            # dto/, use-cases/
│   ├── infrastructure/         # persistence/, repositories/, security/ (bcrypt)
│   └── presentation/           # controllers/
├── movie/
│   ├── domain/                 # entities/, errors/, repositories/
│   ├── application/            # dto/, use-cases/
│   ├── infrastructure/         # persistence/ (ORM entity + mapper), repositories/
│   └── presentation/           # controllers/
├── session/                    # same layout as movie/
├── ticket/                     # same layout as movie/
└── shared/
    ├── domain/                 # base error categories (NotFound, Conflict, Forbidden, ...)
    ├── infrastructure/         # config/ (JWT secret), middleware/ (request logger)
    └── presentation/           # filters/ (domain error filter), interceptors/ (response time)

test/
├── *.e2e-spec.ts               # end-to-end suites
├── setup-e2e-env.ts            # points E2E runs at a temporary SQLite file
├── utils/                      # E2E app bootstrap and HTTP helpers
└── fakes/                      # in-memory repositories used by unit tests
```

## Getting started

### Prerequisites
- **Node.js**: `^20.19.0`, `^22.13.0`, or `>=24.11.0` (the range supported by TypeORM 1.x). Developed with Node.js 24.
- **npm** (bundled with Node.js).
- `bcrypt` and `better-sqlite3` are native modules. Prebuilt binaries are normally downloaded automatically. If no prebuilt binary matches your platform, a C/C++ build toolchain and Python are required.

### Installation

```bash
git clone https://github.com/melonasime-a11y/movie-management-system.git
cd movie-management-system
npm install
```

### Environment configuration

Copy the example file and adjust it:

```bash
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env`.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `3000` | HTTP port. |
| `NODE_ENV` | No | unset | Set to `production` in production. |
| `DATABASE_URL` | No | `database.sqlite` | Path of the SQLite database file. |
| `JWT_SECRET` | **Yes in production** | development fallback | Secret used to sign and verify JWTs. |
| `OBSERVE_APP_KEY`, `OBSERVE_APP_SECRET` | No | placeholders | Optional [NestJS Observe](https://observe.nestjs.com) telemetry keys. Without them, no telemetry is sent. |

`.env` is loaded from the working directory. Variables already set in the environment take precedence.

**JWT secret rules**
- When `NODE_ENV=production`, the application **refuses to start** if `JWT_SECRET` is missing, blank, or still a known placeholder (`development-secret` or the `.env.example` value).
- Outside production, a development fallback secret is used when `JWT_SECRET` is not set. Do not rely on it for any shared or deployed environment.
- Generate a strong secret with:

  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

`.env` and all `*.sqlite` files are listed in `.gitignore` and must not be committed.

## Running the application

```bash
# development
npm run start

# watch mode
npm run start:dev

# debug + watch mode
npm run start:debug

# production build and run
npm run build
npm run start:prod
```

`npm run start:prod` runs `node dist/main` and does not set `NODE_ENV` for you. In production, set `NODE_ENV=production` and a real `JWT_SECRET` in the environment (or in `.env`).

The database schema is created automatically on startup (TypeORM `synchronize: true`).

## API documentation

Once the application is running, Swagger UI is available at:

```
http://localhost:3000/docs
```

To call protected endpoints from Swagger UI, log in with `POST /auth/login`, click **Authorize**, and paste the `accessToken`.

## API routes

Protected routes require the header `Authorization: Bearer <accessToken>`.

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/` | Public | Returns `Hello World!` |
| `POST` | `/auth/register` | Public | Register a customer |
| `POST` | `/auth/login` | Public | Log in and receive a JWT |
| `GET` | `/movies` | Authenticated | List movies |
| `GET` | `/movies/:id` | Authenticated | Get a movie |
| `POST` | `/movies` | Manager | Create a movie |
| `PATCH` | `/movies/:id` | Manager | Update a movie |
| `DELETE` | `/movies/:id` | Manager | Delete a movie |
| `GET` | `/sessions` | Authenticated | List sessions |
| `GET` | `/sessions/:id` | Authenticated | Get a session |
| `POST` | `/sessions` | Manager | Create a session |
| `PATCH` | `/sessions/:id` | Manager | Update a session |
| `DELETE` | `/sessions/:id` | Manager | Delete a session |
| `POST` | `/tickets` | Customer | Buy a ticket (`{ "sessionId": 1 }`) |
| `POST` | `/tickets/:id/watch` | Customer (ticket owner) | Watch a movie with a ticket |
| `GET` | `/tickets/history` | Customer | Your watched tickets |
| `GET` | `/tickets/unused` | Customer | Your unused tickets |

### Error responses

Errors use the standard NestJS shape, for example:

```json
{ "message": "Movie with id 42 not found", "error": "Not Found", "statusCode": 404 }
```

| Status | When |
| --- | --- |
| `400` | Invalid request body or route parameter, or unknown properties in the body |
| `401` | Missing, malformed, invalid, or expired JWT; wrong login credentials |
| `403` | Authenticated but wrong role, underage for the movie, or not the ticket owner |
| `404` | Movie, session, ticket, or user not found |
| `409` | Duplicate username, movie name, room booking, or ticket; ticket already watched |

## Creating a manager account

There is intentionally **no public endpoint** for creating managers. Promote an existing user directly in the database. This requires access to the server and its database file:

1. Register the user normally with `POST /auth/register`.
2. Stop the application or make sure nothing else is writing to the database, then run the following from the project root, replacing `alice` with the username:

   ```bash
   node -e "const r = require('better-sqlite3')(process.env.DATABASE_URL || 'database.sqlite').prepare('UPDATE users SET role = ? WHERE username = ?').run('manager', process.argv[1]); console.log(r.changes === 1 ? 'Promoted to manager' : 'No user found with that username')" alice
   ```

   The command uses `DATABASE_URL` from your shell environment (not from `.env`) and defaults to `database.sqlite`. It works in Bash and PowerShell.
3. Log in again. The role is stored in the JWT, so tokens issued before the promotion still carry the `customer` role until they expire.

## Example customer workflow

The examples use `curl` in a Bash-compatible shell, against a fresh database. Replace `<customer-token>` and `<manager-token>` with the `accessToken` values returned by login.

```bash
# 1. Register and log in as a customer
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret123","age":30}'

curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret123"}'

# 2. As a manager (see "Creating a manager account"), create a movie and a session
curl -X POST http://localhost:3000/movies \
  -H "Authorization: Bearer <manager-token>" -H "Content-Type: application/json" \
  -d '{"name":"Inception","ageRestriction":13}'

curl -X POST http://localhost:3000/sessions \
  -H "Authorization: Bearer <manager-token>" -H "Content-Type: application/json" \
  -d '{"movieId":1,"date":"2030-01-15","timeSlot":"18-20","roomNumber":1}'

# 3. As the customer, buy a ticket, watch the movie, and check history
curl -X POST http://localhost:3000/tickets \
  -H "Authorization: Bearer <customer-token>" -H "Content-Type: application/json" \
  -d '{"sessionId":1}'

curl -X POST http://localhost:3000/tickets/1/watch \
  -H "Authorization: Bearer <customer-token>"

curl http://localhost:3000/tickets/history -H "Authorization: Bearer <customer-token>"
curl http://localhost:3000/tickets/unused  -H "Authorization: Bearer <customer-token>"
```

Buying the same session again returns `409`. A customer younger than the movie's `ageRestriction` receives `403`.

## Testing

```bash
npm run test        # unit tests
npm run test:watch  # unit tests in watch mode
npm run test:cov    # unit tests with coverage report (./coverage)
npm run test:e2e    # end-to-end tests
npm run lint        # oxlint (type-aware)
npm run format      # Prettier
```

### Test strategy

**Unit tests** (`src/**/*.spec.ts`) run without a server or a real database:
- **Use cases** are tested against in-memory repository fakes from `test/fakes/`. This covers business rules such as age restrictions, duplicates, ownership, and double booking.
- **Controllers** are tested over HTTP with Supertest in a minimal Nest testing module. Each module uses the real guards, `@Roles` metadata, validation pipe, and error filter, with in-memory repositories. This verifies status codes and authorization per role.
- **TypeORM repositories** are tested against an in-memory SQLite database to confirm that database unique-constraint violations become domain conflict errors.
- **Shared components** (JWT secret rules, request logger, response-time interceptor, Swagger bootstrap) have focused tests.

**End-to-end tests** (`test/*.e2e-spec.ts`) start the complete `AppModule` and exercise the public HTTP API:
- The full workflow: register, login, manager setup, create movie, create session, buy ticket, duplicate purchase, watch, history, and unused tickets.
- Authentication and authorization (`401` and `403`), ticket ownership, underage purchases, room double booking, invalid DTOs (`400`), and unknown resources (`404`).

**E2E database isolation**: `test/setup-e2e-env.ts` points `DATABASE_URL` at a unique temporary SQLite file in the OS temp directory before each E2E spec file loads. The test bootstrap verifies that TypeORM is connected to that file and deletes it after the suite. The local `database.sqlite` is never read or modified. Manager accounts in E2E tests are created by a test-only fixture that uses the application's own user repository and password hasher.

## Known limitations

- **No manager provisioning endpoint.** Managers must be promoted directly in the database (see above).
- **Schema synchronization instead of migrations.** TypeORM `synchronize: true` alters the schema automatically on startup. This is convenient for development but unsafe for production data; migrations would be needed for a real deployment.
- **SQLite only.** The database is a single local file and is not suited to high write concurrency or multiple application instances.
- **No referential integrity between modules.** Sessions store `movieId` and tickets store `userId` and `sessionId` as plain columns without foreign keys. Deleting a movie or session does not cascade to, or block on, related sessions or tickets.
- **No session date validation beyond format.** Sessions can be scheduled in the past, and tickets can be bought for past sessions. There is no seat or room capacity limit.
- **Stateless JWTs.** There is no logout, refresh token, or token revocation. Role changes take effect only after the user logs in again.
- **No pagination** on list endpoints.
- **Swagger is enabled in every environment**, including production.
- **The `/user` controller has no routes.** User creation goes through `/auth/register`.
- **Validation pipe configuration is duplicated.** It is registered in `src/main.ts`, and the E2E bootstrap (`test/utils/e2e-app.ts`) repeats the same options.
- **Development dependency advisories.** `npm audit` reports advisories in development tooling only (Jest, `@nestjs/cli`, `@nestjs/mau`). `npm audit --omit=dev` reports no vulnerabilities in production dependencies. The suggested automatic fixes are breaking downgrades and have not been applied.
