# 🚗 Car Wash Dashboard System

A complete car wash management system built with React frontend and Node.js backend, featuring role-based authentication, service management, and real-time analytics.

## 🚀 Features

### Admin Dashboard
- **Analytics & Metrics**: Revenue charts, service statistics, daily/weekly/monthly reports
- **Service Management**: View all services across employees
- **User Management**: Create, edit, and manage employee accounts
- **Deletion Approval**: Review and approve/reject service deletion requests
- **Real-time Charts**: Interactive charts using Chart.js

### Employee Dashboard
- **Service Entry**: Quick and easy service registration forms
- **Personal Services**: View and manage own services
- **Service Editing**: Update service details
- **Deletion Requests**: Request service deletion (requires admin approval)
- **Daily Summary**: Personal revenue and service count

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Admin and Employee permission levels
- **Password Hashing**: bcrypt for secure password storage
- **Anti-Fraud Protection**: Admin approval required for deletions
- **SQL Injection Prevention**: Parameterized queries

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for modern, responsive styling
- **React Router** for navigation
- **Axios** for API calls
- **Chart.js & react-chartjs-2** for data visualization
- **Context API** for state management

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** for authentication
- **bcrypt** for password hashing
- **CORS** configured for frontend integration

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### 1. Clone Repository
```bash
git clone <repository-url>
cd lv
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb lava_jato

# Or connect to PostgreSQL and run:
# CREATE DATABASE lava_jato;
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env file with your database credentials

# Initialize database schema
psql -d lava_jato -f db/schema.sql

# Start development server
npm run dev
```

The backend will run on `http://localhost:88`

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env if needed (API URL should match backend)

# Start development server
npm start
```

The frontend will run on `http://localhost:3000`

## 🔧 Environment Configuration

### Backend (.env)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lava_jato
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=88
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
# API URL
REACT_APP_API_URL=http://localhost:88/api
```

## 👥 Default Users

The system comes with default test users:

### Administrator
- **Email**: admin@lavajato.com
- **Password**: admin123
- **Role**: Admin (full access)

### Employee
- **Email**: funcionario@lavajato.com
- **Password**: func123
- **Role**: Employee (limited access)

## 🗄 Database Schema

### Users Table
- Authentication and role management
- Stores hashed passwords and user roles

### Services Table (servicos)
- Car wash service records
- Links to employee who performed service
- Includes vehicle, customer, and financial data

### Clients Table (clientes)
- Customer information and history

### Deletion Requests Table (solicitacoes_exclusao)
- Tracks employee deletion requests
- Requires admin approval for security

## 🎨 Design Features

- **Gradient Background**: Custom gradient (#141525 to #191820)
- **Modern UI**: Clean, responsive interface
- **Interactive Charts**: Real-time data visualization
- **Mobile Responsive**: Works on all device sizes
- **Dark Theme**: Professional dark theme with glass morphism effects

## 🚀 Deployment

### Ubuntu 20.04 LTS Deployment

1. **Install Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Install PostgreSQL**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

3. **Configure PostgreSQL**:
```bash
sudo -u postgres createdb lava_jato
sudo -u postgres psql lava_jato < backend/db/schema.sql
```

4. **Install PM2** (Process Manager):
```bash
sudo npm install -g pm2
```

5. **Deploy Backend**:
```bash
cd backend
npm install --production
pm2 start server.js --name "lava-jato-api"
```

6. **Deploy Frontend**:
```bash
cd frontend
npm run build
# Serve build folder with nginx or apache
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Services
- `GET /api/servicos` - List services (with filtering)
- `POST /api/servicos` - Create service
- `PUT /api/servicos/:id` - Update service
- `DELETE /api/servicos/:id` - Delete/request deletion
- `GET /api/servicos/estatisticas` - Get statistics (admin)

### Users (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Deletion Requests (Admin only)
- `GET /api/solicitacoes` - List deletion requests
- `PUT /api/solicitacoes/:id/processar` - Approve/reject request

## 🧪 Development Commands

### Backend
```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
```

### Frontend
```bash
npm start           # Start development server
npm run build       # Build for production
npm test            # Run tests
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support or questions, please create an issue in the repository.

---

Built with ❤️ for car wash businesses