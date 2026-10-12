# LAB EXERCISE 15 — Kubernetes with Minikube on Ubuntu

## Objective

Set up a local Kubernetes cluster using Minikube on Ubuntu and complete the following seven exercises:

1. Deploy and expose an NGINX application.
2. Work with labels, selectors, and endpoints.
3. Scale Deployments and test self-healing.
4. Perform rolling updates and rollbacks.
5. Create and manage Deployments using YAML.
6. Create a ConfigMap and inject it as an environment variable.
7. Configure readiness and liveness probes.

**Important:** Execute all commands in order. Commands are intended for the Ubuntu terminal unless stated otherwise. Replace placeholders such as `YOUR_POD_NAME` with actual values from your terminal.

---

# Part 1 — Prepare Ubuntu

## Step 1: Open the terminal

Press `Ctrl + Alt + T`.

Check the Ubuntu version:

```bash
lsb_release -a
```

Check available memory and disk space:

```bash
free -h
df -h /
```

Aim for at least 2 CPUs, sufficient available memory for the cluster, and around 20 GB of free disk space if possible.

## Step 2: Update Ubuntu

```bash
sudo apt update
sudo apt upgrade -y
```

Install required utilities:

```bash
sudo apt install -y curl wget ca-certificates gnupg conntrack
```

If prompted, enter your Ubuntu password. The terminal will not display the password as you type.

---

# Part 2 — Install Docker

## Step 3: Install Docker Engine

```bash
sudo apt install -y docker.io
```

Enable and start Docker:

```bash
sudo systemctl enable --now docker
```

Verify that Docker is running:

```bash
sudo systemctl status docker --no-pager
```

Look for `active (running)`.

## Step 4: Configure Docker permissions

Add the current user to the Docker group:

```bash
sudo usermod -aG docker "$USER"
```

Apply the group membership in the current terminal:

```bash
newgrp docker
```

Test Docker:

```bash
docker run --rm hello-world
```

Expected result: a message beginning with `Hello from Docker!`.

If you get a permission error, sign out and sign back in, then run the test again.

Do not proceed until Docker works.

---

# Part 3 — Install kubectl and Minikube

## Step 5: Install kubectl

Check the system architecture:

```bash
uname -m
```

The following commands assume the output is `x86_64`.

Download the latest stable kubectl version:

```bash
cd ~
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
```

Install kubectl:

```bash
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

Verify the installation:

```bash
kubectl version --client
```

Official documentation: https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/

## Step 6: Install Minikube

Download the latest stable Minikube binary:

```bash
cd ~
curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-linux-amd64
```

Install it:

```bash
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

Remove the downloaded installer:

```bash
rm minikube-linux-amd64
```

Verify the installation:

```bash
minikube version
```

Official documentation: https://minikube.sigs.k8s.io/docs/start/

## Step 7: Verify the installed tools

```bash
kubectl version --client
minikube version
docker --version
```

All three commands should display version information.

---

# Part 4 — Start the Kubernetes cluster

## Step 8: Start Minikube

Make sure Docker is running.

Start Minikube with the Docker driver:

```bash
minikube start --driver=docker
```

The first startup may take several minutes because Kubernetes components and container images must be downloaded.

Keep your internet connection active.

Official Docker driver documentation: https://minikube.sigs.k8s.io/docs/drivers/docker/

## Step 9: Verify the cluster

Check Minikube status:

```bash
minikube status
```

Check the Kubernetes node:

```bash
kubectl get nodes
```

Check the system Pods:

```bash
kubectl get pods -A
```

Check cluster information:

```bash
kubectl cluster-info
```

**Expected result:** a node named `minikube` with status `Ready`.

If the node is `NotReady`, wait briefly and check again. If Minikube fails to start, troubleshoot the startup error before proceeding.

---

# Exercise 1 — Deploy and expose an NGINX application

## Objective

Deploy an NGINX web application using a Deployment named `webapp`, expose it through a NodePort Service, and access the application.

## Step 10: Create the Deployment

```bash
kubectl create deployment webapp --image=nginx:1.27
```

Check the Deployment:

```bash
kubectl get deployments
```

Check the Pods:

```bash
kubectl get pods
```

Wait for the Deployment to become ready:

```bash
kubectl rollout status deployment/webapp
```

Expected output:

```text
deployment "webapp" successfully rolled out
```

## Step 11: Expose the Deployment

Create a NodePort Service:

```bash
kubectl expose deployment webapp --type=NodePort --port=80
```

Check the Service:

```bash
kubectl get services
```

Inspect its configuration:

```bash
kubectl describe service webapp
```

Look for:

- Service type: `NodePort`
- Service port: `80`
- A dynamically assigned NodePort

## Step 12: Access the NGINX application

Run:

```bash
minikube service webapp --url
```

Copy the URL printed by Minikube and open it in your browser.

If the command remains active, keep that terminal open while accessing the URL.

Expected result: the NGINX welcome page displaying `Welcome to nginx!`.

---

# Exercise 2 — Labels, selectors, and endpoints

## Objective

Inspect Pod labels, filter Pods using selectors, and verify that the Service routes traffic to the correct Pods.

## Step 13: Inspect Pod labels

```bash
kubectl get pods --show-labels
```

Inspect the Deployment labels:

```bash
kubectl get deployment webapp --show-labels
```

The Pods created by the Deployment should have a label similar to:

```text
app=webapp
```

## Step 14: Select Pods using labels

```bash
kubectl get pods -l app=webapp
```

Display the selected Pods with additional information:

```bash
kubectl get pods -l app=webapp -o wide
```

Only Pods matching the selector `app=webapp` should be returned.

## Step 15: Inspect the Service selector

```bash
kubectl describe service webapp
```

Look for the `Selector` field.

It should contain:

```text
app=webapp
```

The Service uses this selector to identify the Pods that receive its traffic.

## Step 16: Verify the endpoints

```bash
kubectl get endpoints webapp
```

You can also inspect EndpointSlices:

```bash
kubectl get endpointslices
```

Expected result: the Service should have endpoints corresponding to ready NGINX Pods.

If there are no endpoints, verify that the Service selector matches the Pod labels and that the Pods are ready.

---

# Exercise 3 — Scale the Deployment and test self-healing

## Objective

Increase the replica count and verify that Kubernetes replaces a Pod when it is manually deleted.

## Step 17: Scale `webapp` to three replicas

```bash
kubectl scale deployment webapp --replicas=3
```

Wait for the rollout:

```bash
kubectl rollout status deployment/webapp
```

Check the Deployment:

```bash
kubectl get deployment webapp
```

List the Pods:

```bash
kubectl get pods -o wide
```

Expected result: three Pods belonging to the `webapp` Deployment.

## Step 18: Delete one Pod

List the Pods:

```bash
kubectl get pods
```

Copy the name of one Pod belonging to `webapp`.

Delete it using its actual name:

```bash
kubectl delete pod YOUR_POD_NAME
```

Replace `YOUR_POD_NAME` with the full Pod name displayed in your terminal.

Do not type the placeholder literally.

## Step 19: Verify self-healing

Watch the Pods:

```bash
kubectl get pods -w
```

Kubernetes should create a replacement Pod to maintain the desired replica count.

Press `Ctrl + C` to stop watching.

Verify the final state:

```bash
kubectl get deployment webapp
kubectl get pods
```

Expected result: the Deployment continues to target three replicas, and Kubernetes restores three Pods after the deleted Pod is removed.

The replacement Pod will have a different name.

---

# Exercise 4 — Rolling update and rollback

## Objective

Update the NGINX image version, inspect the rollout history, and roll back to the previous version.

## Step 20: Record the current image

```bash
kubectl get deployment webapp -o wide
```

The image should be `nginx:1.27`.

## Step 21: Update the image

```bash
kubectl set image deployment/webapp nginx=nginx:1.28
```

Wait for the rollout:

```bash
kubectl rollout status deployment/webapp
```

Inspect the Deployment:

```bash
kubectl describe deployment webapp
```

Verify the image:

```bash
kubectl get deployment webapp -o jsonpath='{.spec.template.spec.containers[0].image}'
echo
```

Expected output:

```text
nginx:1.28
```

## Step 22: View rollout history

```bash
kubectl rollout history deployment/webapp
```

This displays the Deployment revisions.

## Step 23: Roll back the update

```bash
kubectl rollout undo deployment/webapp
```

Wait for the rollback:

```bash
kubectl rollout status deployment/webapp
```

Verify the restored image:

```bash
kubectl get deployment webapp -o jsonpath='{.spec.template.spec.containers[0].image}'
echo
```

Expected output:

```text
nginx:1.27
```

This demonstrates that Kubernetes can roll a Deployment back to its previous revision.

---

# Exercise 5 — Create and manage a Deployment using YAML

## Objective

Create a Deployment configuration in YAML, apply it, and increase the replica count.

## Step 24: Create a working directory

```bash
mkdir -p ~/minikube-lab
cd ~/minikube-lab
```

Confirm the current directory:

```bash
pwd
```

All YAML files for the remaining exercises will be stored in this directory.

## Step 25: Create `deployment.yaml`

Open the Nano text editor:

```bash
nano deployment.yaml
```

Paste the following configuration:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp-yaml
spec:
  replicas: 3
  selector:
    matchLabels:
      app: webapp-yaml
  template:
    metadata:
      labels:
        app: webapp-yaml
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          ports:
            - containerPort: 80
```

Save and exit:

1. Press `Ctrl + O`.
2. Press `Enter`.
3. Press `Ctrl + X`.

## Step 26: Apply the YAML file

```bash
kubectl apply -f deployment.yaml
```

Check the Deployment:

```bash
kubectl get deployments
```

Check its Pods:

```bash
kubectl get pods -l app=webapp-yaml
```

Wait for the rollout:

```bash
kubectl rollout status deployment/webapp-yaml
```

Expected result: three replicas become ready.

## Step 27: Increase the replica count to five

Open the file:

```bash
nano deployment.yaml
```

Change:

```yaml
replicas: 3
```

to:

```yaml
replicas: 5
```

Save and exit using `Ctrl + O`, `Enter`, and `Ctrl + X`.

Apply the updated configuration:

```bash
kubectl apply -f deployment.yaml
```

Verify:

```bash
kubectl rollout status deployment/webapp-yaml
kubectl get deployment webapp-yaml
kubectl get pods -l app=webapp-yaml
```

Expected result: five desired replicas and five ready Pods.

---

# Exercise 6 — Create a ConfigMap and inject it as an environment variable

## Objective

Store configuration in a ConfigMap and inject its value into a container as an environment variable.

## Step 28: Create the ConfigMap

```bash
kubectl create configmap app-config --from-literal=environment=development
```

Check the ConfigMap:

```bash
kubectl get configmaps
```

Inspect its contents:

```bash
kubectl describe configmap app-config
```

Expected configuration:

```text
environment: development
```

## Step 29: Create `configmap-deployment.yaml`

Make sure you are in the lab directory:

```bash
cd ~/minikube-lab
```

Open the file:

```bash
nano configmap-deployment.yaml
```

Paste:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp-config
spec:
  replicas: 1
  selector:
    matchLabels:
      app: webapp-config
  template:
    metadata:
      labels:
        app: webapp-config
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          ports:
            - containerPort: 80
          env:
            - name: APP_ENV
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: environment
```

Save and exit Nano.

## Step 30: Apply the Deployment

```bash
kubectl apply -f configmap-deployment.yaml
```

Wait for the Deployment:

```bash
kubectl rollout status deployment/webapp-config
```

Check its resources:

```bash
kubectl get deployment webapp-config
kubectl get pods -l app=webapp-config
```

## Step 31: Verify the environment variable

Automatically retrieve the Pod name:

```bash
POD=$(kubectl get pods -l app=webapp-config -o jsonpath='{.items[0].metadata.name}')
```

Print the environment variable from inside the container:

```bash
kubectl exec "$POD" -- printenv APP_ENV
```

Expected output:

```text
development
```

This confirms that Kubernetes retrieved the value from the ConfigMap and injected it into the container's environment.

**Important:** updating a ConfigMap does not automatically update an environment variable inside an already-running container. Restart the Deployment's Pods after changing the value if the application needs to load the new environment variable.

---

# Exercise 7 — Configure readiness and liveness probes

## Objective

Configure HTTP probes to check whether an NGINX container is ready to receive traffic and whether it is healthy.

- **Readiness probe:** determines whether a Pod should receive Service traffic.
- **Liveness probe:** checks whether a container should be restarted.

## Step 32: Create `probes-deployment.yaml`

```bash
nano probes-deployment.yaml
```

Paste:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: probe-webapp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: probe-webapp
  template:
    metadata:
      labels:
        app: probe-webapp
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          ports:
            - containerPort: 80
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 10
```

Save and exit Nano.

## Step 33: Apply the Deployment

```bash
kubectl apply -f probes-deployment.yaml
```

Wait for rollout completion:

```bash
kubectl rollout status deployment/probe-webapp
```

Check the Pods:

```bash
kubectl get pods -l app=probe-webapp
```

Expected result: two Pods in `Running` status, each showing `1/1` ready.

## Step 34: Inspect the probes

Inspect the Deployment:

```bash
kubectl describe deployment probe-webapp
```

Inspect the Pods:

```bash
kubectl describe pod -l app=probe-webapp
```

Look for the readiness and liveness probe configurations and review the Pod events for probe failures.

## Step 35: Expose the application

Create a NodePort Service:

```bash
kubectl expose deployment probe-webapp --name=probe-webapp-service --type=NodePort --port=80
```

Check the Service:

```bash
kubectl get service probe-webapp-service
```

Check its endpoints:

```bash
kubectl get endpoints probe-webapp-service
```

Expected result: the Service should have endpoints corresponding to ready Pods.

## Step 36: Test the application

Run:

```bash
minikube service probe-webapp-service --url
```

Open the URL printed by Minikube in your browser.

Expected result: the NGINX welcome page.

Verify the final resources:

```bash
kubectl get pods -l app=probe-webapp
kubectl get service probe-webapp-service
kubectl get endpoints probe-webapp-service
```

This completes all seven exercises.

---

# Part 5 — Final verification and submission

## Step 37: Verify the cluster and resources

Run:

```bash
minikube status
kubectl get nodes
kubectl get deployments
kubectl get pods -o wide
kubectl get services
kubectl get configmaps
```

Expected Deployment replica counts:

| Deployment | Expected replicas |
|---|---:|
| `webapp` | 3 |
| `webapp-yaml` | 5 |
| `webapp-config` | 1 |
| `probe-webapp` | 2 |

Expected Services:

- `webapp`
- `probe-webapp-service`

If you deleted resources during troubleshooting, your counts may differ.

## Step 38: Capture screenshots

Capture screenshots showing:

1. Minikube status and the Kubernetes node in `Ready` status.
2. The NGINX welcome page from Exercise 1.
3. Pod labels and Service endpoints from Exercise 2.
4. Three replicas and the replacement Pod from Exercise 3.
5. The image update and rollback from Exercise 4.
6. The YAML Deployment with five replicas from Exercise 5.
7. The ConfigMap and `APP_ENV=development` output from Exercise 6.
8. The readiness/liveness probes and Service endpoints from Exercise 7.

Save the screenshots before stopping or deleting the cluster.

---

# Part 6 — Stop and restart Minikube

## Step 39: Stop Minikube

When you finish the lab, you can stop the cluster without deleting its resources:

```bash
minikube stop
```

## Step 40: Start it again later

```bash
minikube start
kubectl get nodes
```

The node should return to `Ready` after the cluster finishes starting.

**Do not run `minikube delete` unless you intentionally want to remove the cluster and its Kubernetes resources.**

---

# Troubleshooting

| Problem | Solution |
|---|---|
| `docker: permission denied` | Run `newgrp docker`, or sign out and sign back in. Retest using `docker run --rm hello-world`. |
| `minikube: command not found` | Check `which minikube` and repeat the Minikube installation if needed. |
| Node is `NotReady` | Wait briefly and run `kubectl get nodes` again. If it persists, inspect `minikube status`. |
| Pod is `ImagePullBackOff` | Check internet connectivity and inspect the Pod using `kubectl describe pod POD_NAME`. |
| Deployment is not ready | Run `kubectl describe deployment DEPLOYMENT_NAME` and `kubectl get pods`. |
| Service has no endpoints | Check that the Service selector matches the Pod labels and that the Pods are ready. |
| ConfigMap already exists | Inspect it with `kubectl get configmap app-config -o yaml` before making changes. |
| `kubectl` cannot connect to the cluster | Check `minikube status`, then try `minikube start` and `kubectl get nodes`. |

## Official documentation

- Minikube getting-started guide: https://minikube.sigs.k8s.io/docs/start/
- Minikube Docker driver: https://minikube.sigs.k8s.io/docs/drivers/docker/
- Kubernetes kubectl installation: https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/
- Kubernetes Deployments: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
- Kubernetes Services: https://kubernetes.io/docs/concepts/services-networking/service/
- Kubernetes ConfigMaps: https://kubernetes.io/docs/concepts/configuration/configmap/
- Kubernetes probes: https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/

**Final recommendation:** complete the installation and cluster verification first. Once `kubectl get nodes` shows `minikube` as `Ready`, proceed with Exercise 1 and then continue in order through Exercise 7.