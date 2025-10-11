# 🌟 CMBraga-Backend

Welcome to the **CMBraga-Backend**! This project serves as the backend for managing activities, users, and stations for the CMBraga system. It is built with modern technologies to ensure scalability, security, and maintainability.

---

## 🚀 Features

- 🏫 Manage stations (regular and school types)
- 👨‍👩‍👧 Manage parents and children
- 🩺 Health professional integration
- 🚌 Activity sessions with real-time updates
- 🔒 Secure authentication and role-based authorization
- 📊 Swagger API documentation for easy integration

---

## 🛠️ Technologies Used

- **Node.js**: JavaScript runtime for building scalable backend services
- **TypeScript**: Static typing for better code quality
- **Express.js**: Web framework for building RESTful APIs
- **TypeORM**: ORM for database management
- **PostgreSQL**: Relational database
- **Redis**: In-memory data store for caching
- **Swagger**: API documentation
- **LogDNA**: Centralized logging
- **Docker**: Containerization for development and deployment

---

## 📂 Project Structure

- `src/`: Source code for the backend
  - `db/`: Database entities and configuration
  - `server/routers/`: API routes
  - `lib/`: Utility libraries
  - `helpers/`: Shared types and enums
- `scripts/`: Utility scripts (e.g., database hydration)
- `config/`: Environment configuration

---

## 🖥️ Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js** (v16+)
- **npm** (v8+)
- **Docker** (optional, for containerized setup)
- **PostgreSQL** (if not using Docker)
- **Redis** (if not using Docker)

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/CMBraga-Backend.git
cd CMBraga-Backend
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
DATABASE_URL=postgres://username:password@localhost:5432/cmbraga
REDIS_URL=redis://localhost:6379
ENCRYPTION_SECRET_KEY=your_secret_key
ENCRYPTION_SECRET_IV=your_secret_iv
JWT_SECRET=your_jwt_secret
```

### 4️⃣ Run the Server

#### Using Docker 🐳

Build and start the Docker containers:

```bash
make du
```

Start the development server:

```bash
npm run dev:server
```

### 5️⃣ Hydrate the Database

Run the hydration script to populate the database with test data:

```bash
npm run hydration
```

---

## 🧪 Testing the API

### Swagger Documentation

Access the Swagger API documentation at:

```
http://localhost:3001/api/docs
```

### Example Endpoints

- **Health Check**: `GET /health`
- **Get All Stations**: `GET /station`
- **Create Parent**: `POST /parent`

---

## 🛠️ Useful Commands

### Docker Commands

- **Build Docker**: `make du`
- **Destroy Docker**: `make dd`

### Database Commands

- **Add Migration**: `make mig-gen`
- **Run Migrations**: `make mig-run`
- **Revert Migrations**: `make mig-revert`
- **Check Schema Changes**: `make schema-log`

---

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

---

## 📜 License

This project is licensed under the MIT License.