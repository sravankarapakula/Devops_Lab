# Node.js REST API with Docker and Jenkins CI/CD on Ubuntu

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Prerequisites](#2-prerequisites)
3. [Prepare Ubuntu](#3-prepare-ubuntu)
4. [Install Node.js and npm](#4-install-nodejs-and-npm)
5. [Create the Node.js REST API](#5-create-the-nodejs-rest-api)
6. [Test the API Locally](#6-test-the-api-locally)
7. [Install Docker Engine](#7-install-docker-engine)
8. [Create the Dockerfile](#8-create-the-dockerfile)
9. [Build and Run the Docker Container](#9-build-and-run-the-docker-container)
10. [Create a GitHub Repository](#10-create-a-github-repository)
11. [Push the Application to GitHub](#11-push-the-application-to-github)
12. [Install Jenkins](#12-install-jenkins)
13. [Configure Docker Access for Jenkins](#13-configure-docker-access-for-jenkins)
14. [Create the Jenkinsfile](#14-create-the-jenkinsfile)
15. [Push the Jenkinsfile to GitHub](#15-push-the-jenkinsfile-to-github)
16. [Configure the Jenkins Pipeline Job](#16-configure-the-jenkins-pipeline-job)
17. [Run the CI/CD Pipeline](#17-run-the-cicd-pipeline)
18. [Configure Automatic CI/CD Triggering](#18-configure-automatic-cicd-triggering)
19. [Test Automatic Deployment](#19-test-automatic-deployment)
20. [Troubleshooting](#20-troubleshooting)
21. [Final Verification Checklist](#21-final-verification-checklist)
22. [Important Commands](#22-important-commands)

---

## 1. Project Overview

This project implements a simple REST API using Node.js and Express. The API exposes a `/status` endpoint that returns a JSON response.

The application is containerized using Docker and deployed automatically using a Jenkins CI/CD pipeline.

### Architecture

```text
Developer
    |
    | Git commit and push
    v
GitHub Repository
    |
    | GitHub Webhook (optional)
    v
Jenkins Pipeline
    |
    +--> Checkout Source Code
    |
    +--> Install Dependencies
    |
    +--> Test API
    |
    +--> Build Docker Image
    |
    +--> Deploy Container
    |
    +--> Verify Deployment
    |
    v
Docker Container
    |
    v
Node.js REST API
    |
    v
GET /status
    |
    v
HTTP 200 OK + JSON Response
```

### Technologies Used

| Technology | Purpose |
|---|---|
| Ubuntu | Operating system |
| Node.js | JavaScript runtime |
| npm | Package and dependency management |
| Express | REST API framework |
| Git | Version control |
| GitHub | Source code repository |
| Docker | Application containerization |
| Jenkins | CI/CD automation |
| curl | API testing |

### API Endpoint

**Method:** `GET`

**Endpoint:**

```text
http://localhost:3000/status
```

**Expected response:**

```json
{
  "status": "API is running successfully"
}
```

### Ports Used

| Component | Port |
|---|---:|
| Jenkins | 8080 |
| Node.js REST API | 3000 |

### Execution Flow

```text
Install Software
    |
    v
Create Node.js API
    |
    v
Test API
    |
    v
Create Dockerfile
    |
    v
Build and Run Docker Container
    |
    v
Push Source Code to GitHub
    |
    v
Install and Configure Jenkins
    |
    v
Create Jenkinsfile
    |
    v
Configure Jenkins Pipeline
    |
    v
Build, Test, and Deploy Automatically
    |
    v
Verify API Response
```

---

## 2. Prerequisites

This guide assumes:

- Ubuntu 22.04 or Ubuntu 24.04.
- A user account with `sudo` privileges.
- An active internet connection.
- A GitHub account.
- Jenkins, Docker, and Node.js running on the same Ubuntu machine.

The Jenkins pipeline uses Linux shell commands through `sh`, not Windows `bat` commands.

**Important:** If Ubuntu runs inside a virtual machine, ensure that its networking configuration allows you to access Jenkins on port 8080.

For GitHub webhooks, Jenkins must be reachable from GitHub's servers. A private VM address or `localhost` cannot be used as a public webhook destination.

---

## 3. Prepare Ubuntu

### Step 3.1: Open the terminal

Press:

```text
Ctrl + Alt + T
```

### Step 3.2: Update Ubuntu

Execute:

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 3.3: Install basic utilities

```bash
sudo apt install -y curl wget git ca-certificates gnupg
```

### Step 3.4: Verify the Ubuntu version

```bash
lsb_release -a
```

### Step 3.5: Verify Git

```bash
git --version
```

### Step 3.6: Verify curl

```bash
curl --version
```

---

## 4. Install Node.js and npm

### Step 4.1: Install Node.js and npm

```bash
sudo apt update
sudo apt install -y nodejs npm
```

The Ubuntu package repository may provide a Node.js version older than the desired LTS release. If that happens, install a supported Node.js LTS release using the official instructions at:

https://nodejs.org/en/download

The Docker image used later will run Node.js 22 independently of the host's Node.js version.

### Step 4.2: Verify installation

```bash
node --version
npm --version
```

Both commands should print version information.

---

## 5. Create the Node.js REST API

### Step 5.1: Create the project directory

```bash
mkdir -p ~/node-rest-api
cd ~/node-rest-api
```

Verify the current directory:

```bash
pwd
```

Expected format:

```text
/home/YOUR_USERNAME/node-rest-api
```

### Step 5.2: Initialize the project

```bash
npm init -y
npm install express
npm pkg set scripts.start="node server.js"
npm pkg set scripts.test="node --test"
```

This creates the following files:

- `package.json`
- `package-lock.json`

The `package.json` file stores project metadata, dependencies, and npm scripts.

The `package-lock.json` file records the resolved dependency versions.

### Step 5.3: Create `server.js`

```bash
nano server.js
```

Paste the following code:

```javascript
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/status", (req, res) => {
    res.status(200).json({
        status: "API is running successfully"
    });
});

if (require.main === module) {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
```

Save and exit Nano:

1. Press `Ctrl + O`.
2. Press `Enter`.
3. Press `Ctrl + X`.

**Explanation:**

- `express()` creates the application.
- `app.get("/status", ...)` defines the GET endpoint.
- `res.status(200)` returns HTTP status code 200.
- `res.json()` returns the JSON response.
- `process.env.PORT || 3000` allows the port to be configured through an environment variable.
- `0.0.0.0` allows connections through the Docker container's network interface.
- `module.exports = app` makes the Express application available to the automated test.

### Step 5.4: Create `server.test.js`

```bash
nano server.test.js
```

Paste:

```javascript
const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("./server");

test("GET /status returns HTTP 200 and the expected JSON", async () => {
    const server = app.listen(0, "127.0.0.1");

    try {
        await new Promise((resolve, reject) => {
            server.once("listening", resolve);
            server.once("error", reject);
        });

        const address = server.address();
        const response = await fetch(
            `http://127.0.0.1:${address.port}/status`
        );

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {
            status: "API is running successfully"
        });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }
});
```

Save and exit Nano.

The test:

1. Starts the application on an available local port.
2. Sends a GET request to `/status`.
3. Checks the HTTP response code.
4. Checks that the JSON response matches the expected object.
5. Closes the temporary server.

---

## 6. Test the API Locally

### Step 6.1: Run the automated test

```bash
cd ~/node-rest-api
npm test
```

Expected result: the test passes with zero failures.

### Step 6.2: Start the API

```bash
npm start
```

Keep this terminal open.

### Step 6.3: Open a second terminal

Press `Ctrl + Alt + T` and execute:

```bash
curl -i http://localhost:3000/status
```

Expected HTTP response:

```text
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
```

Expected response body:

```json
{
  "status": "API is running successfully"
}
```

### Step 6.4: Stop the local server

Return to the first terminal and press:

```text
Ctrl + C
```

---

## 7. Install Docker Engine

Docker will package the application and its runtime dependencies into an image.

### Step 7.1: Install repository prerequisites

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
```

### Step 7.2: Add Docker's official signing key

```bash
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

### Step 7.3: Add the Docker repository

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### Step 7.4: Install Docker Engine

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Step 7.5: Start Docker

```bash
sudo systemctl enable --now docker
```

### Step 7.6: Verify Docker

```bash
sudo systemctl status docker --no-pager
sudo docker run --rm hello-world
```

The `hello-world` container should print a success message.

### Step 7.7: Allow your Ubuntu user to run Docker

```bash
sudo usermod -aG docker "$USER"
newgrp docker
```

Verify:

```bash
docker ps
docker version
```

If permissions still fail, log out of Ubuntu and log back in.

**Security warning:** Membership in the `docker` group effectively grants root-level privileges. Only grant this permission to trusted users.

---

## 8. Create the Dockerfile

### Step 8.1: Navigate to the project

```bash
cd ~/node-rest-api
```

### Step 8.2: Create `Dockerfile`

```bash
nano Dockerfile
```

Paste:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY server.js ./

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]
```

Save and exit Nano.

### Explanation

| Instruction | Purpose |
|---|---|
| `FROM node:22-alpine` | Uses a Node.js 22 Alpine base image |
| `WORKDIR /app` | Sets the working directory |
| `COPY package.json package-lock.json ./` | Copies dependency manifests |
| `RUN npm ci --omit=dev` | Installs locked production dependencies |
| `COPY server.js ./` | Copies the application source |
| `EXPOSE 3000` | Documents the application's port |
| `ENV NODE_ENV=production` | Sets the production environment |
| `CMD` | Starts the API |

The test file is not copied into the production image because Jenkins runs the test separately.

### Step 8.3: Create `.dockerignore`

```bash
nano .dockerignore
```

Paste:

```text
node_modules
npm-debug.log
.git
.gitignore
server.test.js
```

Save and exit.

This excludes unnecessary files from the Docker build context.

---

## 9. Build and Run the Docker Container

### Step 9.1: Build the image

```bash
cd ~/node-rest-api
docker build -t node-rest-api:latest .
```

### Step 9.2: Verify the image

```bash
docker images
```

You should see `node-rest-api` in the image list.

### Step 9.3: Run the container

```bash
docker run -d \
  --name node-api \
  --restart unless-stopped \
  -p 3000:3000 \
  node-rest-api:latest
```

### Step 9.4: Verify the container

```bash
docker ps
```

### Step 9.5: Test the API inside Docker

```bash
curl -i http://localhost:3000/status
```

Expected body:

```json
{
  "status": "API is running successfully"
}
```

### Step 9.6: View container logs

```bash
docker logs node-api
```

### Step 9.7: Remove the manually created container

Before Jenkins performs its first deployment, remove the manually created container to avoid a naming conflict:

```bash
docker rm -f node-api
```

This removes the container but leaves the image intact.

If the container does not exist, Docker may report that it could not find it. You can safely continue.

---

## 10. Create a GitHub Repository

### Step 10.1: Open GitHub

Go to:

https://github.com/

Create a new repository with these settings:

| Setting | Value |
|---|---|
| Repository name | `node-rest-api` |
| Visibility | Public for this beginner lab |
| Initialize with README | No |
| Add `.gitignore` | No |
| Choose a license | Optional; leave unselected for this lab |

Do not initialize the repository with files because the project already exists locally.

### Step 10.2: Copy the repository URL

The URL will look like:

```text
https://github.com/YOUR_GITHUB_USERNAME/node-rest-api.git
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

---

## 11. Push the Application to GitHub

### Step 11.1: Create `.gitignore`

```bash
cd ~/node-rest-api
nano .gitignore
```

Paste:

```text
node_modules/
.env
coverage/
npm-debug.log
```

Save and exit Nano.

### Step 11.2: Initialize Git

```bash
git init
git branch -M main
```

### Step 11.3: Stage the application files

```bash
git add server.js server.test.js package.json package-lock.json Dockerfile .dockerignore .gitignore
```

### Step 11.4: Commit

```bash
git commit -m "Create Node.js status API with Docker support"
```

### Step 11.5: Connect GitHub

Replace the URL below with your actual repository URL:

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/node-rest-api.git
```

### Step 11.6: Push the code

```bash
git push -u origin main
```

If GitHub requests authentication, use a supported method such as a personal access token or SSH key. Do not use your GitHub account password as the Git password.

### Step 11.7: Verify the remote

```bash
git remote -v
```

Open your GitHub repository in the browser.

At this stage, the repository should contain:

```text
node-rest-api/
├── .dockerignore
├── .gitignore
├── Dockerfile
├── package.json
├── package-lock.json
├── server.js
└── server.test.js
```

Do not commit `node_modules`.

---

## 12. Install Jenkins

### Step 12.1: Install Java 21

```bash
sudo apt update
sudo apt install -y fontconfig openjdk-21-jre
```

Verify:

```bash
java -version
```

You should see Java 21.

If your Ubuntu repository does not provide `openjdk-21-jre`, install a compatible Java 21 distribution before continuing.

### Step 12.2: Add the official Jenkins signing key

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo wget -O /etc/apt/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key
sudo chmod a+r /etc/apt/keyrings/jenkins-keyring.asc
```

### Step 12.3: Add the Jenkins repository

```bash
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
```

### Step 12.4: Install Jenkins

```bash
sudo apt update
sudo apt install -y jenkins
```

### Step 12.5: Start Jenkins

```bash
sudo systemctl enable --now jenkins
```

Verify:

```bash
sudo systemctl status jenkins --no-pager
```

Jenkins should be active.

### Step 12.6: Open Jenkins

On the Ubuntu machine, open:

```text
http://localhost:8080
```

If using a VM, access Jenkins through its reachable IP address:

```text
http://UBUNTU_VM_IP:8080
```

This requires the VM network and firewall to permit the connection.

### Step 12.7: Retrieve the initial administrator password

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Copy the displayed password into the Jenkins setup page.

### Step 12.8: Complete the setup wizard

1. Select **Install suggested plugins**.
2. Wait for installation to complete.
3. Create the Jenkins administrator account.
4. Finish the setup wizard.

Keep your Jenkins administrator credentials safe.

---

## 13. Configure Docker Access for Jenkins

Jenkins runs under its own Linux account, named `jenkins`. That account must be able to communicate with the Docker daemon.

### Step 13.1: Add Jenkins to the Docker group

```bash
sudo usermod -aG docker jenkins
```

### Step 13.2: Restart Jenkins

```bash
sudo systemctl restart jenkins
```

### Step 13.3: Verify group membership

```bash
id jenkins
```

The output should include `docker` among the groups.

### Step 13.4: Verify Docker access

```bash
sudo -u jenkins docker version
```

You should see both Docker client and server information.

If permission is denied, recheck the group membership and restart Jenkins.

**Security warning:** Giving Jenkins Docker access grants it root-equivalent control over the machine. Use this configuration only in a trusted lab environment.

---

## 14. Create the Jenkinsfile

The `Jenkinsfile` defines the pipeline stages.

### Step 14.1: Navigate to the project

```bash
cd ~/node-rest-api
```

### Step 14.2: Create `Jenkinsfile`

```bash
nano Jenkinsfile
```

Paste the following complete pipeline:

```groovy
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        IMAGE_NAME = 'node-rest-api'
        CONTAINER_NAME = 'node-api'
        APP_PORT = '3000'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Test API') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build --pull -t node-rest-api:${BUILD_NUMBER} .'
                sh 'docker tag node-rest-api:${BUILD_NUMBER} node-rest-api:latest'
            }
        }

        stage('Deploy Container') {
            steps {
                sh '''
                    docker rm -f node-api 2>/dev/null || true

                    docker run -d \
                        --name node-api \
                        --restart unless-stopped \
                        -p 3000:3000 \
                        node-rest-api:${BUILD_NUMBER}
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    set -eu

                    attempt=0
                    until curl --fail --silent \
                        http://127.0.0.1:3000/status \
                        -o response.json; do

                        attempt=$((attempt + 1))

                        if [ "$attempt" -ge 15 ]; then
                            echo "API did not become healthy."
                            docker logs node-api || true
                            exit 1
                        fi

                        sleep 2
                    done

                    cat response.json

                    grep -Fq '"status":"API is running successfully"' response.json
                '''
            }
        }
    }

    post {
        success {
            echo 'CI/CD pipeline completed successfully.'
        }

        failure {
            echo 'CI/CD pipeline failed. Check the stage logs.'
        }
    }
}
```

Save and exit Nano.

### Explanation of the pipeline

| Stage | Purpose |
|---|---|
| Checkout | Retrieves the configured Git repository |
| Install Dependencies | Installs dependencies using the lock file |
| Test API | Executes the automated test |
| Build Docker Image | Builds a versioned image and tags it `latest` |
| Deploy Container | Replaces the previous container with the new image |
| Verify Deployment | Checks that the endpoint returns the expected JSON |

The image is tagged using the Jenkins build number, so each build can be identified.

**Deployment note:** The old container is removed only after tests and image building succeed. If deployment or verification fails, Jenkins marks the build as failed, but this beginner pipeline does not automatically roll back to the previous container.

### Important prerequisite for the pipeline

The Jenkins service must have access to:

- Docker
- Git
- `curl`
- Node.js
- npm

If Jenkins reports `npm: not found`, inspect the Jenkins service environment. Install a supported Node.js release and configure the executable path, or use the Jenkins NodeJS plugin to manage the runtime.

---

## 15. Push the Jenkinsfile to GitHub

### Step 15.1: Stage the Jenkinsfile

```bash
cd ~/node-rest-api
git add Jenkinsfile
```

### Step 15.2: Commit

```bash
git commit -m "Add Jenkins CI CD pipeline"
```

### Step 15.3: Push

```bash
git push
```

### Step 15.4: Verify the repository

The repository should now contain:

```text
node-rest-api/
├── .dockerignore
├── .gitignore
├── Dockerfile
├── Jenkinsfile
├── package.json
├── package-lock.json
├── server.js
└── server.test.js
```

The `Jenkinsfile` must be in the repository root for the configuration in the next section.

---

## 16. Configure the Jenkins Pipeline Job

### Step 16.1: Open Jenkins

```text
http://localhost:8080
```

### Step 16.2: Create a new item

1. Click **New Item**.
2. Enter the name:

   ```text
   NodeJS-REST-API
   ```

3. Select **Pipeline**.
4. Click **OK**.

### Step 16.3: Configure the pipeline

Under the **Pipeline** section, configure:

| Setting | Value |
|---|---|
| Definition | Pipeline script from SCM |
| SCM | Git |
| Repository URL | Your GitHub HTTPS repository URL |
| Credentials | None for a public repository |
| Branch Specifier | `*/main` |
| Script Path | `Jenkinsfile` |

Example repository URL:

```text
https://github.com/YOUR_GITHUB_USERNAME/node-rest-api.git
```

For a private repository, add appropriate Git credentials in Jenkins and select them in the job configuration.

The branch must match the branch pushed to GitHub. This guide uses `main`.

The script path is relative to the repository root. Since `Jenkinsfile` is at the root, use:

```text
Jenkinsfile
```

If it is stored in a subdirectory, specify the relative path, such as:

```text
node-rest-api/Jenkinsfile
```

Click **Save**.

---

## 17. Run the CI/CD Pipeline

### Step 17.1: Start the first build

On the `NodeJS-REST-API` job page:

1. Click **Build Now**.
2. Open the new build in Build History.
3. Click **Console Output**.
4. Wait for the pipeline to finish.

The pipeline should execute:

```text
Checkout
    |
    v
Install Dependencies
    |
    v
Test API
    |
    v
Build Docker Image
    |
    v
Deploy Container
    |
    v
Verify Deployment
```

A successful run should finish with:

```text
CI/CD pipeline completed successfully.
```

### Step 17.2: Verify the running container

```bash
docker ps
```

You should see a container named `node-api`.

The published port should resemble:

```text
0.0.0.0:3000->3000/tcp
```

### Step 17.3: Verify the Docker image

```bash
docker images
```

You should see tags such as:

```text
node-rest-api   latest
node-rest-api   1
```

The number depends on the Jenkins build number.

### Step 17.4: Test the deployed API

```bash
curl -i http://localhost:3000/status
```

Expected body:

```json
{
  "status": "API is running successfully"
}
```

### Step 17.5: Check container logs

```bash
docker logs node-api
```

At this point, Jenkins has automated testing, image building, deployment, and endpoint verification.

---

## 18. Configure Automatic CI/CD Triggering

The pipeline can be started manually through Jenkins. To start it automatically when code is pushed, configure a GitHub webhook.

### Step 18.1: Enable the GitHub trigger in Jenkins

Navigate to:

```text
NodeJS-REST-API → Configure
```

Under **Build Triggers**, enable:

```text
GitHub hook trigger for GITScm polling
```

Click **Save**.

### Step 18.2: Add the GitHub webhook

Open your GitHub repository:

```text
Settings → Webhooks → Add webhook
```

Configure:

| Setting | Value |
|---|---|
| Payload URL | `http://YOUR_REACHABLE_JENKINS_HOST:8080/github-webhook/` |
| Content type | `application/json` |
| Secret | Optional; configure validation if supported by your setup |
| Events | Just the push event |
| Active | Enabled |

Replace `YOUR_REACHABLE_JENKINS_HOST` with a hostname or IP address that GitHub can reach.

**Network limitation:** `localhost` and private VM addresses are not accessible from GitHub's servers. If Jenkins runs behind a home router or NAT, you need a secure, externally reachable endpoint or an appropriate tunnel.

Do not expose Jenkins directly to the public internet without suitable access controls, TLS, and firewall rules.

If webhook connectivity is unavailable, you can still run the pipeline manually with **Build Now**.

---

## 19. Test Automatic Deployment

This step verifies that a code change can travel from GitHub through Jenkins into the running Docker container.

### Step 19.1: Update `server.js`

```bash
cd ~/node-rest-api
nano server.js
```

Replace the endpoint response with:

```javascript
app.get("/status", (req, res) => {
    res.status(200).json({
        status: "API updated through CI/CD"
    });
});
```

Keep the rest of `server.js` unchanged.

Save and exit Nano.

### Step 19.2: Update the test

Open:

```bash
nano server.test.js
```

Replace the expected JSON object in the assertion with:

```javascript
{
    status: "API updated through CI/CD"
}
```

The complete assertion should now be:

```javascript
assert.deepEqual(await response.json(), {
    status: "API updated through CI/CD"
});
```

Save and exit Nano.

### Step 19.3: Run the test locally

```bash
npm test
```

Make sure the test passes with zero failures.

### Step 19.4: Commit and push the changes

```bash
git add server.js server.test.js
git commit -m "Update API status message"
git push
```

If Git reports that there is nothing to commit, check whether the changes were saved in both files.

### Step 19.5: Verify the Jenkins build

Open:

```text
http://localhost:8080
```

Navigate to:

```text
Dashboard → NodeJS-REST-API → Build History
```

If the webhook is working, a new build should start automatically after the push.

Open the latest build and select **Console Output**.

Verify that these stages succeed:

1. Checkout
2. Install Dependencies
3. Test API
4. Build Docker Image
5. Deploy Container
6. Verify Deployment

If no build starts automatically, click **Build Now** to test the pipeline manually.

### Step 19.6: Verify the updated API response

After the Jenkins build succeeds, execute:

```bash
curl -i http://localhost:3000/status
```

Expected HTTP response:

```text
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
```

Expected JSON body:

```json
{
  "status": "API updated through CI/CD"
}
```

You can also print only the body:

```bash
curl -s http://localhost:3000/status
```

Expected output:

```json
{"status":"API updated through CI/CD"}
```

### Step 19.7: Verify the deployed Docker container

Check the running container:

```bash
docker ps
```

Inspect the image used by the container:

```bash
docker inspect --format='{{.Config.Image}}' node-api
```

The output should show the versioned image used by the latest deployment, such as:

```text
node-rest-api:2
```

The exact number depends on the Jenkins build number.

View logs:

```bash
docker logs node-api
```

### Step 19.8: If the API still returns the old response

Check the latest Jenkins build and inspect **Console Output** if it failed.

Check the container:

```bash
docker ps -a
docker logs node-api
```

Confirm the source files contain the new response:

```bash
grep -n "API updated through CI/CD" server.js server.test.js
```

If the message is missing from either file, edit and save the file, then repeat the test, commit, and push steps.

---

## 20. Troubleshooting

### Error 1: Docker permission denied

Example:

```text
permission denied while trying to connect to the Docker daemon socket
```

Fix:

```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
sudo -u jenkins docker version
```

Check Docker's status:

```bash
sudo systemctl status docker --no-pager
```

### Error 2: Jenkins cannot find npm

Check the host installation:

```bash
command -v npm
npm --version
```

If Jenkins reports `npm: not found`, inspect the Jenkins service environment. Install a supported Node.js runtime and configure its executable path, or use the Jenkins NodeJS plugin.

### Error 3: Port 3000 is already allocated

Identify the process using the port:

```bash
sudo ss -ltnp | grep ':3000'
docker ps
```

Remove the old lab container if appropriate:

```bash
docker rm -f node-api
```

If another application uses port 3000, stop that application or change the host port consistently in the Docker run command, Jenkins pipeline, and verification URL.

### Error 4: `npm ci` fails

Run:

```bash
cd ~/node-rest-api
npm install
npm test
```

If dependencies changed, commit the updated dependency files:

```bash
git add package.json package-lock.json
git commit -m "Update npm lock file"
git push
```

`package-lock.json` must be consistent with `package.json` for `npm ci` to work.

### Error 5: Jenkins cannot access GitHub

Verify the repository URL:

```text
https://github.com/YOUR_GITHUB_USERNAME/node-rest-api.git
```

For a private repository, configure Git credentials in Jenkins and select them in the pipeline job.

### Error 6: API verification fails after deployment

Check:

```bash
docker ps -a
docker logs node-api
curl -v http://localhost:3000/status
```

Confirm the container uses:

```text
-p 3000:3000
```

Also confirm the application listens on:

```text
0.0.0.0:3000
```

### Error 7: GitHub webhook does not trigger Jenkins

Check:

- The Jenkins job has **GitHub hook trigger for GITScm polling** enabled.
- The webhook is active in GitHub.
- The payload URL is correct.
- GitHub can reach the Jenkins server.
- The Jenkins URL is not `localhost` or a private-only IP address.
- The latest GitHub push was delivered successfully.

If webhook connectivity is unavailable, use **Build Now**.

### Error 8: The Jenkins pipeline fails during verification

Open the Jenkins build's **Console Output**.

Check the logs and container status:

```bash
docker ps -a
docker logs node-api
```

The verification stage retries the HTTP request for a limited period. If the endpoint remains unavailable, the pipeline fails instead of reporting a successful deployment.

---

## 21. Final Verification Checklist

Before submitting the lab, verify each item.

### Application

- [ ] Node.js and npm installed.
- [ ] Git configured.
- [ ] Express REST API created.
- [ ] `GET /status` returns HTTP 200 and JSON.
- [ ] Automated Node.js test passes.

### Docker

- [ ] Docker Engine installed and running.
- [ ] Docker image builds successfully.
- [ ] API runs inside a Docker container.
- [ ] Container logs are accessible.
- [ ] API is reachable through port 3000.

### GitHub

- [ ] GitHub repository created.
- [ ] Application source code pushed.
- [ ] `.gitignore` and `.dockerignore` created.
- [ ] `Jenkinsfile` committed to the repository root.

### Jenkins

- [ ] Jenkins installed and accessible on port 8080.
- [ ] Jenkins has Docker access.
- [ ] Pipeline job configured using **Pipeline script from SCM**.
- [ ] Repository URL configured correctly.
- [ ] Branch configured as `*/main`.
- [ ] Script Path configured as `Jenkinsfile`.
- [ ] Jenkins build succeeds.
- [ ] Pipeline tests, builds, deploys, and verifies the API.

### Automatic CI/CD

- [ ] GitHub webhook configured.
- [ ] Webhook connectivity verified, if network access permits.
- [ ] Code change pushed to GitHub.
- [ ] New Jenkins build triggered.
- [ ] Updated response verified through curl.

---

## 22. Important Commands

### Navigate to the project

```bash
cd ~/node-rest-api
```

### Run the automated test

```bash
npm test
```

### Start the API locally

```bash
npm start
```

### Build the Docker image

```bash
docker build -t node-rest-api:latest .
```

### Run the Docker container manually

```bash
docker run -d \
  --name node-api \
  -p 3000:3000 \
  node-rest-api:latest
```

### List running containers

```bash
docker ps
```

### View container logs

```bash
docker logs node-api
```

### Test the API

```bash
curl http://localhost:3000/status
```

### Commit and push changes

```bash
git add .
git commit -m "Update API"
git push
```

### Check Jenkins

Open:

```text
http://localhost:8080
```

### Check the Docker image

```bash
docker images
```

### Inspect the deployed image

```bash
docker inspect --format='{{.Config.Image}}' node-api
```

---

## Final Outcome

The completed project implements a Node.js REST API, packages it into a Docker image, stores the source code and Jenkinsfile in GitHub, and automates testing and deployment through Jenkins.

The final workflow is:

```text
Write or Modify API
        |
        v
Run Automated Tests
        |
        v
Commit and Push to GitHub
        |
        v
Jenkins Pipeline
        |
        v
Checkout Source Code
        |
        v
Install Dependencies
        |
        v
Test API
        |
        v
Build Docker Image
        |
        v
Deploy Container
        |
        v
Verify /status
        |
        v
HTTP 200 OK
```

Final endpoint:

```text
http://localhost:3000/status
```

Initial response:

```json
{
  "status": "API is running successfully"
}
```

After the automatic deployment test:

```json
{
  "status": "API updated through CI/CD"
}
```

**Lab objective achieved:** a Node.js REST API running inside Docker, with a Jenkins CI/CD pipeline that tests the code, builds an image, deploys the container, and verifies the API response.
