# Book My Show - Project Setup Guide

---

## Project Overview

**Book My Show** is a ticket booking platform built using Spring Boot microservices on AWS EC2.

### Tech Stack
- **Backend**: Spring Boot (Java)
- **Database**: MySQL
- **Caching**: Redis
- **API Gateway**: Nginx
- **Version Control**: Git
- **CI/CD**: Jenkins
- **Deployment**: AWS EC2 (Ubuntu 22.04 LTS)

---

## Microservices Overview

1. **User Service** (Port 8001) - User registration, login, profile management
2. **Event Service** (Port 8002) - Create/manage events, movies, shows, venues
3. **Booking Service** (Port 8003) - Create bookings, seat selection, booking history
4. **Cart Service** (Port 8004) - Shopping cart management with Redis caching

Each service will have its own MySQL database.

---

## EC2 Instance Requirements

| Attribute | Specification |
|-----------|---------------|
| Instance Type | t3.medium (2 vCPU, 4 GB RAM) |
| Storage | 50 GB General Purpose SSD (gp3) |
| OS | Ubuntu 22.04 LTS |
| Security Group | Allow HTTP (80), HTTPS (443), SSH (22) |

---

## Installation Steps on EC2 (Ubuntu 22.04 LTS)

### Step 0: SSH into EC2 Instance
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-ip
```

### Step 1: Update System Packages
```bash
sudo apt update
sudo apt upgrade -y
```

---

### Step 2: Install Java (OpenJDK 17)

```bash
# Install Java
sudo apt install openjdk-17-jdk openjdk-17-jre -y

# Verify installation
java -version
javac -version

# Set JAVA_HOME (add to ~/.bashrc)
echo "export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64" >> ~/.bashrc
source ~/.bashrc
```

---

### Step 3: Install Git

```bash
# Install Git
sudo apt install git -y

# Verify installation
git --version

# Configure Git (optional)
git config --global user.name "Pritee-c"
git config --global user.email "priteechaugule@gmail.com"
```

---

### Step 4: Install Maven (Build Tool for Spring Boot)

```bash
# Install Maven
sudo apt install maven -y

# Verify installation
mvn --version
```

---

### Step 5: Install MySQL Server

```bash
# Install MySQL
sudo apt install mysql-server -y

# Secure MySQL installation
sudo mysql_secure_installation

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Verify installation
sudo mysql -u root -p -e "SELECT VERSION();"

# Create databases for each service
sudo mysql -u root -p << EOF
CREATE DATABASE userdb;
CREATE DATABASE eventdb;
CREATE DATABASE bookingdb;
CREATE DATABASE cartdb;

-- Create a dedicated user
CREATE USER 'bookmyshow'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON userdb.* TO 'bookmyshow'@'localhost';
GRANT ALL PRIVILEGES ON eventdb.* TO 'bookmyshow'@'localhost';
GRANT ALL PRIVILEGES ON bookingdb.* TO 'bookmyshow'@'localhost';
GRANT ALL PRIVILEGES ON cartdb.* TO 'bookmyshow'@'localhost';
FLUSH PRIVILEGES;
EOF
```

---

### Step 6: Install Redis

```bash
# Install Redis
sudo apt install redis-server -y

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify installation
redis-cli ping
# Output: PONG

# Check Redis version
redis-cli --version
```

---

### Step 7: Install Nginx (API Gateway)

```bash
# Install Nginx
sudo apt install nginx -y

# Start Nginx service
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
sudo systemctl status nginx

# Test Nginx
curl http://localhost
```

---

### Step 8: Install Docker

```bash
# Install Docker dependencies
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y

# Add Docker repository
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Install Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io -y

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker run hello-world
```

---

### Step 9: Install Jenkins

```bash
# Add Jenkins repository
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

# Install Jenkins
sudo apt update
sudo apt install jenkins -y

# Start Jenkins service
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Check status
sudo systemctl status jenkins

# Get initial Jenkins password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword

# Access Jenkins at: http://your-ec2-ip:8080
```

---

## Verification Commands

After installation, verify everything:

```bash
# Java
java -version

# Maven
mvn --version

# Git
git --version

# MySQL
sudo mysql -u root -p -e "SHOW DATABASES;"

# Redis
redis-cli ping

# Nginx
sudo systemctl status nginx

# Docker
docker --version
docker ps

# Jenkins
curl http://localhost:8080
```

---

## Quick Setup Summary

All services should be running on EC2:
- **User Service**: Will run on port 8001
- **Event Service**: Will run on port 8002
- **Booking Service**: Will run on port 8003
- **Cart Service**: Will run on port 8004
- **Nginx**: Routes to microservices on port 80
- **MySQL**: Database server on port 3306
- **Redis**: Cache server on port 6379
- **Jenkins**: CI/CD on port 8080

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Check `sudo lsof -i :port` and kill process |
| Docker daemon not running | `sudo systemctl restart docker` |
| Permission denied for Docker | `sudo usermod -aG docker $USER` |
| Jenkins won't start | Check logs: `sudo journalctl -u jenkins` |
| MySQL connection error | Verify credentials and database existence |

---

**Last Updated:** January 21, 2026

