# Project Epoch Auction House Server

This is the backend server for the Project Epoch Auction House, built with Node.js, Express, and PostgreSQL. It supports local development using Docker Compose and automated production deployment with GitHub Actions. Designed for use with Wrath of the Lich King servers.

## Local Development

Run the server and tests on your local machine using Docker Compose.

### Prerequisites

- Node.js (version 20+)
- npm
- Docker Desktop

### Setup

1.  **Clone the repository.**
2.  **Navigate into the project directory.**
3.  **Create a `.env` file** in the root directory with the following content, filling in your local database credentials:
    ```dotenv
    DB_USERNAME=
    DB_PASSWORD=
    DB_NAME=
    ```
4.  **Install dependencies**:
    ```bash
    npm install
    ```

### Run Locally

- **Start the server**:

  ```bash
  npm run docker:app
  ```

  The server will be available at `http://localhost:3000`.

- **Run tests**:

  ```bash
  npm run docker:test
  ```

## Production Deployment

Deployment is automated via GitHub Actions when pushes occur on the `main` branch.

### Prerequisites

- A GitHub Repository.
- A Docker Hub Account.
- A Virtual Private Server (VPS) with Docker and Docker Compose installed, and SSH access.

### GitHub Secrets

Configure the following secrets in your GitHub repository (`Settings > Secrets and variables > Actions`):

- `DB_PASSWORD`: PostgreSQL database password.
- `DB_USERNAME`: PostgreSQL database username.
- `DB_NAME`: PostgreSQL database name.
- `DOCKER_TOKEN`: Your Docker Hub access token.
- `DOCKER_USERNAME`: Your Docker Hub username.
- `DOCKER_IMAGE`: Your Docker image repository name (e.g., `epoch-gold`).
- `SSH_PRIVATE_KEY`: Private SSH key for connecting to your VPS.
- `SSH_HOST`: Your VPS hostname or IP address.
- `SSH_USER`: Your SSH username for the VPS.

### Deployment Workflow

Pushes to the `main` branch will automatically trigger the following:

1.  **Tests**: Install dependencies and run unit tests.
2.  **Docker Build & Push**: Authenticate with Docker Hub, build the Docker image, and push it to `your_docker_username/your_docker_image:latest`.
3.  **Deploy to VPS**: Connect to your VPS via SSH. The `WORK_DIR` on the VPS, `/home/<SSH_USER>/epoch-gold`, is created automatically. Deployment files like `docker-compose.yml` are then transferred to this directory, and Docker Compose services are updated.
