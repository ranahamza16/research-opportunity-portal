# &#x09;University Research Opportunity Portal

A web application where faculty members post, view, update and manage research opportunities in one place, replacing scattered emails, WhatsApp groups and noticeboards.

|||
|-|-|
|**Student**|Hamza Rana|
|**Reg. No.**|P24-0587|
|**Class**|BS (CS 5C), Fall 2026|
|**Course**|Computer Networks (CN), Assignment #01|
|**GitHub Repository**|https://github.com/ranahamza16/research-opportunity-portal|
|**Demo Video (1 min)**|https://drive.google.com/file/d/1Ck5shGatUtlwvExv6iYlKjBp1NMFy2q0/view?usp=drive\_link|

## Tech stack

* **Backend:** Node.js + Express (REST API)
* **Database:** MySQL (`mysql2` driver, connection pool, parameterized queries)
* **Frontend:** HTML, CSS, vanilla JavaScript (served by the same Express server)
* **API testing:** Postman collection (also importable into Bruno)

## Project structure

```
research-opportunity-portal/
├── backend/
│   ├── server.js                  # Express app, static frontend, error handling
│   ├── db.js                      # Chooses the database backend (mysql / sqlite)
│   ├── db/mysql.js, db/sqlite.js  # Database implementations
│   ├── routes/opportunities.js    # CRUD endpoints + validation
│   ├── scripts/init-db.js         # Creates the database/table from schema.sql
│   ├── package.json
│   └── .env.example               # Copy to .env and fill in your DB details
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js                     # Talks to the API with fetch()
├── database/
│   └── schema.sql                 # Database + table definition
├── postman/
│   └── Research\_Portal.postman\_collection.json
└── README.md
```

## Setup and run

**Prerequisites:** [Node.js](https://nodejs.org/) 18 or newer and a running MySQL server (MySQL Community Server or XAMPP/MariaDB).

1. **Get the code**

```bash
   git clone https://github.com/ranahamza16/research-opportunity-portal.git
   cd research-opportunity-portal/backend
   ```

2. **Install dependencies**

```bash
   npm install
   ```

3. **Configure the database connection.** Copy the example file and put in your own MySQL password (this file is git-ignored and must never be committed):

```bash
   # Windows (Command Prompt)
   copy .env.example .env
   # macOS / Linux / Git Bash
   cp .env.example .env
   ```

   Edit `.env`:

```
   PORT=5000
   DB\_CLIENT=mysql
   DB\_HOST=127.0.0.1
   DB\_PORT=3306
   DB\_USER=root
   DB\_PASSWORD=your\_mysql\_password
   DB\_NAME=research\_portal
   ```

4. **Create the database and table** (either option):

```bash
   npm run init-db
   ```

   or import the schema yourself: `mysql -u root -p < ../database/schema.sql`

5. **Start the server**

```bash
   npm start
   ```

   You should see `Server running on http://localhost:5000` and `Connected to MySQL`.

> \*\*No MySQL available?\*\* Set `DB\_CLIENT=sqlite` in `.env` and skip step 4. The app then stores data in a local SQLite file (`backend/data/`, created automatically; needs Node 22.5+). The assignment's database is MySQL, so `DB\_CLIENT=mysql` is the default.

6. **Open the app:** http://localhost:5000

The database starts empty. All data is created through the application and stored in MySQL; nothing is hard-coded.

## REST API

Base URL: `http://localhost:5000/api/opportunities`

|Method|Endpoint|Description|Success|Errors|
|-|-|-|-|-|
|POST|`/api/opportunities`|Create an opportunity|201|400, 500|
|GET|`/api/opportunities`|List all opportunities|200|500|
|GET|`/api/opportunities/:id`|Get one opportunity|200|400, 404, 500|
|PUT|`/api/opportunities/:id`|Update any subset of fields (including `status`)|200|400, 404, 500|
|DELETE|`/api/opportunities/:id`|Delete an opportunity|200|400, 404, 500|

### Opportunity fields

|Field|Type|Rules|
|-|-|-|
|`id`|integer|auto-generated|
|`title`|string|required|
|`description`|string|required|
|`research\_area`|string|required|
|`faculty\_name`|string|required|
|`department`|string|required|
|`required\_skills`|string|required|
|`available\_positions`|integer|required, 1 or more|
|`application\_deadline`|date|required, `YYYY-MM-DD`, must be a real date|
|`status`|`Open` or `Closed`|optional on create (defaults to `Open`)|

### Example

`POST /api/opportunities`

```json
{
  "title": "Secure Authentication for IoT Networks",
  "description": "Design lightweight authentication for sensors.",
  "research\_area": "Computer Networks",
  "faculty\_name": "Dr. Ayesha Khan",
  "department": "Computer Science",
  "required\_skills": "C, Networking",
  "available\_positions": 1,
  "application\_deadline": "2026-11-30"
}
```

Response `201 Created` returns the saved record including its `id`, `status` and timestamps.

Validation failure, `400 Bad Request`:

```json
{ "error": "Validation failed", "details": \["description is required", "available\_positions must be a whole number of at least 1"] }
```

Unknown id, `404 Not Found`:

```json
{ "error": "Research opportunity with ID 3 not found" }
```

## Frontend features

* Lists all opportunities from the API, with All / Open / Closed filter and live counts
* View full details of a selected opportunity (loaded with `GET /:id`)
* Form to create an opportunity, with required-field validation
* Edit an existing opportunity using the same form
* Close an opportunity (Open to Closed) in one click, and reopen it
* Delete with a confirmation dialog
* Success and error messages for every action, including server validation errors and "server not reachable"

## API testing with Postman (or Bruno)

Import `postman/Research\_Portal.postman\_collection.json` (Bruno: *Import Collection, Postman*). Start the backend, then run the requests in order 1 to 10:

1. Create opportunity 1, 2 and 3 (their ids are saved automatically)
2. Get all opportunities
3. Get one opportunity by id
4. Update an opportunity
5. Change status Open to Closed
6. Delete an opportunity
7. Get the deleted opportunity, which returns **404 Not Found**
8. Create with missing/invalid data, which returns **400 Bad Request**

Each request has test scripts, so the Collection Runner shows pass/fail results. The collection expects an empty or any database; it does not depend on specific ids.

## Security notes

* Database credentials live only in `backend/.env`, which is listed in `.gitignore`. Only `.env.example` (no secrets) is committed.
* All SQL uses parameterized queries.
* The frontend inserts data with `textContent`, so stored text cannot inject HTML.

