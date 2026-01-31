
<h1 align="center">🎯 Aspyra</h1>

<p align="center">
  <strong>AI-Powered Collaborative Learning & Productivity Platform</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#api-documentation">API</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen" alt="Node Version" />
  <img src="https://img.shields.io/badge/react-19.1.0-blue" alt="React Version" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome" />
</p>

---

## 📖 About

**Aspyra** is a modern, AI-enhanced study platform designed to help students and learners collaborate effectively. Create or join study rooms, generate AI-powered learning roadmaps, take quizzes, manage tasks with Kanban boards, and stay connected with study partners in real-time.

Whether you're studying solo or with a group, Aspyra keeps you focused and on track with intelligent tools and a beautiful, distraction-free interface.

---

## ✨ Features

### 🏠 Study Rooms
- **Create & Join Rooms** — Public or private study rooms with invite codes
- **Real-time Collaboration** — Live presence indicators and synchronized activities
- **Room Chat** — Instant messaging with emoji support
- **Progress Tracking** — Track learning progress within each room

### 🤖 AI-Powered Learning
- **Smart Roadmaps** — AI generates personalized learning paths for any topic
- **Quiz Generation** — Auto-generate quizzes from your study materials
- **Content Summaries** — Get AI summaries of complex topics
- **Task Suggestions** — AI recommends tasks based on your learning goals

### 📋 Task & Kanban Management
- **Drag & Drop Kanban** — Visual task boards with customizable columns
- **Auto-Generated Tasks** — AI creates actionable study tasks
- **Focus Sessions** — Pomodoro-style focused study timers
- **Streak Tracking** — Duo-style streak system to maintain consistency

### 👥 Social & Collaboration
- **Partner Sync** — Study with accountability partners
- **User Profiles** — Customizable profiles with avatars
- **Notifications** — Real-time alerts for room activities
- **Connect Page** — Discover and connect with other learners

### 🔐 Authentication & Security
- **Email/Password Auth** — Secure local authentication
- **Google OAuth** — One-click Google sign-in
- **JWT Tokens** — Secure API authentication
- **Rate Limiting** — Protection against abuse

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **Vite 7** | Build Tool & Dev Server |
| **React Router 7** | Client-side Routing |
| **Tailwind CSS 4** | Styling |
| **Framer Motion** | Animations |
| **Socket.IO Client** | Real-time Communication |
| **Lucide React** | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js 18+** | Runtime |
| **Express.js** | Web Framework |
| **TypeScript** | Type Safety |
| **MongoDB** | Database |
| **Redis** | Caching & Sessions |
| **Socket.IO** | WebSocket Server |
| **Google Gemini** | AI Services |
| **Passport.js** | Authentication |

### DevOps
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container Orchestration |
| **Jest** | Testing |
| **ESLint + Prettier** | Code Quality |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **Docker Desktop** (recommended) or local MongoDB + Redis
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/callmenixsh/FocusKami.git
cd FocusKami
git checkout Learncurve_complete
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration (see SETUP.md for details)

# Start MongoDB and Redis with Docker
docker-compose up -d

# Start development server
npm run dev
```

Backend runs at: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

### 4. Open in Browser

Navigate to `http://localhost:3000` and create an account to get started!

---

## 📁 Project Structure

```
FocusKami/
├── 📂 backend/
│   ├── 📂 src/
│   │   ├── 📂 config/        # Configuration (DB, Redis, Passport)
│   │   ├── 📂 controllers/   # Route handlers
│   │   ├── 📂 middleware/    # Express middleware
│   │   ├── 📂 models/        # Mongoose schemas
│   │   ├── 📂 routes/        # API route definitions
│   │   ├── 📂 services/      # Business logic
│   │   │   ├── ai.service.ts
│   │   │   ├── room.service.ts
│   │   │   ├── task.service.ts
│   │   │   ├── socket.service.ts
│   │   │   └── ...
│   │   ├── 📂 utils/         # Helper functions
│   │   ├── app.ts            # Express app setup
│   │   └── server.ts         # Entry point
│   ├── docker-compose.yml    # MongoDB + Redis
│   ├── .env.example          # Environment template
│   └── package.json
│
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── 📂 Components/    # Reusable UI components
│   │   │   ├── 📂 App/       # In-app components
│   │   │   └── 📂 landing/   # Landing page components
│   │   ├── 📂 Pages/         # Page components
│   │   │   ├── 📂 App/       # Authenticated pages
│   │   │   └── *.jsx         # Public pages
│   │   ├── 📂 contexts/      # React contexts
│   │   ├── 📂 hooks/         # Custom hooks
│   │   ├── 📂 services/      # API clients
│   │   └── main.jsx          # App entry + routing
│   ├── vite.config.js
│   └── package.json
│
├── SETUP.md                  # Detailed setup guide
└── README.md                 # This file
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory. Key variables:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=mongodb://localhost:27017/studyflow_dev
REDIS_URL=redis://localhost:6379

# Security (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
COOKIE_SECRET=your-cookie-secret

# AI (Get from https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your-gemini-api-key

# OAuth (Optional - https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# CORS
FRONTEND_URL=http://localhost:3000
```

See [SETUP.md](SETUP.md) for complete configuration guide.

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/refresh` | Refresh access token |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms` | Get user's rooms |
| POST | `/api/rooms` | Create a new room |
| GET | `/api/rooms/:id` | Get room details |
| POST | `/api/rooms/join` | Join room with code |
| DELETE | `/api/rooms/:id` | Delete a room |

### AI Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/roadmap` | Generate learning roadmap |
| POST | `/api/ai/quiz` | Generate quiz questions |
| POST | `/api/ai/summary` | Summarize content |
| POST | `/api/ai/tasks` | Generate study tasks |

### Tasks & Kanban
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/:roomId` | Get room tasks |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Linting & Formatting

```bash
# Backend
cd backend
npm run lint
npm run format

# Frontend
cd frontend
npm run lint
```

---

## 🐳 Docker

### Development

```bash
cd backend

# Start MongoDB + Redis
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Build

```bash
# Build production image
npm run docker:build:prod

# Run production
npm run docker:up:prod
```

---

## 🌐 Remote Development (Dev Tunnels)

Access your local development server from anywhere using VS Code Dev Tunnels:

1. Open VS Code Command Palette → `Dev Tunnels: Create Tunnel`
2. Forward ports 5000 (backend) and 3000 (frontend)
3. Update `.env` files with tunnel URLs
4. Share the frontend tunnel URL with collaborators

See [SETUP.md](SETUP.md#dev-tunnels-setup-remote-access) for detailed instructions.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Nixsh** ([@callmenixsh](https://github.com/callmenixsh))

---

## 🙏 Acknowledgments

- [React](https://react.dev/) — UI Framework
- [Vite](https://vitejs.dev/) — Build Tool
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [MongoDB](https://www.mongodb.com/) — Database
- [Socket.IO](https://socket.io/) — Real-time Engine
- [Google Gemini](https://ai.google.dev/) — AI Services

---

<p align="center">
  Made with ❤️ for learners everywhere
</p>

<p align="center">
  <a href="#-focuskami-learncurve">⬆ Back to Top</a>
</p>
