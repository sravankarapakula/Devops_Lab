# End-to-End CI/CD Pipeline for a Java Web Application

## Student Management System — Ubuntu, Maven, Git, Docker and Jenkins

This project implements an end-to-end Continuous Integration and Continuous Deployment (CI/CD) pipeline for a Java-based Student Management REST API.

The application uses Java 17 and Spring Boot. Maven handles compilation, testing, and packaging. Git and GitHub manage version control. Docker containerizes the application, and Jenkins automates checkout, testing, image creation, deployment, and verification.

## 1. Project Objectives

- Develop a Java-based Student Management REST API.
- Implement operations to add and view student records.
- Use Maven to compile, test, and package the application.
- Write unit tests using JUnit.
- Maintain the source code and configuration files in GitHub.
- Containerize the application using Docker.
- Automate the build, test, and deployment process using Jenkins.
- Verify the deployed application from the Ubuntu host machine.

## 2. Technology Stack

| Technology | Purpose |
|---|---|
| Ubuntu | Operating system |
| Java 17 | Application development and runtime |
| Spring Boot | REST API development |
| Maven | Dependency management, testing, and packaging |
| JUnit 5 | Unit testing |
| Git | Version control |
| GitHub | Remote source code repository |
| Docker | Containerization |
| Jenkins | CI/CD automation |
| curl | API testing |

## 3. Application Endpoints

| HTTP Method | Endpoint | Description |
|---|---|---|
| GET | `/students` | Retrieve all students |
| POST | `/students` | Add a student |

Example student:

```json
{
  "id": 1,
  "name": "Akash",
  "department": "CSE"
}
```

**Note:** The application stores records in an in-memory list. Student records are lost when the application restarts. Database persistence is outside the scope of this lab.

## 4. Final Project Structure

```text
student-management/
├── src/
│   ├── main/
│   │   └── java/
│   │       └── com/
│   │           └── example/
│   │               └── student/
│   │                   ├── StudentManagementApplication.java
│   │                   ├── Student.java
│   │                   ├── StudentService.java
│   │                   └── StudentController.java
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── student/
│                       └── StudentServiceTest.java
├── pom.xml
├── .gitignore
├── Dockerfile
├── Jenkinsfile
└── README.md
```

---

# Part A — Install Required Software on Ubuntu

## Step 1. Update Ubuntu

Open the Ubuntu terminal and execute:

```bash
sudo apt update
sudo apt upgrade -y
```

## Step 2. Install Java, Maven, Git, Docker and supporting tools

```bash
sudo apt install -y \
  openjdk-17-jdk \
  openjdk-21-jre \
  maven \
  git \
  curl \
  wget \
  fontconfig \
  docker.io
```

Verify the installations:

```bash
java -version
javac -version
mvn -version
git --version
docker --version
```

Enable Docker:

```bash
sudo systemctl enable --now docker
```

Check Docker:

```bash
sudo systemctl status docker --no-pager
```

**Expected result:** Docker should be active and running.

Java 17 is used to build and run the application. Java 21 is installed to provide a compatible runtime for current Jenkins releases.

## Step 3. Install Jenkins

Configure the official Jenkins Long-Term Support repository.

Create the keyring directory:

```bash
sudo mkdir -p /etc/apt/keyrings
```

Download the repository signing key:

```bash
sudo wget -O /etc/apt/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key
```

Add the Jenkins repository:

```bash
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" \
  | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
```

Update package lists:

```bash
sudo apt update
```

Install Jenkins:

```bash
sudo apt install -y jenkins
```

Enable and start Jenkins:

```bash
sudo systemctl enable --now jenkins
```

Verify:

```bash
sudo systemctl status jenkins --no-pager
```

**Expected result:**

```text
Active: active (running)
```

Official installation instructions: [Jenkins Linux installation](https://www.jenkins.io/doc/book/installing/linux/).

## Step 4. Unlock Jenkins

Open the browser in Ubuntu and navigate to:

```text
http://localhost:8080
```

Retrieve the initial administrator password:

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Complete the setup:

1. Enter the initial administrator password.
2. Select **Install suggested plugins**.
3. Wait for the installation to finish.
4. Create the administrator account.
5. Complete the setup wizard.
6. Open the Jenkins dashboard.

### Important port configuration

Jenkins uses host port `8080`.

The Student Management application will use host port `8081`, mapped to container port `8080`. This avoids a conflict between Jenkins and the application.

If Ubuntu runs inside a virtual machine, use the browser inside the VM initially. Access from the host machine requires appropriate VM networking configuration.

---

# Part B — Create the Java Application

## Step 5. Create the project directories

```bash
mkdir -p ~/student-management
cd ~/student-management
```

Create the source and test directories:

```bash
mkdir -p src/main/java/com/example/student
mkdir -p src/test/java/com/example/student
```

Check the directory structure:

```bash
pwd
find . -maxdepth 5 -type d | sort
```

All project files will be created inside `~/student-management`.

## Step 6. Create `pom.xml`

Run:

```bash
cat > pom.xml <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">

    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.5.6</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>student-management</artifactId>
    <version>1.0.0</version>
    <name>student-management</name>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
EOF
```

## Step 7. Create `Student.java`

File location:

```text
src/main/java/com/example/student/Student.java
```

Create it using:

```bash
cat > src/main/java/com/example/student/Student.java <<'EOF'
package com.example.student;

public class Student {

    private int id;
    private String name;
    private String department;

    public Student() {
    }

    public Student(int id, String name, String department) {
        this.id = id;
        this.name = name;
        this.department = department;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }
}
EOF
```

## Step 8. Create `StudentService.java`

File location:

```text
src/main/java/com/example/student/StudentService.java
```

Create it using:

```bash
cat > src/main/java/com/example/student/StudentService.java <<'EOF'
package com.example.student;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class StudentService {

    private final List<Student> students = new ArrayList<>();

    public Student addStudent(Student student) {
        students.add(student);
        return student;
    }

    public List<Student> getAllStudents() {
        return students;
    }
}
EOF
```

## Step 9. Create `StudentController.java`

File location:

```text
src/main/java/com/example/student/StudentController.java
```

Create it using:

```bash
cat > src/main/java/com/example/student/StudentController.java <<'EOF'
package com.example.student;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping
    public Student addStudent(@RequestBody Student student) {
        return studentService.addStudent(student);
    }

    @GetMapping
    public List<Student> getStudents() {
        return studentService.getAllStudents();
    }
}
EOF
```

## Step 10. Create `StudentManagementApplication.java`

File location:

```text
src/main/java/com/example/student/StudentManagementApplication.java
```

Create it using:

```bash
cat > src/main/java/com/example/student/StudentManagementApplication.java <<'EOF'
package com.example.student;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StudentManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(StudentManagementApplication.class, args);
    }
}
EOF
```

## Step 11. Create the unit test

File location:

```text
src/test/java/com/example/student/StudentServiceTest.java
```

Create it using:

```bash
cat > src/test/java/com/example/student/StudentServiceTest.java <<'EOF'
package com.example.student;

import org.junit.jupiter.api.Test;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class StudentServiceTest {

    @Test
    void shouldAddAndRetrieveStudent() {
        StudentService service = new StudentService();

        Student student = new Student(1, "Akash", "CSE");
        service.addStudent(student);

        List<Student> students = service.getAllStudents();

        assertEquals(1, students.size());
        assertEquals("Akash", students.get(0).getName());
        assertEquals("CSE", students.get(0).getDepartment());
    }
}
EOF
```

## Step 12. Create `.gitignore`

File location:

```text
.gitignore
```

Create it using:

```bash
cat > .gitignore <<'EOF'
target/
.idea/
.vscode/
*.iml
EOF
```

---

# Part C — Build and Test with Maven

## Step 13. Set Java 17 for the current terminal

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH="$JAVA_HOME/bin:$PATH"
```

Verify:

```bash
java -version
mvn -version
```

Both should show Java 17.

## Step 14. Run the unit tests

```bash
mvn test
```

**Expected result:** The test passes without failures or errors.

## Step 15. Compile, test and package

```bash
mvn clean package
```

The build should finish with:

```text
BUILD SUCCESS
```

Verify the JAR:

```bash
ls -lh target/student-management-1.0.0.jar
```

Expected file:

```text
target/student-management-1.0.0.jar
```

Maven lifecycle commands:

```bash
mvn compile
mvn test
mvn package
mvn clean package
mvn dependency:tree
```

### Screenshot 1 — Maven

Capture a screenshot showing the successful `mvn clean package` execution and passing tests.

---

# Part D — Test the Application Locally

## Step 16. Start the application

```bash
java -jar target/student-management-1.0.0.jar
```

Keep this terminal open.

Open a second terminal for API testing.

## Step 17. Test GET

```bash
curl http://localhost:8080/students
```

Expected:

```json
[]
```

## Step 18. Test POST

```bash
curl -X POST http://localhost:8080/students \
  -H "Content-Type: application/json" \
  -d '{"id":1,"name":"Akash","department":"CSE"}'
```

Expected:

```json
{"id":1,"name":"Akash","department":"CSE"}
```

## Step 19. Retrieve the students

```bash
curl http://localhost:8080/students
```

Expected:

```json
[{"id":1,"name":"Akash","department":"CSE"}]
```

Return to the application terminal and press `Ctrl+C` to stop it.

---

# Part E — Git and GitHub

## Step 20. Configure Git

Replace the example values with your details:

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

## Step 21. Initialize the repository

```bash
cd ~/student-management
git init
git branch -M main
```

Add the source files:

```bash
git add pom.xml .gitignore src
```

Create the initial commit:

```bash
git commit -m "Add Student Management application and unit test"
```

Check the commit:

```bash
git log --oneline
git status
```

## Step 22. Create the GitHub repository

1. Visit [GitHub — New Repository](https://github.com/new).
2. Name the repository `student-management`.
3. Select Public or Private as required.
4. Do not initialize it with a README, `.gitignore`, or license.
5. Create the repository.
6. Copy the HTTPS repository URL.

Connect the local repository, replacing the example URL:

```bash
git remote add origin https://github.com/YOUR_USERNAME/student-management.git
```

Push:

```bash
git push -u origin main
```

For HTTPS authentication, use an appropriate credential method, such as a personal access token or GitHub CLI authentication. GitHub account passwords are not accepted for HTTPS Git pushes.

Verify that the source code appears on GitHub.

---

# Part F — Docker Containerization

## Step 23. Create `Dockerfile`

File location:

```text
Dockerfile
```

Create it using:

```bash
cat > Dockerfile <<'EOF'
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY target/student-management-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
EOF
```

## Step 24. Commit and push Dockerfile

```bash
git add Dockerfile
git commit -m "Add Docker containerization"
git push
```

## Step 25. Build the JAR and Docker image

```bash
mvn clean package
```

Build the image:

```bash
docker build -t student-management:latest .
```

Verify:

```bash
docker images
```

Expected image:

```text
student-management    latest
```

## Step 26. Run the Docker container

The host port is `8081`; the application listens on port `8080` inside the container.

```bash
docker run -d \
  --name student-management-container \
  -p 8081:8080 \
  student-management:latest
```

Check:

```bash
docker ps
```

View logs:

```bash
docker logs student-management-container
```

## Step 27. Test the containerized application

```bash
curl http://localhost:8081/students
```

Expected:

```json
[]
```

Add a student:

```bash
curl -X POST http://localhost:8081/students \
  -H "Content-Type: application/json" \
  -d '{"id":1,"name":"Akash","department":"CSE"}'
```

Retrieve students:

```bash
curl http://localhost:8081/students
```

Expected:

```json
[{"id":1,"name":"Akash","department":"CSE"}]
```

### Screenshot 2 — Docker

Capture screenshots showing:

```bash
docker images
docker ps
curl http://localhost:8081/students
```

Before configuring Jenkins deployment, remove the manually created container:

```bash
docker rm -f student-management-container
```

---

# Part G — Jenkins Configuration

## Step 28. Allow Jenkins to access Docker

Add Jenkins to the Docker group:

```bash
sudo usermod -aG docker jenkins
```

Restart Jenkins:

```bash
sudo systemctl restart jenkins
```

Check Docker:

```bash
sudo systemctl status docker --no-pager
```

Check Jenkins:

```bash
sudo systemctl status jenkins --no-pager
```

Both services should be active.

**Security warning:** Docker group membership effectively grants root-level privileges. Use this configuration only in a controlled lab environment.

## Step 29. Create `Jenkinsfile`

File location:

```text
Jenkinsfile
```

Create it using:

```bash
cat > Jenkinsfile <<'EOF'
pipeline {
    agent any

    environment {
        JAVA_HOME = '/usr/lib/jvm/java-17-openjdk-amd64'
        PATH = '/usr/lib/jvm/java-17-openjdk-amd64/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Maven Build and Test') {
            steps {
                sh 'java -version'
                sh 'mvn clean package'
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t student-management:latest .'
            }
        }

        stage('Deploy Container') {
            steps {
                sh 'docker rm -f student-management-container || true'
                sh 'docker run -d --name student-management-container -p 8081:8080 student-management:latest'
            }
        }

        stage('Verify Deployment') {
            steps {
                sh 'curl --retry 10 --retry-delay 2 --retry-connrefused --fail http://localhost:8081/students'
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
EOF
```

The pipeline contains five stages:

1. Checkout source code.
2. Build and test using Maven.
3. Build the Docker image.
4. Deploy the Docker container.
5. Verify that the application responds to an HTTP request.

If the deployment or verification fails, Jenkins marks the build as failed.

## Step 30. Commit and push Jenkinsfile

```bash
git add Jenkinsfile
git commit -m "Add Jenkins CI/CD pipeline"
git push
```

Verify:

```bash
git log --oneline
git status
```

The final repository should contain:

```text
student-management/
├── src/
├── pom.xml
├── .gitignore
├── Dockerfile
├── Jenkinsfile
└── README.md
```

---

# Part H — Create the Jenkins Pipeline Job

## Step 31. Open Jenkins

Open:

```text
http://localhost:8080
```

Log in to Jenkins.

## Step 32. Create a new pipeline

1. Click **New Item**.
2. Enter the name `Student-Management-CICD`.
3. Select **Pipeline**.
4. Click **OK**.

## Step 33. Configure Pipeline from SCM

Scroll to the Pipeline section and configure:

| Setting | Value |
|---|---|
| Definition | Pipeline script from SCM |
| SCM | Git |
| Repository URL | `https://github.com/YOUR_USERNAME/student-management.git` |
| Branch Specifier | `*/main` |
| Script Path | `Jenkinsfile` |

Replace `YOUR_USERNAME` with your GitHub username.

If the repository is public, credentials can generally be left empty. If private, configure GitHub credentials and select them.

Click **Save**.

## Step 34. Run the pipeline

1. Click **Build Now**.
2. Open the build number.
3. Click **Console Output**.
4. Wait for all stages to complete.

Expected stage order:

```text
Checkout
    |
    v
Maven Build and Test
    |
    v
Docker Build
    |
    v
Deploy Container
    |
    v
Verify Deployment
```

Expected result:

```text
Finished: SUCCESS
```

### Screenshot 3 — Jenkins

Capture the Jenkins Pipeline Stage View showing all five stages successful.

Also capture the Console Output if the lab requires evidence of the build and test results.

---

# Part I — Final Deployment Verification

## Step 35. Check Docker

```bash
docker images
```

```bash
docker ps
```

The running container should be named:

```text
student-management-container
```

## Step 36. Test the application

```bash
curl http://localhost:8081/students
```

Add a student:

```bash
curl -X POST http://localhost:8081/students \
  -H "Content-Type: application/json" \
  -d '{"id":101,"name":"Rahul","department":"IT"}'
```

Retrieve the students:

```bash
curl http://localhost:8081/students
```

Expected response:

```json
[{"id":101,"name":"Rahul","department":"IT"}]
```

Open the application in your browser:

```text
http://localhost:8081/students
```

The browser should display the JSON response.

---

# Part J — Troubleshooting

## Problem 1. Jenkins does not start

Check the service:

```bash
sudo systemctl status jenkins --no-pager
```

Check recent logs:

```bash
sudo journalctl -u jenkins -n 100 --no-pager
```

## Problem 2. Docker permission denied

Run:

```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

Then run the Jenkins pipeline again.

If the error persists, inspect the Jenkins service's effective group membership and Docker socket permissions:

```bash
id jenkins
ls -l /var/run/docker.sock
```

## Problem 3. Application is not responding

Check the containers:

```bash
docker ps -a
```

Check logs:

```bash
docker logs student-management-container
```

Test the HTTP endpoint:

```bash
curl -v http://localhost:8081/students
```

## Problem 4. Port 8081 is already occupied

Check:

```bash
sudo ss -ltnp | grep ':8081'
```

Stop the conflicting service or select a different host port. If you change the port, update the Docker run command, Jenkinsfile deployment command, verification URL, and API test URLs consistently.

## Problem 5. Maven build fails

Check Java:

```bash
java -version
```

Check Maven's Java version:

```bash
mvn -version
```

Set Java 17:

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH="$JAVA_HOME/bin:$PATH"
```

Run the build again:

```bash
mvn clean test
mvn clean package
```

## Problem 6. Git push fails

Check the remote:

```bash
git remote -v
```

Check the branch:

```bash
git branch
```

Check the working tree:

```bash
git status
```

If authentication fails, configure GitHub HTTPS authentication or GitHub CLI authentication.

## Problem 7. Jenkins cannot access the repository

Verify the repository URL in Jenkins. For a private repository, configure appropriate Git credentials under Jenkins credentials management and select them in the pipeline configuration.

---

# Part K — Required Screenshots

Capture these four screenshots for the practical submission.

## Screenshot 1. GitHub Repository and Commits

Show:

- Repository name.
- `src` directory.
- `pom.xml`.
- `Dockerfile`.
- `Jenkinsfile`.
- Commit history.

Expected meaningful commits include:

```text
Add Student Management application and unit test
Add Docker containerization
Add Jenkins CI/CD pipeline
```

## Screenshot 2. Maven Build and Test

Show the command:

```bash
mvn clean package
```

The output should show passing tests and:

```text
BUILD SUCCESS
```

## Screenshot 3. Docker Image and Running Container

Show:

```bash
docker images
docker ps
curl http://localhost:8081/students
```

The output should demonstrate the image, running container, and application response.

## Screenshot 4. Successful Jenkins Pipeline

Show the Jenkins Pipeline Stage View with these stages successful:

```text
Checkout
Maven Build and Test
Docker Build
Deploy Container
Verify Deployment
```

---

# Part L — Final Execution Checklist

Follow this order when implementing the lab from scratch.

- [ ] Install Java, Maven, Git, Docker and Jenkins.
- [ ] Complete Jenkins initial setup.
- [ ] Create the Maven project directory structure.
- [ ] Create `pom.xml`.
- [ ] Create the four Java source files.
- [ ] Create the JUnit unit test.
- [ ] Create `.gitignore`.
- [ ] Run `mvn test`.
- [ ] Run `mvn clean package`.
- [ ] Test the application locally using `curl`.
- [ ] Initialize Git and create the initial commit.
- [ ] Create the GitHub repository and push the project.
- [ ] Create and commit the Dockerfile.
- [ ] Build the Docker image.
- [ ] Run and test the Docker container.
- [ ] Remove the manually started container.
- [ ] Give Jenkins access to Docker.
- [ ] Create and commit the Jenkinsfile.
- [ ] Push all changes to GitHub.
- [ ] Configure the Jenkins Pipeline from SCM.
- [ ] Run **Build Now**.
- [ ] Verify all five stages.
- [ ] Test the deployed application.
- [ ] Capture all four required screenshots.

---

# Part M — Important Notes

1. **Host ports:** Jenkins uses `8080`; the application uses `8081` on the host and `8080` inside the container.
2. **Java version:** Maven builds the application with Java 17. Jenkins must also have a compatible runtime; current Jenkins releases require a supported Java version.
3. **GitHub authentication:** Use a personal access token, GitHub CLI, or another supported authentication method for HTTPS pushes when prompted.
4. **Docker permissions:** Jenkins requires permission to communicate with Docker.
5. **Data persistence:** Student records exist only in memory and disappear when the application restarts.
6. **Deployment model:** This lab deploys the container on the same Ubuntu machine running Jenkins.
7. **Pipeline trigger:** This configuration supports manual builds using **Build Now**. Automatic triggering on every GitHub push requires an additional webhook or polling configuration.
8. **Failure handling:** If a stage fails, inspect the Jenkins Console Output before proceeding.
9. **Repository URL:** Replace all occurrences of `YOUR_USERNAME` with your actual GitHub username.
10. **Screenshots:** Submit screenshots from your own successful executions, not example images.

## References

- [Apache Maven](https://maven.apache.org/)
- [Spring Boot Documentation](https://docs.spring.io/spring-boot/)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Documentation](https://docs.github.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Jenkins Documentation](https://www.jenkins.io/doc/book/installing/linux/)

**End of Lab Guide**