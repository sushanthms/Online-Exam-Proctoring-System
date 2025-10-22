# 🎓 Online Exam Proctoring System

A comprehensive web-based examination platform with real-time proctoring, role-based access control, and automated monitoring features.

## ✨ Features

### 🔐 Role-Based Access Control (RBAC)
- **Two User Roles**: Students and Administrators
- **Separate Dashboards**: Customized interfaces for each role
- **Protected Routes**: Secure access control at route level
- **JWT Authentication**: Token-based authentication with role information

### 👨‍🎓 Student Features
- **Exam Taking**:
  - Browse available exams
  - Real-time timer with auto-submit
  - Randomized questions and options
  - Multiple choice questions (MCQ)
  
- **Proctoring Monitoring**:
  - Live webcam monitoring
  - Face detection using face-api.js
  - Tab switching detection (3 strikes = auto-submit)
  - Multiple face detection alerts
  - Automatic violation logging

- **Results & Analytics**:
  - Instant score calculation
  - Detailed answer review
  - Personal exam history
  - Performance statistics dashboard

### 👨‍💼 Admin Features
- **Dashboard Overview**:
  - System-wide statistics
  - User count (students/admins)
  - Total exams and submissions
  - Recent activity monitoring

- **User Management**:
  - View all registered users
  - Activate/deactivate accounts
  - Track user login history
  - Role-based user filtering

- **Exam Management**:
  - Create new exams with custom questions
  - Edit existing exams
  - Delete exams
  - Set exam duration
  - Activate/deactivate exams

- **Monitoring & Reports**:
  - View all student submissions
  - Detailed submission reports
  - Proctoring violation logs
  - Face detection event tracking
  - Tab switching reports

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend
- **React** - UI library
- **React Router** - Navigation
- **face-api.js** - Face detection
- **Axios** - HTTP client
- **CSS3** - Styling

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher)
- **MongoDB** (v4.0 or higher)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/sushanthms/online-exam-proctoring.git
cd online-exam-proctoring
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Install dependencies
npm install

# Create .env file
touch .env
or create manual an .env file
```

Add the following to your `.env` file:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/proctordb
JWT_SECRET=your_super_secret_jwt_key_here
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from root)
cd frontend

# Install dependencies
npm install

# Create .env file
touch .env
```

Add the following to your frontend `.env` file:

```env
REACT_APP_API_BASE=http://localhost:4000/api
```

### 4. Download Face Detection Models

Download the face-api.js models and place them in `frontend/public/models/`:

```bash
cd frontend/public
mkdir models
cd models

# Download from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
# Required files:
# - tiny_face_detector_model-weights_manifest.json
# - tiny_face_detector_model-shard1
```

### 5. Start MongoDB

```bash
# Start MongoDB service
mongod

# Or if using MongoDB as a service
sudo service mongod start
```
# Or Using MongoDB Compass (Recommended)

If you are using MongoDB Compass, you don’t need to run mongod manually.

Open MongoDB Compass.

In the connection window, enter the following connection string:

mongodb://127.0.0.1:27017

Click Connect.

Once connected, create or select your database (for example, proctordb).

### 6. Run the Application

**Terminal 1 - Backend:**
```bash
cd Backend
npm start
# or for development with auto-reload
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
# Verify Setup
1. The application will open at `http://localhost:3000`
2. Open browser: http://localhost:3000
3. You should see the login page
4. Register a student account through the UI
5. Login with admin credentials you just created
6. Verify you can access admin dashboard
## ⚙️ Configuration

### Backend Configuration

**Environment Variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 4000 |
| `MONGO_URI` | MongoDB connection string | mongodb://localhost:27017/proctordb |
| `JWT_SECRET` | Secret key for JWT | yoursecretkey |
| `NODE_ENV` | Environment mode | development |

### Frontend Configuration

**Environment Variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_BASE` | Backend API URL | localhost:4000/api |

## 📖 Usage

### Creating Test Accounts

#### Option 1: Using Registration Page
1. Go to `localhost:3000/register`
2. Fill in the form
3. Select role (Student or Admin)
4. Click "Create Account"

#### Option 2: Direct Database Insert

```javascript
// Connect to MongoDB
use proctordb

// Create Admin
db.users.insertOne({
  name: "Admin User",
  email: "admin@test.com",
  passwordHash: "$2b$10$YourHashedPasswordHere",
  role: "admin",
  isActive: true,
  createdAt: new Date()
})

// Create Student
db.users.insertOne({
  name: "Student User",
  email: "student@test.com",
  passwordHash: "$2b$10$YourHashedPasswordHere",
  role: "student",
  isActive: true,
  createdAt: new Date()
})
```

### User Workflows

#### Student Workflow
1. **Login** → Redirected to Student Dashboard
2. **View Available Exams** → Browse exam list
3. **Start Exam** → Accept proctoring terms
4. **Take Exam** → Answer questions with monitoring
5. **Submit** → View results immediately
6. **My Results** → View exam history

#### Admin Workflow
1. **Login** → Redirected to Admin Dashboard
2. **View Statistics** → Overview of system
3. **Create Exam** → Add questions and options
4. **Monitor Submissions** → View all student submissions
5. **Check Violations** → Review proctoring alerts
6. **Manage Users** → Activate/deactivate accounts

## 📁 Project Structure

```
online-exam-proctoring/
├── Backend/
│   ├── models/
│   │   ├── User.js                 # User model with roles
│   │   ├── ExamPaper.js            # Exam model
│   │   ├── Submission.js           # Submission model
│   │   └── MultipleFaceLog.js      # Proctoring logs
│   ├── routes/
│   │   ├── auth.js                 # Authentication routes
│   │   ├── exam.js                 # Student exam routes
│   │   ├── admin.js                # Admin routes
│   │   └── faceLog.js              # Face detection logs
│   ├── package.json
│   └── server.js                   # Express server
│
├── frontend/
│   ├── public/
│   │   ├── models/                 # face-api.js models
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── StudentDashboard.js      # Student home
│   │   │   ├── StudentDashboard.css
│   │   │   ├── AdminDashboard.js        # Admin home
│   │   │   ├── AdminDashboard.css
│   │   │   ├── LoginPage.js             # Login page
│   │   │   ├── LoginPage.css
│   │   │   ├── RegisterPage.js          # Registration
│   │   │   ├── RegisterPage.css
│   │   │   ├── ExamPage.js              # Exam interface
│   │   │   ├── ExamPage.css
│   │   │   ├── ExamCreator.js           # Create exams
│   │   │   ├── ExamCreator.css
│   │   │   ├── ResultPage.js            # View results
│   │   │   ├── ResultPage.css
│   │   │   ├── MyResultsPage.js         # Exam history
│   │   │   └── MyResultsPage.css
│   │   ├── App.js                       # Main app with routing
│   │   ├── api.js                       # API utilities
│   │   ├── index.js                     # Entry point
│   │   └── styles.css                   # Global styles
│   └── package.json
│
├── README.md
└── .gitignore
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Role-Based Access**: Middleware protection for routes
- **Token Expiry**: 8-hour token lifetime

### Proctoring Security
- **Live Camera Monitoring**: Real-time face detection
- **Tab Switching Detection**: Browser visibility API
- **Multiple Face Detection**: AI-powered monitoring
- **Automatic Logging**: All violations recorded
- **Auto-Submit**: After 3 tab switches

### Data Protection
- **Owner Verification**: Users access only their data
- **Admin Override**: Admins can view all data
- **Active Status Control**: Deactivate compromised accounts
- **CORS Protection**: Configured CORS policies

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Error
```bash
# Error: MongoNetworkError
# Solution: Ensure MongoDB is running
mongod --dbpath /path/to/data/directory
```

#### Face Detection Not Working
```bash
# Error: Cannot load models
# Solution: Verify models are in public/models/
ls frontend/public/models/
# Should see: tiny_face_detector_model-*
```

#### Camera Access Denied
```bash
# Error: NotAllowedError
# Solution: Enable camera permissions in browser
# Chrome: Settings → Privacy → Site Settings → Camera
```

#### CORS Error
```javascript
// Solution: Verify backend CORS is configured
// In Backend/server.js:
app.use(cors());
```

#### JWT Token Invalid
```bash
# Error: 401 Unauthorized
# Solution: Clear localStorage and login again
localStorage.clear();
```

#### Port Already in Use
```bash
# Error: EADDRINUSE
# Solution: Kill process using the port
# Linux/Mac:
lsof -ti:4000 | xargs kill -9
# Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### Debug Mode

Enable debug logging:

```javascript
// Backend/server.js - Add after imports
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration (Student & Admin)
- [ ] User login with role redirect
- [ ] Student can view available exams
- [ ] Student can take exam with proctoring
- [ ] Tab switching triggers warning
- [ ] Multiple face detection works
- [ ] Exam auto-submits on time expiry
- [ ] Results display correctly
- [ ] Admin can create exams
- [ ] Admin can view all submissions
- [ ] Admin can see violations
- [ ] Admin can manage users
- [ ] Unauthorized access blocked

### Test Accounts Setup Script

```javascript
// Run in MongoDB shell
use proctordb;

// Clear existing test data (optional)
db.users.deleteMany({ email: { $regex: /test\.com$/ } });

// Create test admin
db.users.insertOne({
  name: "Test Admin",
  email: "admin@test.com",
  passwordHash: "$2b$10$YourHashHere", // Use bcrypt to hash "password123"
  role: "admin",
  isActive: true,
  createdAt: new Date()
});

// Create test student
db.users.insertOne({
  name: "Test Student",
  email: "student@test.com",
  passwordHash: "$2b$10$YourHashHere", // Use bcrypt to hash "password123"
  role: "student",
  isActive: true,
  createdAt: new Date()
});
```



## 🙏 Acknowledgments

- face-api.js for face detection
- MongoDB for database
- React team for amazing library
- Express.js community
