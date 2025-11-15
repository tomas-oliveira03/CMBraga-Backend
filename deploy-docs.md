## 1. Update the system
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install dependencies
```bash
sudo apt install -y net-tools ca-certificates curl make gnupg lsb-release software-properties-common
```

### 3. Add Docker’s official GPG key and repository
```bash
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
```

### 4. Install Docker Engine

```bash
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 5. Start and enable Docker
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### 6. Enable docker without sudo command
````bash
sudo usermod -aG docker $USER
```

