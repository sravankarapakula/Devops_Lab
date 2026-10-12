# Applying CI/CD Principles to Web Development Using Jenkins, Git, GitHub, and Docker

A complete, step-by-step practical guide for implementing a CI/CD pipeline on **Ubuntu** using Git, GitHub, Jenkins, Docker, Nginx, and ngrok.

This guide covers the entire lab from scratch, including software installation, source-code creation, GitHub integration, Jenkins Freestyle job configuration, Docker deployment, ngrok tunneling, GitHub webhook configuration, verification, troubleshooting, and viva preparation.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Prepare Ubuntu](#2-prepare-ubuntu)
3. [Create the Web Application](#3-create-the-web-application)
4. [Install Docker on Ubuntu](#4-install-docker-on-ubuntu)
5. [Test the Docker Application](#5-test-the-docker-application)
6. [Install Jenkins on Ubuntu](#6-install-jenkins-on-ubuntu)
7. [Allow Jenkins to Use Docker](#7-allow-jenkins-to-use-docker)
8. [Create a GitHub Repository](#8-create-a-github-repository)
9. [Create the Jenkins Freestyle Project](#9-create-the-jenkins-freestyle-project)
10. [Test the Jenkins Job Manually](#10-test-the-jenkins-job-manually)
11. [Install and Configure ngrok](#11-install-and-configure-ngrok)
12. [Configure the GitHub Webhook](#12-configure-the-github-webhook)
13. [Test Automatic CI/CD Deployment](#13-test-automatic-cicd-deployment)
14. [Troubleshooting](#14-troubleshooting)
15. [Important Commands for the Practical Exam](#15-important-commands-for-the-practical-exam)
16. [Viva Questions and Answers](#16-viva-questions-and-answers)
17. [Final Lab Checklist](#17-final-lab-checklist)
18. [Official Documentation](#18-official-documentation)

---

# 1. Project Overview

## 1.1 Objective

To implement Continuous Integration and Continuous Deployment (CI/CD) for a web application using Git, GitHub, Jenkins, and Docker.

The pipeline will automatically deploy the updated application whenever code is pushed to GitHub and the configured webhook triggers Jenkins.

## 1.2 Technologies Used

| Technology | Purpose |
|---|---|
| Ubuntu | Operating system |
| HTML | Web application |
| Git | Version control |
| GitHub | Remote source-code repository |
| Jenkins | CI/CD automation server |
| Docker | Containerization |
| Nginx | Web server |
| ngrok | Exposes local Jenkins to the internet for webhook delivery |

## 1.3 Final Architecture

```text
Developer
   |
   | Edit index.html
   | git add / git commit / git push
   v
GitHub Repository
   |
   | Push event
   v
GitHub Webhook
   |
   | HTTPS request
   v
ngrok Public URL
   |
   | Forward to localhost:8080
   v
Jenkins Freestyle Job
   |
   | Checkout latest source code
   v
Docker Build
   |
   v
Docker Image: nginx-image1
   |
   | docker run
   v
Docker Container: container1
   |
   | Host port 8081 -> Container port 80
   v
Web Browser
   |
   v
http://localhost:8081
```

## 1.4 Important URLs and Names

| Component | Value |
|---|---|
| Jenkins | `http://localhost:8080` |
| Application | `http://localhost:8081` |
| Git branch | `main` |
| Jenkins job | `CI-CD-Docker` |
| Docker image | `nginx-image1` |
| Docker container | `container1` |
| Jenkins webhook endpoint | `/github-webhook/` |

---

# 2. Prepare Ubuntu

## Step 2.1: Update Ubuntu

Open Ubuntu Terminal using `Ctrl + Alt + T`.

Run:

```bash
sudo apt update
```

Upgrade installed packages:

```bash
sudo apt upgrade -y
```

Install the required basic utilities:

```bash
sudo apt install -y git curl wget ca-certificates gnupg unzip nano
```

Verify Git:

```bash
git --version
```

Verify curl:

```bash
curl --version
```

Both commands should display version information.

## Step 2.2: Configure Git

Configure your name:

```bash
git config --global user.name "Your Name"
```

Configure your email:

```bash
git config --global user.email "your-email@example.com"
```

Replace the example values with your details.

Verify:

```bash
git config --global --list
```

Expected configuration:

```text
user.name=Your Name
user.email=your-email@example.com
```

---

# 3. Create the Web Application

We will create a static HTML webpage served by Nginx.

## Step 3.1: Create the project directory

```bash
mkdir -p ~/ci-cd-lab
cd ~/ci-cd-lab
```

Check the current directory:

```bash
pwd
```

Expected path:

```text
/home/YOUR_USERNAME/ci-cd-lab
```

## Step 3.2: Create the project files

The directory structure will be:

```text
ci-cd-lab/
├── index.html
└── Dockerfile
```

## Step 3.3: Create `index.html`

Run:

```bash
nano index.html
```

Paste the following code:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CI/CD Lab</title>
</head>
<body>
    <h1>CI/CD using Jenkins and Docker</h1>
    <p>Application deployed successfully!</p>
    <p>Operating System: Ubuntu</p>
</body>
</html>
```

Save the file:

1. Press `Ctrl + O`.
2. Press `Enter`.
3. Press `Ctrl + X`.

Verify:

```bash
cat index.html
```

## Step 3.4: Create the Dockerfile

Run:

```bash
nano Dockerfile
```

Paste:

```dockerfile
FROM nginx:latest

COPY index.html /usr/share/nginx/html/index.html

EXPOSE 80
```

Save using `Ctrl + O`, `Enter`, and `Ctrl + X`.

Verify:

```bash
cat Dockerfile
```

### Explanation of the Dockerfile

- `FROM nginx:latest`: Uses the Nginx base image.
- `COPY index.html /usr/share/nginx/html/index.html`: Copies the webpage into Nginx's default web directory.
- `EXPOSE 80`: Documents the port on which Nginx listens inside the container.

Verify the project files:

```bash
ls -la
```

Both `index.html` and `Dockerfile` should be present.

---

# 4. Install Docker on Ubuntu

We will install Docker Engine using Docker's official Ubuntu repository.

## Step 4.1: Remove conflicting packages

```bash
sudo apt remove -y docker.io docker-doc docker-compose podman-docker containerd runc
```

This removes conflicting packages if present. It does not remove the project files.

## Step 4.2: Install prerequisites

```bash
sudo apt update
sudo apt install -y ca-certificates curl
```

## Step 4.3: Add Docker's official GPG key

Create the keyring directory:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
```

Download the Docker signing key:

```bash
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
```

Set permissions:

```bash
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

## Step 4.4: Add the Docker repository

Run:

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

Update package information:

```bash
sudo apt update
```

## Step 4.5: Install Docker Engine

```bash
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Enable and start Docker:

```bash
sudo systemctl enable --now docker
```

Check its status:

```bash
sudo systemctl status docker --no-pager
```

Look for:

```text
Active: active (running)
```

Check the version:

```bash
sudo docker --version
```

## Step 4.6: Test Docker

```bash
sudo docker run hello-world
```

Docker should download the test image if needed and print a successful test message.

## Step 4.7: Allow your Ubuntu user to run Docker

```bash
sudo usermod -aG docker "$USER"
```

Membership in the Docker group grants root-equivalent privileges. Only use this configuration on a machine you administer.

Apply the group membership by logging out and back in, or start a new login shell:

```bash
newgrp docker
```

Test:

```bash
docker ps
```

The command should run without a permission error.

If it still fails, log out of Ubuntu and log back in.

---

# 5. Test the Docker Application

## Step 5.1: Build the image

Navigate to the project directory:

```bash
cd ~/ci-cd-lab
```

Build the Docker image:

```bash
docker build -t nginx-image1 .
```

Explanation:

- `docker build`: Builds an image.
- `-t nginx-image1`: Assigns the image name.
- `.`: Uses the current directory as the build context.

Verify:

```bash
docker images
```

The output should include `nginx-image1`.

## Step 5.2: Run the container

```bash
docker run -d -p 8081:80 --name=container1 nginx-image1
```

Explanation:

| Option | Meaning |
|---|---|
| `-d` | Runs the container in the background |
| `-p 8081:80` | Maps host port 8081 to container port 80 |
| `--name=container1` | Names the container `container1` |
| `nginx-image1` | Specifies the image |

Verify:

```bash
docker ps
```

Test the application:

```bash
curl http://localhost:8081
```

The response should contain:

```html
<h1>CI/CD using Jenkins and Docker</h1>
```

Open the application in your browser:

```text
http://localhost:8081
```

If the webpage appears, Docker and Nginx are working.

Remove the test container before configuring Jenkins:

```bash
docker rm --force container1
```

**Checkpoint:** The web application and Docker image have been tested independently.

---

# 6. Install Jenkins on Ubuntu

Jenkins requires a supported Java runtime. This guide uses Java 21 and the Jenkins Long-Term Support (LTS) repository.

## Step 6.1: Install Java 21

```bash
sudo apt update
sudo apt install -y fontconfig openjdk-21-jre
```

Verify:

```bash
java -version
```

The output should identify Java 21.

Check:

```bash
which java
```

If Java 21 is unavailable in your Ubuntu repositories, verify your Ubuntu version before adding another Java repository.

## Step 6.2: Add the Jenkins repository

Download the Jenkins signing key:

```bash
sudo wget -O /etc/apt/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key
```

Add the Jenkins LTS repository:

```bash
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
```

Update package information:

```bash
sudo apt update
```

Install Jenkins:

```bash
sudo apt install -y jenkins
```

## Step 6.3: Start Jenkins

```bash
sudo systemctl enable --now jenkins
```

Check:

```bash
sudo systemctl status jenkins --no-pager
```

Look for:

```text
Active: active (running)
```

If Jenkins fails to start:

```bash
sudo journalctl -u jenkins -n 100 --no-pager
```

## Step 6.4: Unlock Jenkins

Open:

```text
http://localhost:8080
```

Retrieve the initial administrator password:

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Copy the password into the Jenkins unlock page.

Then:

1. Click **Install suggested plugins**.
2. Wait for installation to finish.
3. Create the administrator account.
4. Set the Jenkins URL to `http://localhost:8080/` if prompted.
5. Finish the setup.

Remember the administrator credentials.

## Step 6.5: Install required Jenkins plugins

In Jenkins:

1. Open **Manage Jenkins**.
2. Open **Plugins** or **Manage Plugins**.
3. Search for the following plugins.
4. Install them if they are not already installed.

Required plugins:

- Git plugin
- GitHub plugin

The Git plugin allows Jenkins to check out source code. The GitHub plugin provides webhook integration.

Restart Jenkins if prompted.

---

# 7. Allow Jenkins to Use Docker

Jenkins runs under the Linux account named `jenkins`. Docker permissions granted to your personal Ubuntu user do not automatically apply to Jenkins.

## Step 7.1: Add Jenkins to the Docker group

```bash
sudo usermod -aG docker jenkins
```

Restart Jenkins:

```bash
sudo systemctl restart jenkins
```

Verify the group membership:

```bash
id jenkins
```

The output should include `docker` among the groups.

## Step 7.2: Test Docker access as Jenkins

```bash
sudo -u jenkins docker ps
```

The command should run without a Docker permission error.

If it fails, inspect the Docker socket:

```bash
ls -l /var/run/docker.sock
```

Check Docker:

```bash
sudo systemctl status docker --no-pager
```

Do not continue until Jenkins can execute `docker ps`.

**Security note:** Access to the Docker socket gives Jenkins root-equivalent control over the host. Use this setup for a dedicated learning environment, not casually on a shared or production system.

---

# 8. Create a GitHub Repository

## Step 8.1: Create the repository

Open [GitHub](https://github.com/) and sign in.

1. Click the `+` menu.
2. Select **New repository**.
3. Enter the repository name:

   `ci-cd-jenkins-docker`

4. Choose **Public** for the simplest lab configuration, unless your assignment requires a private repository.
5. Do not initialize it with a README, `.gitignore`, or license.
6. Click **Create repository**.

The repository URL will resemble:

```text
https://github.com/YOUR_USERNAME/ci-cd-jenkins-docker.git
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 8.2: Initialize the local Git repository

```bash
cd ~/ci-cd-lab
```

Initialize Git:

```bash
git init
```

Set the branch:

```bash
git branch -M main
```

Check the files:

```bash
git status
```

Add the application files:

```bash
git add index.html Dockerfile
```

Commit:

```bash
git commit -m "Initial CI/CD web application"
```

## Step 8.3: Connect the remote repository

```bash
git remote add origin https://github.com/YOUR_USERNAME/ci-cd-jenkins-docker.git
```

Replace the placeholder with your actual GitHub username.

Verify:

```bash
git remote -v
```

Push the code:

```bash
git push -u origin main
```

GitHub may ask you to authenticate. For HTTPS, use a supported authentication method, such as GitHub CLI or a personal access token. Your regular GitHub account password is not accepted for Git HTTPS authentication.

Verify that GitHub contains:

```text
ci-cd-jenkins-docker/
├── Dockerfile
└── index.html
```

---

# 9. Create the Jenkins Freestyle Project

## Step 9.1: Create the job

Open:

```text
http://localhost:8080
```

In Jenkins:

1. Click **New Item**.
2. Enter the name:

   `CI-CD-Docker`

3. Select **Freestyle project**.
4. Click **OK**.

## Step 9.2: Configure the repository parameter

Under **General**, enable:

`This project is parameterized`

Click:

**Add Parameter → String Parameter**

Configure:

| Setting | Value |
|---|---|
| Name | `GIT_REPO_URL` |
| Default Value | `https://github.com/YOUR_USERNAME/ci-cd-jenkins-docker.git` |
| Description | GitHub repository URL |

Replace the placeholder with your actual username.

## Step 9.3: Configure Source Code Management

Find **Source Code Management** and select **Git**.

Configure:

| Setting | Value |
|---|---|
| Repository URL | `${GIT_REPO_URL}` |
| Credentials | None for a public repository |
| Branches to build | `*/main` |

For a private repository, configure appropriate credentials.

**Important:** The branch is `main`, not `master`, because this guide uses the `main` branch.

## Step 9.4: Configure the build trigger

Under **Build Triggers**, enable:

`GitHub hook trigger for GITScm polling`

This allows GitHub webhook events to trigger the job.

The webhook will be configured later.

## Step 9.5: Configure the Docker build step

Under **Build**, click:

**Add build step → Execute shell**

Do not select the Windows batch command option.

Paste the following complete script:

```bash
#!/bin/bash

set -e

# Remove the previous container if it exists.
docker rm --force container1 || true

# Build the Docker image.
docker build -t nginx-image1 .

# Start the new container.
docker run -d -p 8081:80 --name=container1 nginx-image1

# Verify the deployment.
docker ps
```

### Why use `|| true`?

On the first run, `container1` may not exist. Docker will report that there is no such container.

The `|| true` prevents this expected condition from stopping the script.

The `set -e` instruction makes the script stop if a subsequent command fails, preventing failed image builds or deployments from being silently treated as successful.

Click **Apply**, then **Save**.

---

# 10. Test the Jenkins Job Manually

## Step 10.1: Run the job

On the Jenkins dashboard:

1. Open `CI-CD-Docker`.
2. Click **Build Now**.
3. Select the build number in **Build History**.
4. Click **Console Output**.

The build should finish with:

```text
Finished: SUCCESS
```

The console should show Docker building `nginx-image1` and starting `container1`.

## Step 10.2: Verify the deployment

In Ubuntu Terminal:

```bash
docker ps
```

You should see the running container named `container1`.

Test:

```bash
curl http://localhost:8081
```

Or open:

```text
http://localhost:8081
```

The webpage should appear.

### If the build fails

Check:

```bash
sudo -u jenkins docker ps
```

Also verify:

- The Git plugin is installed.
- The GitHub repository URL is correct.
- The branch is `*/main`.
- `index.html` and `Dockerfile` have been committed and pushed.
- Port 8081 is available.

Check port usage:

```bash
sudo ss -ltnp | grep ':8081'
```

---

# 11. Install and Configure ngrok

ngrok exposes the local Jenkins service to the internet so GitHub can deliver webhook requests.

## Step 11.1: Check the processor architecture

```bash
uname -m
```

For a typical `x86_64` Ubuntu machine, download the Linux AMD64 binary.

If the result is `aarch64` or `arm64`, use the corresponding ARM64 build from the official download page:

https://ngrok.com/download/linux

## Step 11.2: Install ngrok on AMD64 Ubuntu

Download the binary:

```bash
cd ~
curl -fsSL https://bin.ngrok.com/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz -o ngrok.tgz
```

Extract:

```bash
tar -xzf ngrok.tgz
```

Install:

```bash
sudo install ngrok /usr/local/bin/ngrok
```

Verify:

```bash
ngrok version
```

Clean up:

```bash
rm -f ~/ngrok.tgz ~/ngrok
```

## Step 11.3: Configure the ngrok authtoken

Open [ngrok](https://ngrok.com/) and create an account or sign in.

Find your authtoken:

https://dashboard.ngrok.com/get-started/your-authtoken

Run:

```bash
ngrok config add-authtoken "YOUR_NGROK_AUTHTOKEN"
```

Replace the placeholder with your actual token.

**Never commit the authtoken to GitHub or share it publicly.**

Check the configuration:

```bash
ngrok config check
```

## Step 11.4: Start the Jenkins tunnel

Check Jenkins:

```bash
sudo systemctl is-active jenkins
```

Expected:

```text
active
```

Start ngrok:

```bash
ngrok http 8080
```

Keep the terminal open.

ngrok should display a forwarding URL similar to:

```text
Forwarding
https://example-subdomain.ngrok-free.app
    -> http://localhost:8080
```

Your actual URL will differ.

Open the HTTPS URL shown by ngrok. You should reach Jenkins through the public URL.

The connection now looks like:

```text
Internet
   |
   v
ngrok Public URL
   |
   v
Ubuntu localhost:8080
   |
   v
Jenkins
```

**Important notes:**

- Keep the ngrok terminal running.
- The free ngrok URL may change when the tunnel restarts.
- Use the current forwarding URL when configuring the webhook.
- Keep Jenkins authentication enabled.
- Stop the tunnel after the lab to avoid leaving Jenkins publicly accessible.

---

# 12. Configure the GitHub Webhook

## Step 12.1: Prepare the webhook URL

Suppose ngrok displays:

```text
https://example-subdomain.ngrok-free.app
```

Append:

```text
/github-webhook/
```

The complete example URL is:

```text
https://example-subdomain.ngrok-free.app/github-webhook/
```

Use your actual ngrok address.

## Step 12.2: Add the webhook in GitHub

Open your repository:

```text
https://github.com/YOUR_USERNAME/ci-cd-jenkins-docker
```

Navigate to:

**Settings → Webhooks → Add webhook**

Configure:

| Setting | Value |
|---|---|
| Payload URL | Your ngrok HTTPS URL followed by `/github-webhook/` |
| Content type | `application/json` |
| Secret | Leave blank for this basic lab |
| Events | Just the `push` event |
| Active | Enabled |

Click **Add webhook**.

Do not add `/job/CI-CD-Docker/` to the payload URL. Use the Jenkins GitHub plugin endpoint `/github-webhook/`.

## Step 12.3: Verify webhook delivery

In GitHub, open:

**Repository → Settings → Webhooks → Your webhook**

Find the recent delivery or delivery history section.

A successful delivery typically returns:

```text
HTTP 200
```

If delivery fails, check:

- ngrok is running.
- The webhook URL uses the current ngrok address.
- The URL ends in `/github-webhook/`.
- Jenkins is running.
- The GitHub plugin is installed.
- The tunnel has not expired or disconnected.

Keep ngrok running while testing.

---

# 13. Test Automatic CI/CD Deployment

## Step 13.1: Modify the application

```bash
cd ~/ci-cd-lab
nano index.html
```

Change the heading to:

```html
<h1>Automatic CI/CD Deployment Successful!</h1>
```

The rest of the HTML can remain unchanged.

Save using `Ctrl + O`, `Enter`, and `Ctrl + X`.

## Step 13.2: Commit and push

```bash
git add index.html
```

```bash
git commit -m "Test automatic CI/CD deployment"
```

```bash
git push
```

## Step 13.3: Verify Jenkins automatically starts

Open:

```text
http://localhost:8080
```

Navigate to the `CI-CD-Docker` job.

A new build should start automatically after the GitHub push event reaches Jenkins.

Open the new build's **Console Output**.

Look for:

```text
Finished: SUCCESS
```

The job should:

1. Check out the latest source code.
2. Remove the previous container.
3. Build the new Docker image.
4. Start the new container.
5. Verify the running container.

## Step 13.4: Verify the updated webpage

Run:

```bash
curl http://localhost:8081
```

The output should contain:

```html
<h1>Automatic CI/CD Deployment Successful!</h1>
```

Alternatively, refresh:

```text
http://localhost:8081
```

If the updated page appears without manually clicking **Build Now**, automatic deployment is working.

## Final CI/CD Flow

```text
git push
   |
   v
GitHub Repository
   |
   v
GitHub Webhook
   |
   v
ngrok
   |
   v
Jenkins Freestyle Job
   |
   v
Git Checkout
   |
   v
Docker Image Rebuilt
   |
   v
Old Container Replaced
   |
   v
New Webpage at localhost:8081
```

---

# 14. Troubleshooting

| Problem | Solution |
|---|---|
| Jenkins does not start | `sudo systemctl status jenkins --no-pager` |
| Jenkins logs show an error | `sudo journalctl -u jenkins -n 100 --no-pager` |
| Jenkins cannot execute Docker | `sudo -u jenkins docker ps` |
| GitHub repository cannot be cloned | Check repository URL, branch, visibility, and credentials |
| `container1` already exists | `docker rm --force container1` |
| Port 8081 is occupied | `sudo ss -ltnp \| grep ':8081'` |
| Website is inaccessible | `docker ps` and `docker logs container1` |
| ngrok authentication fails | Reconfigure with `ngrok config add-authtoken "YOUR_TOKEN"` |
| GitHub webhook fails | Check the current ngrok URL and `/github-webhook/` path |
| Push does not trigger Jenkins | Check the GitHub plugin, job trigger, webhook delivery, and branch |
| Updated webpage does not appear | Inspect Console Output and confirm the latest commit was built |

## Useful diagnostic commands

### Check Jenkins

```bash
sudo systemctl status jenkins --no-pager
```

### Read Jenkins logs

```bash
sudo journalctl -u jenkins -n 100 --no-pager
```

### Check Docker containers and images

```bash
docker ps
docker images
```

### Read container logs

```bash
docker logs container1
```

### Check Git status

```bash
cd ~/ci-cd-lab
git status
git log --oneline -5
git remote -v
```

---

# 15. Important Commands for the Practical Exam

## 15.1 Git commands

Initialize a repository:

```bash
git init
```

Check status:

```bash
git status
```

Add files:

```bash
git add .
```

Commit changes:

```bash
git commit -m "Initial commit"
```

Rename the branch:

```bash
git branch -M main
```

Add the remote repository:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ci-cd-jenkins-docker.git
```

Push to GitHub:

```bash
git push -u origin main
```

For subsequent changes:

```bash
git add .
git commit -m "Update webpage"
git push
```

## 15.2 Docker commands

Remove the previous container:

```bash
docker rm --force container1
```

Build the image:

```bash
docker build -t nginx-image1 .
```

Run the container:

```bash
docker run -d -p 8081:80 --name=container1 nginx-image1
```

List running containers:

```bash
docker ps
```

List images:

```bash
docker images
```

Read container logs:

```bash
docker logs container1
```

## 15.3 Jenkins commands

Start Jenkins:

```bash
sudo systemctl start jenkins
```

Restart Jenkins:

```bash
sudo systemctl restart jenkins
```

Check status:

```bash
sudo systemctl status jenkins --no-pager
```

Retrieve the initial administrator password:

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

## 15.4 ngrok command

Start the tunnel:

```bash
ngrok http 8080
```

---

# 16. Viva Questions and Answers

### 1. What is CI/CD?

CI stands for Continuous Integration. CD stands for Continuous Delivery or Continuous Deployment.

CI automates the process of integrating and validating code changes. CD automates the delivery or deployment of the validated application.

### 2. What is Jenkins?

Jenkins is an automation server used to implement CI/CD pipelines. It can retrieve source code, execute build steps, run tests, and deploy applications.

### 3. What is Git?

Git is a distributed version-control system used to track source-code changes.

### 4. What is GitHub?

GitHub is a platform for hosting Git repositories and collaborating on software projects.

### 5. What is Docker?

Docker packages applications and their dependencies into containers, helping applications run consistently across environments.

### 6. What is the difference between a Docker image and a container?

An image is the template used to create a container. A container is the runnable instance of an image.

In this lab:

- Image: `nginx-image1`
- Container: `container1`

### 7. What is Nginx?

Nginx is a web server that serves our `index.html` file from inside the Docker container.

### 8. Why do we use port 8081?

We map host port 8081 to container port 80.

```text
Host port 8081
      |
      v
Container port 80
      |
      v
Nginx
```

Therefore, the application is accessible at `http://localhost:8081`.

### 9. What does `docker build -t nginx-image1 .` do?

It builds a Docker image using the Dockerfile in the current directory and tags the image as `nginx-image1`.

### 10. What does `-d` mean in Docker?

The `-d` option runs the container in detached mode, allowing it to run in the background.

### 11. Why remove the old container before deploying?

The old container must be removed to avoid a name conflict with `container1` and to release its resources and port binding before starting the replacement.

### 12. What is a Jenkins Freestyle project?

It is a Jenkins job type that allows source control, build triggers, and build steps to be configured through the Jenkins web interface.

### 13. What is a GitHub webhook?

A webhook sends an HTTP request to a configured endpoint when a repository event, such as a push, occurs.

### 14. Why do we use ngrok?

ngrok provides a public endpoint that forwards requests to a local service. In this lab, it lets GitHub reach Jenkins running on Ubuntu.

### 15. Why can't GitHub directly reach `localhost:8080`?

`localhost` refers to the machine on which a process is running. GitHub's servers interpret their own `localhost`, not the developer's computer. ngrok provides a public route to local Jenkins.

### 16. What is the purpose of the `GIT_REPO_URL` parameter?

It allows the repository URL to be supplied to the Jenkins job instead of hardcoding it directly into the job's configuration.

### 17. What is the purpose of the GitHub hook trigger?

It enables the Jenkins job to respond to GitHub webhook notifications.

### 18. What happens when we run `git push`?

With the webhook configured, the flow is:

```text
git push
   |
   v
GitHub
   |
   v
Webhook
   |
   v
Jenkins
   |
   v
Docker Build and Deployment
```

### 19. What is the difference between continuous delivery and continuous deployment?

Continuous delivery prepares validated software for release, with production release potentially requiring approval. Continuous deployment automatically deploys qualifying changes to the target environment.

### 20. What is the role of the Dockerfile?

The Dockerfile specifies how to build the image, including the base image, file-copy instructions, and exposed port documentation.

---

# 17. Final Lab Checklist

Use this checklist to verify that every part of the practical is complete.

## Application and Git

- [ ] Created `index.html`.
- [ ] Created `Dockerfile`.
- [ ] Initialized the Git repository.
- [ ] Configured Git name and email.
- [ ] Created a GitHub repository.
- [ ] Pushed the source code to GitHub.
- [ ] Confirmed the repository contains both files.

## Docker

- [ ] Installed Docker Engine.
- [ ] Verified Docker using `hello-world`.
- [ ] Built the image `nginx-image1`.
- [ ] Started `container1`.
- [ ] Verified the application at `http://localhost:8081`.

## Jenkins

- [ ] Installed Java 21.
- [ ] Installed Jenkins.
- [ ] Completed the initial setup.
- [ ] Installed the Git and GitHub plugins.
- [ ] Allowed Jenkins to execute Docker commands.
- [ ] Created the `CI-CD-Docker` Freestyle project.
- [ ] Configured the `GIT_REPO_URL` parameter.
- [ ] Configured the `*/main` branch.
- [ ] Enabled the GitHub hook trigger.
- [ ] Added the Docker shell script.
- [ ] Verified that the manual build succeeds.

## Webhook and automatic deployment

- [ ] Installed ngrok.
- [ ] Configured the ngrok authtoken.
- [ ] Started the tunnel on port 8080.
- [ ] Confirmed that the public URL reaches Jenkins.
- [ ] Configured the GitHub webhook.
- [ ] Verified webhook delivery.
- [ ] Changed the HTML page.
- [ ] Committed and pushed the change.
- [ ] Confirmed Jenkins started automatically.
- [ ] Verified the updated webpage at `http://localhost:8081`.

---

# 18. Official Documentation

Use these official references if you need to verify installation details or troubleshoot version-specific issues.

- [Jenkins — Installing on Linux](https://www.jenkins.io/doc/book/installing/linux/)
- [Docker Engine — Ubuntu installation](https://docs.docker.com/engine/install/ubuntu/)
- [ngrok — Linux installation](https://ngrok.com/download/linux)
- [ngrok — Authentication](https://dashboard.ngrok.com/get-started/your-authtoken)
- [GitHub — Creating webhooks](https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks)
- [Git documentation](https://git-scm.com/doc)

---

## Final Summary

The final pipeline is:

```text
Developer
   |
   | git push
   v
GitHub Repository
   |
   | GitHub Webhook
   v
ngrok
   |
   v
Jenkins Freestyle Job
   |
   | Git checkout
   v
Docker Build
   |
   v
nginx-image1
   |
   | docker run
   v
container1
   |
   v
http://localhost:8081
```

**Practical exam tip:** First demonstrate that the manual Jenkins build works. Then modify one line of HTML, commit and push it to GitHub, and demonstrate that the webhook triggers Jenkins and updates the webpage automatically.

That final demonstration connects Git, GitHub, Jenkins, ngrok, Docker, and Nginx into a complete CI/CD workflow.