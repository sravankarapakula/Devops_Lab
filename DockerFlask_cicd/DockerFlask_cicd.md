# Docker Lab on Ubuntu: Flask Application and Three-Tier Student Attendance Portal

## Table of Contents

- [1. Lab Overview](#1-lab-overview)
- [2. Install Docker on Ubuntu](#2-install-docker-on-ubuntu)
- [3. Exercise 1: Flask Application in a Docker Container](#3-exercise-1-flask-application-in-a-docker-container)
- [4. Exercise 2: Three-Container Student Attendance Portal](#4-exercise-2-three-container-student-attendance-portal)
- [5. Build and Run the Application](#5-build-and-run-the-application)
- [6. Verify the Application](#6-verify-the-application)
- [7. Inspect and Debug Containers](#7-inspect-and-debug-containers)
- [8. Stop, Restart, and Clean Up](#8-stop-restart-and-clean-up)
- [9. Troubleshooting](#9-troubleshooting)
- [10. Quick Revision Commands](#10-quick-revision-commands)
- [11. Viva Questions and Answers](#11-viva-questions-and-answers)

---

## 1. Lab Overview

This lab demonstrates how to containerize a Python Flask application and then deploy a multi-container student attendance application using Docker Compose.

### Exercise 1: Single-container Flask application

A simple Flask application is built into a Docker image and run inside a container.

**Features:**

- Displays an application status message.
- Provides a health-check endpoint.
- Demonstrates image building, container lifecycle management, logs, inspection, and interactive shell access.

### Exercise 2: Three-container student attendance portal

A web application is deployed using three services:

| Service | Technology | Responsibility |
|---|---|---|
| Frontend | Nginx | Serves the HTML page and forwards API requests |
| Backend | Python Flask | Handles attendance requests and database operations |
| Database | MySQL 8.0 | Stores student attendance records |

### Architecture

```text
                 User's Browser
                        |
                        | http://localhost:8080
                        v
              +--------------------+
              | Frontend Container |
              |       Nginx        |
              |      Port 80       |
              +--------------------+
                        |
                        | /api/attendance
                        v
              +--------------------+
              | Backend Container  |
              |    Flask API       |
              |     Port 5000      |
              +--------------------+
                        |
                        | MySQL connection
                        | Port 3306
                        v
              +--------------------+
              | Database Container |
              |      MySQL 8.0     |
              |     Port 3306      |
              +--------------------+
                        |
                        v
              Docker Named Volume
                 attendance_data
```

### Port mapping

| Application | Host port | Container port | Access |
|---|---:|---:|---|
| Exercise 1 Flask | 5000 | 5000 | `http://localhost:5000` |
| Exercise 2 Nginx | 8080 | 80 | `http://localhost:8080` |
| Exercise 2 Flask API | 5001 | 5000 | `http://localhost:5001/attendance` |
| MySQL | Not published | 3306 | Internal Docker network only |

**Important:** All commands use `sudo docker`, so adding your user to the Docker group is not required.

The passwords used in this lab are for demonstration only. Do not use these credentials in production.

---

## 2. Install Docker on Ubuntu

### Step 1: Check your Ubuntu installation

Open the Ubuntu terminal and run:

```bash
cat /etc/os-release
docker --version
docker compose version
sudo systemctl status docker --no-pager
```

If Docker and Docker Compose are already installed and the Docker service is running, proceed to the workspace setup.

### Step 2: Install Docker Engine

If Docker is missing, install it using the official Docker repository.

Update the package list:

```bash
sudo apt-get update
```

Remove conflicting packages if present:

```bash
sudo apt-get remove -y docker.io docker-compose docker-compose-v2 podman-docker containerd runc
```

Install the required packages:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
```

Create the directory for Docker's repository key:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
```

Download the official Docker GPG key:

```bash
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
```

Set the correct permissions:

```bash
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

Add the Docker repository:

```bash
sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
```

Update the package list again:

```bash
sudo apt-get update
```

Install Docker Engine, the CLI, container runtime, Buildx, and Docker Compose:

```bash
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Enable and start Docker:

```bash
sudo systemctl enable --now docker
```

### Step 3: Verify the installation

Run the Docker test container:

```bash
sudo docker run hello-world
```

Check the installed versions:

```bash
docker --version
sudo docker compose version
```

Check the service:

```bash
sudo systemctl status docker --no-pager
```

**Expected result:** The `hello-world` container runs and prints a message confirming that Docker can successfully run a container.

### Step 4: Create the lab workspace

```bash
mkdir -p ~/docker-lab
cd ~/docker-lab
pwd
```

Expected directory:

```text
/home/<your-username>/docker-lab
```

The workspace will contain the two exercises:

```text
docker-lab/
├── exercise1/
└── exercise2/
    └── student-portal/
```

---

## 3. Exercise 1: Flask Application in a Docker Container

### Objective

Create a Flask application, build a Docker image, run a container, inspect it, view its logs, access its shell, and practise container lifecycle commands.

### Step 1: Create the project directory

```bash
mkdir -p ~/docker-lab/exercise1
cd ~/docker-lab/exercise1
```

### Step 2: Create `app.py`

```bash
nano app.py
```

Paste the following code:

```python
from flask import Flask

app = Flask(__name__)


@app.route("/")
def home():
    return "Student Attendance Application is running!"


@app.route("/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

Save the file in Nano:

1. Press `Ctrl + O`.
2. Press `Enter`.
3. Press `Ctrl + X`.

**Code explanation:**

- `Flask(__name__)` creates the Flask application.
- `/` returns a message confirming that the application is running.
- `/health` returns a JSON health status.
- `host="0.0.0.0"` allows Flask to accept connections through the container's network interfaces.
- `port=5000` makes Flask listen on port 5000 inside the container.

### Step 3: Create the Dockerfile

```bash
nano Dockerfile
```

Paste:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir Flask

COPY app.py .

EXPOSE 5000

CMD ["python", "app.py"]
```

Save and exit Nano.

**Dockerfile explanation:**

| Instruction | Purpose |
|---|---|
| `FROM python:3.11-slim` | Uses a lightweight Python base image |
| `WORKDIR /app` | Sets `/app` as the working directory |
| `RUN pip install --no-cache-dir Flask` | Installs Flask during image creation |
| `COPY app.py .` | Copies the Python application into the image |
| `EXPOSE 5000` | Documents the port used by the application |
| `CMD ["python", "app.py"]` | Starts the application when the container runs |

`EXPOSE` does not publish a port to the host. Port publishing is configured with the `-p` option when running the container.

### Step 4: Build the Docker image

Make sure you are inside `~/docker-lab/exercise1`.

```bash
sudo docker build -t student-attendance:v1 .
```

Explanation:

- `docker build` creates an image.
- `-t student-attendance:v1` assigns the image name and tag.
- `.` uses the current directory as the build context.

List the images:

```bash
sudo docker images
```

Inspect the image:

```bash
sudo docker image inspect student-attendance:v1
```

Inspect the working directory:

```bash
sudo docker image inspect --format '{{.Config.WorkingDir}}' student-attendance:v1
```

Expected output:

```text
/app
```

Inspect the default command:

```bash
sudo docker image inspect --format '{{json .Config.Cmd}}' student-attendance:v1
```

Expected output:

```json
["python","app.py"]
```

Inspect the exposed ports:

```bash
sudo docker image inspect --format '{{json .Config.ExposedPorts}}' student-attendance:v1
```

Expected output:

```json
{"5000/tcp":{}}
```

### Step 5: Run the container

```bash
sudo docker run -d \
  --name student-attendance-container \
  -p 5000:5000 \
  student-attendance:v1
```

Explanation:

- `-d` runs the container in detached mode.
- `--name` assigns a recognizable container name.
- `-p 5000:5000` maps host port 5000 to container port 5000.
- `student-attendance:v1` specifies the image.

Check running containers:

```bash
sudo docker ps
```

List all containers, including stopped ones:

```bash
sudo docker ps -a
```

### Step 6: Test the application

Open the following URL in your browser:

```text
http://localhost:5000
```

Expected response:

```text
Student Attendance Application is running!
```

Open the health endpoint:

```text
http://localhost:5000/health
```

Expected response:

```json
{"status":"healthy"}
```

You can also test both endpoints from the terminal:

```bash
curl http://localhost:5000/
curl http://localhost:5000/health
```

### Step 7: Inspect the running container

View the complete configuration:

```bash
sudo docker inspect student-attendance-container
```

Check the container status:

```bash
sudo docker inspect --format '{{.State.Status}}' student-attendance-container
```

Check port mappings:

```bash
sudo docker inspect --format '{{json .NetworkSettings.Ports}}' student-attendance-container
```

Check the image used:

```bash
sudo docker inspect --format '{{.Config.Image}}' student-attendance-container
```

### Step 8: View container logs

Display all available logs:

```bash
sudo docker logs student-attendance-container
```

Follow the logs continuously:

```bash
sudo docker logs -f student-attendance-container
```

Display only the latest 20 lines:

```bash
sudo docker logs --tail 20 student-attendance-container
```

Press `Ctrl + C` to stop following logs. This does not stop the container.

### Step 9: Enter the container

Open an interactive shell:

```bash
sudo docker exec -it student-attendance-container /bin/sh
```

Run the following commands **inside the container**:

```bash
pwd
ls -la
cat app.py
python --version
pip show Flask
```

Expected working directory:

```text
/app
```

Exit the container shell:

```bash
exit
```

**Important:** `docker exec` runs a command inside an already running container. It does not create a new container.

### Step 10: Stop and restart the container

Stop the container:

```bash
sudo docker stop student-attendance-container
```

Check the status:

```bash
sudo docker ps
sudo docker ps -a
```

Start the same container again:

```bash
sudo docker start student-attendance-container
```

Test it:

```bash
sudo docker ps
curl http://localhost:5000/
```

### Step 11: Kill the container

```bash
sudo docker kill student-attendance-container
```

Check its status:

```bash
sudo docker ps -a
```

`docker stop` requests a graceful shutdown first. `docker kill` forcefully terminates the container by default.

### Step 12: Remove the container and image

Remove the stopped container:

```bash
sudo docker rm student-attendance-container
```

Verify:

```bash
sudo docker ps -a
```

Remove the image:

```bash
sudo docker rmi student-attendance:v1
```

Verify:

```bash
sudo docker images
```

**Exercise 1 is complete.**

---

## 4. Exercise 2: Three-Container Student Attendance Portal

### Objective

Build a complete web application using:

- Nginx for the frontend.
- Flask for the backend API.
- MySQL for persistent data storage.
- Docker Compose to build and manage the services.
- A Docker named volume to preserve database data.
- An Nginx reverse proxy to forward API requests to Flask.

### Step 1: Create the directory structure

```bash
cd ~/docker-lab

mkdir -p exercise2/student-portal/frontend
mkdir -p exercise2/student-portal/backend

cd exercise2/student-portal

touch compose.yaml
touch frontend/index.html
touch frontend/Dockerfile
touch frontend/nginx.conf
touch backend/app.py
touch backend/requirements.txt
touch backend/Dockerfile
```

Check the structure:

```bash
find . -maxdepth 2 -type f | sort
```

Expected output:

```text
./backend/Dockerfile
./backend/app.py
./backend/requirements.txt
./compose.yaml
./frontend/Dockerfile
./frontend/index.html
./frontend/nginx.conf
```

### Step 2: Create the frontend HTML page

Open the file:

```bash
nano frontend/index.html
```

Paste the complete code:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Attendance Portal</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 750px;
            margin: 40px auto;
            padding: 20px;
            background: #f4f6f9;
            color: #222;
        }

        h1 {
            color: #174ea6;
        }

        section {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }

        input, button {
            padding: 10px;
            margin: 5px 0;
        }

        input {
            width: 95%;
        }

        button {
            cursor: pointer;
            background: #174ea6;
            color: white;
            border: none;
            border-radius: 4px;
        }

        #message {
            white-space: pre-wrap;
        }
    </style>
</head>

<body>
    <h1>Student Attendance Portal</h1>
    <p>Frontend: Nginx | Backend: Flask | Database: MySQL</p>

    <section>
        <h2>View Attendance</h2>
        <button onclick="loadAttendance()">Load Attendance</button>
        <pre id="records">Click the button to load attendance.</pre>
    </section>

    <section>
        <h2>Add Attendance</h2>

        <form id="attendanceForm">
            <label for="name">Student name</label><br>
            <input id="name" type="text" required maxlength="100">
            <br>

            <label for="percentage">Attendance percentage</label><br>
            <input id="percentage" type="number"
                   min="0" max="100" step="0.01" required>
            <br>

            <button type="submit">Save Attendance</button>
        </form>

        <p id="message"></p>
    </section>

    <script>
        async function loadAttendance() {
            const output = document.getElementById("records");

            try {
                const response = await fetch("/api/attendance");
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Could not load attendance");
                }

                output.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                output.textContent = "Error: " + error.message;
            }
        }

        document.getElementById("attendanceForm")
            .addEventListener("submit", async function (event) {
                event.preventDefault();

                const message = document.getElementById("message");

                const student = {
                    name: document.getElementById("name").value,
                    attendance: Number(
                        document.getElementById("percentage").value
                    )
                };

                try {
                    const response = await fetch("/api/attendance", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(student)
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || "Could not save attendance");
                    }

                    message.textContent = data.message;
                    await loadAttendance();
                } catch (error) {
                    message.textContent = "Error: " + error.message;
                }
            });
    </script>
</body>
</html>
```

Save the file using `Ctrl + O`, `Enter`, and `Ctrl + X`.

**Frontend explanation:**

- The HTML displays the student attendance portal.
- The **Load Attendance** button sends a GET request to `/api/attendance`.
- The form sends a POST request to `/api/attendance`.
- The response is displayed on the page.
- The frontend uses a relative API path, so it does not need to know the backend's host port.
- Nginx forwards these API requests to the Flask service.

### Step 3: Create the frontend Dockerfile

Open:

```bash
nano frontend/Dockerfile
```

Paste:

```dockerfile
FROM nginx:alpine

COPY index.html /usr/share/nginx/html/index.html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Save and exit.

**Explanation:**

| Instruction | Purpose |
|---|---|
| `FROM nginx:alpine` | Uses a lightweight Nginx image |
| First `COPY` | Copies the HTML page into Nginx's web root |
| Second `COPY` | Installs the custom reverse-proxy configuration |
| `EXPOSE 80` | Documents the HTTP port |
| `CMD` | Starts Nginx in the foreground |

### Step 4: Configure the Nginx reverse proxy

Open:

```bash
nano frontend/nginx.conf
```

Paste:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api/ {
        proxy_pass http://backend:5000/;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Save and exit.

**How the reverse proxy works:**

The frontend browser sends requests to:

```text
http://localhost:8080/api/attendance
```

Nginx receives the request on port 80 inside its container and forwards it to:

```text
http://backend:5000/attendance
```

The trailing slash in `proxy_pass http://backend:5000/;` means Nginx replaces the matching `/api/` prefix with `/`.

The hostname `backend` is the Compose service name. Docker Compose provides internal DNS so containers can resolve each other by service name.

This arrangement means:

- The browser communicates with Nginx.
- Nginx forwards API requests to Flask.
- Flask communicates with MySQL.
- The browser never needs a direct database connection.

### Step 5: Create the backend requirements file

Open:

```bash
nano backend/requirements.txt
```

Paste:

```text
Flask
mysql-connector-python
```

Save and exit.

These dependencies are:

- `Flask`: creates the HTTP API.
- `mysql-connector-python`: connects Python to MySQL.

### Step 6: Create the Flask backend

Open:

```bash
nano backend/app.py
```

Paste the complete application:

```python
import os
import time

import mysql.connector
from flask import Flask, jsonify, request
from mysql.connector import Error

app = Flask(__name__)

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "database"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "student"),
    "password": os.getenv("DB_PASSWORD", "studentpass"),
    "database": os.getenv("DB_NAME", "attendance"),
}


def get_connection():
    return mysql.connector.connect(**DB_CONFIG)


def initialize_database():
    # Wait for MySQL to become ready before creating the table.
    for attempt in range(30):
        connection = None
        cursor = None

        try:
            connection = get_connection()
            cursor = connection.cursor()

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS attendance (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_name VARCHAR(100) NOT NULL,
                    attendance_percentage DECIMAL(5,2) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            connection.commit()
            print("Database initialized successfully.")
            return

        except Error as error:
            print(
                f"Database not ready "
                f"(attempt {attempt + 1}/30): {error}"
            )
            time.sleep(2)

        finally:
            if cursor is not None:
                cursor.close()

            if connection is not None and connection.is_connected():
                connection.close()

    raise RuntimeError(
        "Could not connect to MySQL after multiple attempts."
    )


@app.route("/health", methods=["GET"])
def health():
    connection = None

    try:
        connection = get_connection()
        connection.close()
        connection = None

        return jsonify({
            "status": "healthy",
            "database": "connected"
        }), 200

    except Error as error:
        return jsonify({
            "status": "unhealthy",
            "error": str(error)
        }), 503

    finally:
        if connection is not None and connection.is_connected():
            connection.close()


@app.route("/attendance", methods=["GET"])
def get_attendance():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                student_name,
                attendance_percentage,
                created_at
            FROM attendance
            ORDER BY id
        """)

        rows = cursor.fetchall()

        for row in rows:
            row["attendance_percentage"] = float(
                row["attendance_percentage"]
            )

            row["created_at"] = (
                row["created_at"].isoformat()
                if row["created_at"]
                else None
            )

        return jsonify(rows), 200

    except Error as error:
        return jsonify({
            "error": "Database query failed",
            "details": str(error)
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None and connection.is_connected():
            connection.close()


@app.route("/attendance", methods=["POST"])
def add_attendance():
    data = request.get_json(silent=True) or {}

    name = data.get("name")
    attendance = data.get("attendance")

    if not isinstance(name, str) or not name.strip():
        return jsonify({
            "error": "Student name is required"
        }), 400

    if len(name.strip()) > 100:
        return jsonify({
            "error": "Student name must not exceed 100 characters"
        }), 400

    try:
        attendance = float(attendance)

    except (TypeError, ValueError):
        return jsonify({
            "error": "Attendance must be a number"
        }), 400

    if not 0 <= attendance <= 100:
        return jsonify({
            "error": "Attendance must be between 0 and 100"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO attendance (
                student_name,
                attendance_percentage
            )
            VALUES (%s, %s)
        """, (name.strip(), attendance))

        connection.commit()

        return jsonify({
            "message": "Attendance saved successfully",
            "id": cursor.lastrowid
        }), 201

    except Error as error:
        return jsonify({
            "error": "Database insert failed",
            "details": str(error)
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None and connection.is_connected():
            connection.close()


if __name__ == "__main__":
    initialize_database()
    app.run(host="0.0.0.0", port=5000)
```

Save and exit Nano.

#### Backend code explanation

**Database configuration**

The database settings are read from environment variables:

- `DB_HOST`: MySQL service hostname.
- `DB_PORT`: MySQL port.
- `DB_USER`: MySQL username.
- `DB_PASSWORD`: MySQL password.
- `DB_NAME`: database name.

The default hostname is `database`, which is the name of the MySQL service in Compose. Inside a container, `localhost` would refer to that same container, not the separate MySQL container.

**Database initialization**

The `initialize_database()` function attempts to connect to MySQL and creates the `attendance` table if it does not already exist. It retries failed connections because MySQL may take time to initialize.

**GET `/attendance`**

Returns the attendance records as JSON.

**POST `/attendance`**

Accepts a JSON object containing the student's name and attendance percentage, validates the input, and inserts the record into MySQL.

Example request:

```json
{
  "name": "Rahul",
  "attendance": 92
}
```

The SQL statement uses parameterized values (`%s`) rather than concatenating user input into SQL. This is important for preventing SQL injection.

`connection.commit()` commits the insertion to the database.

**GET `/health`**

Checks whether the backend can connect to MySQL and returns a health status.

**Database table structure**

| Column | Type | Purpose |
|---|---|---|
| `id` | `INT AUTO_INCREMENT PRIMARY KEY` | Unique record ID |
| `student_name` | `VARCHAR(100)` | Student's name |
| `attendance_percentage` | `DECIMAL(5,2)` | Attendance percentage |
| `created_at` | `TIMESTAMP` | Record creation time |

### Step 7: Create the backend Dockerfile

Open:

```bash
nano backend/Dockerfile
```

Paste:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 5000

CMD ["python", "app.py"]
```

Save and exit.

**Explanation:**

- The base image provides Python.
- `WORKDIR` sets `/app`.
- `requirements.txt` is copied and installed first.
- `app.py` is copied afterward.
- `EXPOSE 5000` documents the Flask port.
- `CMD` starts the backend application.

Copying the requirements file before the application code can improve build efficiency because Docker can reuse the dependency-installation layer when only the application source changes.

### Step 8: Create the Docker Compose file

Open:

```bash
nano compose.yaml
```

Paste:

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: student-portal-frontend
    ports:
      - "8080:80"
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: student-portal-backend
    ports:
      - "5001:5000"
    environment:
      DB_HOST: database
      DB_PORT: "3306"
      DB_USER: student
      DB_PASSWORD: studentpass
      DB_NAME: attendance
    depends_on:
      database:
        condition: service_healthy
    restart: unless-stopped

  database:
    image: mysql:8.0
    container_name: student-portal-database
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: attendance
      MYSQL_USER: student
      MYSQL_PASSWORD: studentpass
    volumes:
      - attendance_data:/var/lib/mysql
    healthcheck:
      test:
        - CMD-SHELL
        - 'mysqladmin ping -h 127.0.0.1 -uroot -p"$${MYSQL_ROOT_PASSWORD}" --silent'
      interval: 5s
      timeout: 5s
      retries: 20
      start_period: 30s
    restart: unless-stopped

volumes:
  attendance_data:
```

Save and exit.

#### Compose configuration explanation

**Frontend service**

- Builds the Nginx image from `./frontend`.
- Publishes host port 8080 to container port 80.
- Depends on the backend service.
- Restarts automatically unless explicitly stopped or removed.

**Backend service**

- Builds the Flask image from `./backend`.
- Publishes host port 5001 to container port 5000 for direct API testing.
- Receives the database connection details through environment variables.
- Waits for the database health check to succeed before starting.

**Database service**

- Uses the official `mysql:8.0` image.
- Creates the `attendance` database and the `student` user.
- Uses a health check to indicate when MySQL is responding.
- Stores database files in the `attendance_data` named volume.
- Does not publish port 3306 to the host.

**Health check**

The command:

```yaml
'mysqladmin ping -h 127.0.0.1 -uroot -p"$${MYSQL_ROOT_PASSWORD}" --silent'
```

checks whether MySQL is responding. The doubled dollar sign (`$$`) defers environment-variable expansion to the container rather than allowing Compose to expand it on the host.

**Named volume**

```yaml
volumes:
  - attendance_data:/var/lib/mysql
```

The named volume preserves database files when containers are recreated. Removing containers alone does not remove the volume.

**Important:** These database passwords are lab credentials. Use secrets management and stronger credentials in production.

---

## 5. Build and Run the Application

Ensure you are in the project directory:

```bash
cd ~/docker-lab/exercise2/student-portal
```

### Step 1: Validate the Compose configuration

```bash
sudo docker compose config
```

This checks the Compose configuration and displays its resolved form.

If an error appears, check YAML indentation and spelling.

### Step 2: Build the application images

```bash
sudo docker compose build
```

Compose builds the frontend and backend images.

The MySQL image is pulled from the image registry when necessary; it is not built from a local Dockerfile.

### Step 3: Start the containers

```bash
sudo docker compose up -d
```

The `-d` option runs the services in the background.

On the first run, downloading the images and installing Python dependencies may take some time.

### Step 4: Check the services

```bash
sudo docker compose ps
sudo docker ps
```

The expected container names are:

```text
student-portal-frontend
student-portal-backend
student-portal-database
```

Wait for the database health check to pass. The backend waits for the database to become healthy before it starts.

### Step 5: Check logs if needed

View the last 100 lines from all services:

```bash
sudo docker compose logs --tail 100
```

View backend logs:

```bash
sudo docker compose logs backend
```

View database logs:

```bash
sudo docker compose logs database
```

If a service fails to start, examine its logs before proceeding.

---

## 6. Verify the Application

### Step 1: Open the frontend

Open the following address in your browser:

```text
http://localhost:8080
```

You should see:

- Student Attendance Portal
- Frontend: Nginx
- Backend: Flask
- Database: MySQL
- A **Load Attendance** button
- A form to add attendance records

### Step 2: Load attendance records

Click **Load Attendance**.

If this is a new database, the response should be:

```json
[]
```

This indicates that the request reached the backend and the database contains no attendance records yet.

### Step 3: Test the backend directly

Run:

```bash
curl -i http://localhost:5001/attendance
```

Expected response: HTTP `200 OK`, with an empty JSON array if no records exist.

Check the backend health endpoint:

```bash
curl -i http://localhost:5001/health
```

Expected response when the database connection is working:

```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Step 4: Add attendance using the frontend

In the browser:

1. Enter the student name `Rahul`.
2. Enter attendance percentage `92`.
3. Click **Save Attendance**.
4. Confirm that the success message appears.
5. Confirm that the attendance list refreshes.

The response should resemble:

```json
[
  {
    "id": 1,
    "student_name": "Rahul",
    "attendance_percentage": 92.0,
    "created_at": "2026-10-11T10:30:00"
  }
]
```

The ID and timestamp will depend on your database.

### Step 5: Test the POST endpoint directly

Run:

```bash
curl -i -X POST http://localhost:5001/attendance \
  -H "Content-Type: application/json" \
  -d '{"name":"Priya","attendance":85.5}'
```

Expected: HTTP `201 Created`, with a success message and the inserted record ID.

Retrieve the records:

```bash
curl http://localhost:5001/attendance
```

Both Rahul and Priya should appear if both requests succeeded.

### Step 6: Test input validation

Try an invalid attendance percentage:

```bash
curl -i -X POST http://localhost:5001/attendance \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","attendance":150}'
```

Expected: HTTP `400 Bad Request`.

The response should indicate that attendance must be between 0 and 100.

### Step 7: Test the Nginx reverse proxy

Run:

```bash
curl -i http://localhost:8080/api/attendance
```

This request follows the route:

```text
curl
  |
  v
Host port 8080
  |
  v
Nginx container port 80
  |
  | /api/attendance
  v
Flask container port 5000
  |
  | /attendance
  v
MySQL container port 3306
  |
  v
JSON response
```

If the direct backend request works but this request fails, investigate the Nginx configuration.

### Step 8: Verify the database contents

Open a MySQL shell:

```bash
sudo docker compose exec database mysql -u student -p attendance
```

When prompted, enter:

```text
studentpass
```

Inside the MySQL shell, run:

```sql
SHOW TABLES;
```

Inspect the table structure:

```sql
DESCRIBE attendance;
```

Retrieve all attendance records:

```sql
SELECT * FROM attendance;
```

Exit MySQL:

```sql
exit
```

**Exercise 2 is complete when** the frontend loads, attendance records can be added and retrieved, and the same records appear in MySQL.

---

## 7. Inspect and Debug Containers

### Step 1: Inspect images

List the images:

```bash
sudo docker images
```

Inspect the MySQL image:

```bash
sudo docker image inspect mysql:8.0
```

Inspect the frontend and backend images using their actual image names from `sudo docker images`.

Compose-generated image names can vary depending on the project directory and configuration, so do not assume they will always have the same names.

### Step 2: Inspect containers

```bash
sudo docker inspect student-portal-frontend
sudo docker inspect student-portal-backend
sudo docker inspect student-portal-database
```

Check each container's state:

```bash
sudo docker inspect --format '{{.State.Status}}' student-portal-frontend
sudo docker inspect --format '{{.State.Status}}' student-portal-backend
sudo docker inspect --format '{{.State.Status}}' student-portal-database
```

### Step 3: Inspect networks and volumes

List Docker networks:

```bash
sudo docker network ls
```

List Docker volumes:

```bash
sudo docker volume ls
```

The Compose project creates a network so the frontend, backend, and database can communicate. It also creates a named volume for MySQL data.

### Step 4: View application logs

View all service logs:

```bash
sudo docker compose logs
```

Follow backend logs:

```bash
sudo docker compose logs -f backend
```

Follow database logs:

```bash
sudo docker compose logs -f database
```

Press `Ctrl + C` to stop following logs.

### Step 5: Enter the frontend container

```bash
sudo docker compose exec frontend sh
```

Inside the container:

```bash
pwd
ls -la /usr/share/nginx/html
cat /etc/nginx/conf.d/default.conf
```

Exit:

```bash
exit
```

### Step 6: Enter the backend container

```bash
sudo docker compose exec backend sh
```

Inside the container:

```bash
pwd
ls -la
python --version
pip show Flask
pip show mysql-connector-python
```

Exit:

```bash
exit
```

### Step 7: Enter the database container

```bash
sudo docker compose exec database sh
```

Check the configured database and user:

```bash
echo "$MYSQL_DATABASE"
echo "$MYSQL_USER"
```

Exit:

```bash
exit
```

---

## 8. Stop, Restart, and Clean Up

### Exercise 1: Single-container application

Stop the container:

```bash
sudo docker stop student-attendance-container
```

Start it again:

```bash
sudo docker start student-attendance-container
```

Forcefully terminate it:

```bash
sudo docker kill student-attendance-container
```

Remove the stopped container:

```bash
sudo docker rm student-attendance-container
```

Remove the image:

```bash
sudo docker rmi student-attendance:v1
```

Run these commands only when the corresponding container or image exists.

### Exercise 2: Compose application

Stop all services without removing their containers:

```bash
sudo docker compose stop
```

List the services, including stopped containers:

```bash
sudo docker compose ps -a
```

Start the stopped services again:

```bash
sudo docker compose start
```

Verify:

```bash
sudo docker compose ps
curl http://localhost:8080/api/attendance
```

### Remove containers and the Compose network

```bash
sudo docker compose down
```

This removes the Compose containers and network, but keeps the named database volume.

### Remove containers and locally built images

```bash
sudo docker compose down --rmi local
```

### Remove containers, locally built images, and database data

```bash
sudo docker compose down --rmi local -v
```

**Warning:** The `-v` option deletes the Compose-managed named volume. In this lab, that means deleting the persisted MySQL data. Use it only when you intentionally want to reset the database.

---

## 9. Troubleshooting

### Problem 1: Docker command fails or Docker is not running

Check the service:

```bash
sudo systemctl status docker --no-pager
```

Start and enable it if necessary:

```bash
sudo systemctl enable --now docker
```

Test Docker:

```bash
sudo docker ps
```

### Problem 2: Port 5000 or 8080 is already in use

Check which process is listening:

```bash
sudo ss -ltnp | grep -E ':5000|:8080'
```

Stop the conflicting application or change the host-side port mapping.

For example, changing the Exercise 1 mapping to `5002:5000` makes the application accessible at `http://localhost:5002`.

The host port is the number on the left; the container port is the number on the right.

### Problem 3: Exercise 1 browser shows connection refused

Check whether the container is running:

```bash
sudo docker ps -a
```

View its logs:

```bash
sudo docker logs student-attendance-container
```

Check the port mapping:

```bash
sudo docker inspect --format '{{json .NetworkSettings.Ports}}' student-attendance-container
```

If the container is stopped, inspect the logs before starting it again.

### Problem 4: Exercise 2 frontend is unavailable

Check the services:

```bash
sudo docker compose ps
```

Inspect the frontend logs:

```bash
sudo docker compose logs frontend
```

Check the backend logs:

```bash
sudo docker compose logs backend
```

If the frontend container cannot start, confirm that both `frontend/index.html` and `frontend/nginx.conf` exist and that the Dockerfile copies them correctly.

### Problem 5: Backend cannot connect to MySQL

Check the database status:

```bash
sudo docker compose ps
```

Inspect the database logs:

```bash
sudo docker compose logs database
```

Inspect the backend logs:

```bash
sudo docker compose logs backend
```

Verify these settings in `compose.yaml`:

```yaml
DB_HOST: database
DB_PORT: "3306"
DB_USER: student
DB_PASSWORD: studentpass
DB_NAME: attendance
```

Also confirm that the database service uses matching credentials.

The backend should use `database` as its hostname, not `localhost`. The MySQL service may take some time to initialize on its first run.

### Problem 6: Frontend cannot reach the API

Test the backend directly:

```bash
curl http://localhost:5001/attendance
```

Validate the Nginx configuration:

```bash
sudo docker compose exec frontend nginx -t
```

Test the proxied endpoint:

```bash
curl -i http://localhost:8080/api/attendance
```

If direct access works but proxy access fails, inspect `frontend/nginx.conf` and confirm that this configuration is present:

```nginx
location /api/ {
    proxy_pass http://backend:5000/;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

The trailing slash in `proxy_pass` is important because the backend routes are `/attendance` and `/health`, not `/api/attendance` and `/api/health`.

### Problem 7: `docker compose exec` reports that a container is not running

Start the services:

```bash
sudo docker compose up -d
```

Check their status:

```bash
sudo docker compose ps -a
```

If a container exits repeatedly, inspect the relevant service logs:

```bash
sudo docker compose logs backend
```

Replace `backend` with `frontend` or `database` as needed.

### Problem 8: Changes to application code are not reflected

Rebuild and recreate the affected services:

```bash
sudo docker compose up -d --build
```

For the single-container exercise, rebuild the image and recreate the container after changing the source code.

A running container does not automatically incorporate changes made to the source files on the host.

---

## 10. Quick Revision Commands

### Exercise 1: Complete command sequence

```bash
cd ~/docker-lab/exercise1

# Build image
sudo docker build -t student-attendance:v1 .

# Run container
sudo docker run -d \
  --name student-attendance-container \
  -p 5000:5000 \
  student-attendance:v1

# Check containers
sudo docker ps
sudo docker ps -a

# Inspect image and container
sudo docker image inspect student-attendance:v1
sudo docker inspect student-attendance-container

# View logs
sudo docker logs student-attendance-container

# Enter the running container
sudo docker exec -it student-attendance-container /bin/sh

# Inside container:
pwd
ls
cat app.py
exit

# Back on Ubuntu host:
sudo docker stop student-attendance-container
sudo docker start student-attendance-container
sudo docker kill student-attendance-container
sudo docker rm student-attendance-container
sudo docker rmi student-attendance:v1
```

When the container is running, verify the application at:

```text
http://localhost:5000
```

### Exercise 2: Complete command sequence

```bash
cd ~/docker-lab/exercise2/student-portal

# Validate Compose configuration
sudo docker compose config

# Build frontend and backend images
sudo docker compose build

# Start the application
sudo docker compose up -d

# Check status
sudo docker compose ps
sudo docker ps

# View logs
sudo docker compose logs
sudo docker compose logs backend
sudo docker compose logs database

# Test the backend
curl http://localhost:5001/attendance
curl http://localhost:5001/health

# Test the Nginx reverse proxy
curl http://localhost:8080/api/attendance

# Stop and restart services
sudo docker compose stop
sudo docker compose start

# Remove containers and the network
sudo docker compose down
```

### Important URLs

| Purpose | URL |
|---|---|
| Exercise 1 Flask homepage | `http://localhost:5000` |
| Exercise 1 health check | `http://localhost:5000/health` |
| Exercise 2 frontend | `http://localhost:8080` |
| Exercise 2 backend health check | `http://localhost:5001/health` |
| Exercise 2 direct attendance API | `http://localhost:5001/attendance` |
| Exercise 2 proxied attendance API | `http://localhost:8080/api/attendance` |

---

## 11. Viva Questions and Answers

### 1. What is Docker?

Docker is a platform for packaging and running applications in isolated environments called containers.

### 2. What is a Docker image?

A Docker image is a template used to create containers. It contains the application code, required dependencies, filesystem, and configuration.

### 3. What is a Docker container?

A container is a running or stopped instance of an image. It provides an isolated environment in which an application executes.

### 4. What is the difference between an image and a container?

An image is the template; a container is the instance created from that template.

### 5. What is a Dockerfile?

A Dockerfile is a text file containing instructions used to build a Docker image.

### 6. What is the purpose of `FROM`?

`FROM` specifies the base image on which the new image is built.

### 7. What is the difference between `RUN` and `CMD`?

- `RUN` executes commands during image building.
- `CMD` specifies the default command executed when a container starts.

### 8. What is the purpose of `WORKDIR`?

`WORKDIR` sets the working directory for subsequent Dockerfile instructions and the container's default working directory unless overridden.

### 9. What does `COPY` do?

`COPY` copies files from the build context into the image.

### 10. What does `EXPOSE` do?

`EXPOSE` documents the port that the application is expected to use inside the container. It does not publish that port to the host.

### 11. What does `-p 8080:80` mean?

It maps port 8080 on the host to port 80 inside the container.

### 12. Why does Flask use `0.0.0.0`?

It allows Flask to listen on the container's network interfaces, making the service accessible through the container network and published port.

### 13. What is the difference between `docker run` and `docker start`?

- `docker run` creates and starts a new container from an image.
- `docker start` starts an existing stopped container.

### 14. What is the difference between `docker stop` and `docker kill`?

- `docker stop` requests graceful termination and eventually forcefully terminates the container if it does not stop within the timeout.
- `docker kill` sends a termination signal immediately, using `SIGKILL` by default.

### 15. What does `docker exec` do?

It runs a command inside an already running container. For example:

```bash
sudo docker exec -it student-attendance-container /bin/sh
```

### 16. What is Docker Compose?

Docker Compose is a tool for defining and managing multi-container applications through a YAML configuration file.

### 17. Why use Docker Compose for Exercise 2?

It lets us configure, build, start, stop, and manage the frontend, backend, and database together.

### 18. What is a reverse proxy?

A reverse proxy receives client requests and forwards them to another service. In this lab, Nginx serves the HTML page and forwards `/api/` requests to Flask.

### 19. Why is the database hostname `database` rather than `localhost`?

The database runs in a separate container. On the Compose network, the service name `database` resolves to the MySQL container. `localhost` inside the backend container would refer to the backend container itself.

### 20. What is a Docker volume?

A Docker volume provides persistent storage that exists independently of an individual container's lifecycle.

### 21. Why do we use `attendance_data`?

It stores MySQL's data files so records can survive container recreation.

### 22. What is the difference between `docker compose stop` and `docker compose down`?

- `stop` stops the services but retains their containers.
- `down` removes the Compose containers and network. Named volumes are retained unless the `-v` option is used.

### 23. What does `depends_on` do?

It defines service dependencies and influences startup ordering. In this lab, the backend uses `condition: service_healthy` to wait for the database health check to pass.

### 24. Why is a database health check necessary?

A running MySQL container is not necessarily ready to accept database connections. The health check provides a readiness signal that Compose can use before starting the backend.

### 25. How does the backend interact with MySQL?

The Flask application connects using `mysql-connector-python`, executes SQL statements, retrieves results, and commits successful inserts.

### 26. Why use parameterized SQL queries?

Parameterized queries separate SQL instructions from user-supplied values, reducing the risk of SQL injection.

### 27. What is the purpose of `connection.commit()`?

It commits a database transaction, making successful changes persistent according to the database's transaction settings.

### 28. Why is MySQL port 3306 not published to the host?

The backend can reach MySQL over the internal Docker network. Publishing the database port to the host is unnecessary for this application and would expose an additional access point.

### 29. Why does the frontend call `/api/attendance` instead of `localhost:5001/attendance`?

The relative path sends the request to the same origin that served the frontend. Nginx then forwards it to Flask, avoiding the need for the browser to access the backend's separately published host port.

### 30. What happens when a user adds an attendance record?

1. The browser sends a POST request to Nginx.
2. Nginx forwards the request to Flask.
3. Flask validates the input.
4. Flask inserts the record into MySQL.
5. MySQL commits the record.
6. Flask returns a JSON response.
7. The frontend displays the success message and reloads the attendance list.

---

## Final Checklist

Use this checklist to confirm that the lab is complete.

### Docker installation

- [ ] Docker is installed.
- [ ] Docker Compose is available.
- [ ] The Docker service is running.
- [ ] `sudo docker run hello-world` succeeds.

### Exercise 1

- [ ] `app.py` is created.
- [ ] The Dockerfile is created.
- [ ] The image builds successfully.
- [ ] The container starts.
- [ ] The homepage returns the expected message.
- [ ] The `/health` endpoint returns healthy status.
- [ ] Container logs and inspection work.
- [ ] You can enter the container shell.
- [ ] You can stop, start, kill, and remove the container.

### Exercise 2

- [ ] The frontend HTML is created.
- [ ] The frontend Dockerfile is created.
- [ ] The Nginx reverse-proxy configuration is created.
- [ ] The backend requirements and application files are created.
- [ ] The backend Dockerfile is created.
- [ ] The Compose file defines all three services.
- [ ] The images build and the services start.
- [ ] The frontend opens at `http://localhost:8080`.
- [ ] Attendance records can be retrieved.
- [ ] Attendance records can be added.
- [ ] The records are visible in MySQL.
- [ ] The direct backend API works.
- [ ] The Nginx-proxied API works.
- [ ] The database volume persists data across container recreation.
- [ ] You can inspect, debug, stop, restart, and clean up the application.

**End of lab.**