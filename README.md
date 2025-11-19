# Online Exam Proctoring System

A comprehensive web-based examination platform with real-time proctoring, role-based access control, and automated monitoring features.

##  Features

###  Role-Based Access Control (RBAC)
- **Two User Roles**: Students and Administrators
- **Separate Dashboards**: Customized interfaces for each role
- **Protected Routes**: Secure access control at route level
- **JWT Authentication**: Token-based authentication with role information

###  Student Features
- Exam Taking: Browse available exams, real-time timer with auto-submit, randomized questions and options, multiple-choice questions (MCQs)

- Proctoring Monitoring: Live webcam monitoring, tab switching alerts (3 strikes = auto-submit), multiple face detection alerts, continuous identity verification, automatic violation logging

- Results & Analytics: Instant score calculation, detailed answer review, personal exam history, performance statistics dashboard

###  Admin Features
- Dashboard Overview: System statistics, user counts (students/admins), total exams and submissions

- User Management: View all users, activate/deactivate accounts

- Exam Management: Create, edit, delete exams; set duration; activate/deactivate exams

- Monitoring & Reports: View student submissions, detailed reports, proctoring violation logs, face detection events, tab switching activity
##  Tech Stack

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

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher)
- **MongoDB** (v4.0 or higher)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/sushanthms/Online-Exam-Proctoring-System
cd online-exam-proctoring
```

### 2. Backend Setup

```
 Navigate to backend directory
cd Backend

Install dependencies
npm install

Create .env file
touch .env
or create manual an .env file
```

Add the following to your `.env` file:

```env
PORT= 5000 # The port your server will run on
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

## Download Additional Model Files
Add these models to `frontend/public/models/`:

Download from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

 **Required files:**
 ```
 - tiny_face_detector_model-weights_manifest.json
 - tiny_face_detector_model-shard1
 - face_landmark_68_model-weights_manifest.json  
 - face_landmark_68_model-shard1                 
 - face_recognition_model-weights_manifest.json  
 - face_recognition_model-shard1               
 - face_recognition_model-shard2                 
 - ssd_mobilenetv1_model-weights_manifest.json   
 - ssd_mobilenetv1_model-shard1/2/3             
 ```

# Install dependencies
npm install face-api.js
npm install react-router-dom

```

### 5. Start MongoDB

```bash
# Start MongoDB service
mongod

# Or if using MongoDB as a service
sudo service mongod start
```
# Or Using MongoDB Compass (Recommended)
```
If you are using MongoDB Compass, you don’t need to run mongod manually.

Open MongoDB Compass.

In the connection window, enter the following connection string:

mongodb://127.0.0.1:27017

Click Connect.

Once connected, create or select your database (for example, proctordb).
```

### 6. Run the Application

**Terminal 1 - Backend:**
```bash
cd Backend
npm start
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
  {
  _id: ObjectId,
  name: String,
  email: String,
  passwordHash: String,
  role: String,
  
  
  faceDescriptor: [Number], 
  isFaceRegistered: Boolean,
  faceRegisteredAt: Date,
  
  createdAt: Date,
  lastLogin: Date,
  isActive: Boolean
}
})
```

## Project Structure

```
online-exam-proctoring/
backend
├── models
│   ├── ExamPaper.js
│   ├── FaceVerificationLog.js
│   ├── MultipleFaceLog.js
│   ├── ProctorLog.js
│   ├── Submission.js
│   └── User.js
├── routes
│   ├── admin.js
│   ├── auth.js
│   ├── exam.js
│   └── faceLog.js
├── .env
├── package-lock.json
├── package.json
└── server.js     
│
frontend/
│   
├── public
│   ├── models
│   │   ├── face_landmark_68_model-shard1
│   │   ├── face_landmark_68_model-weights_manifest.json
│   │   ├── face_recognition_model-shard1
│   │   ├── face_recognition_model-shard2
│   │   ├── face_recognition_model-weights_manifest.json
│   │   ├── ssd_mobilenetv1_model-shard1
│   │   ├── tiny_face_detector_model-shard1
│   │   └── tiny_face_detector_model-weights_manifest.json
│   └── index.html
├── src
│   ├── components
│   │   ├── hooks
│   │   │   └── useKeyboardShortcuts.js
│   │   ├── AdminDashboard.css
│   │   ├── AdminDashboard.js
│   │   ├── EditExam.css
│   │   ├── EditExam.js
│   │   ├── ExamCreator.css
│   │   ├── ExamCreator.js
│   │   ├── ExamPage.css
│   │   ├── ExamPage.js
│   │   ├── FaceRegistration.css
│   │   ├── FaceRegistration.js
│   │   ├── HomePage.css
│   │   ├── HomePage.js
│   │   ├── LoginPage.css
│   │   ├── LoginPage.js
│   │   ├── MyResultsPage.css
│   │   ├── MyResultsPage.js
│   │   ├── Navbar.css
│   │   ├── Navbar.js
│   │   ├── Notification.js
│   │   ├── PreExamSetup.css
│   │   ├── PreExamSetup.js
│   │   ├── ProctoringOverlay.js
│   │   ├── ProctoringPanel.css
│   │   ├── RegisterPage.css
│   │   ├── RegisterPage.js
│   │   ├── ResultPage.css
│   │   ├── ResultPage.js
│   │   ├── ResultsPage.css
│   │   ├── ResultsPage.js
│   │   ├── StudentDashboard.css
│   │   ├── StudentDashboard.js
│   │   ├── SubmissionPage.js
│   │   └── ThemeToggle.js
│   ├── contexts
│   │   ├── BookmarkContext.js
│   │   └── ThemeContext.js
│   ├── styles
│   │   ├── global.css
│   │   ├── theme.css
│   │   └── variables.css
│   ├── api.js
│   ├── App.js
│   ├── index.js
│   └── styles.css
├── package-lock.json
├── package.json
└── start.log
```

## Security Features

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


#### Face Detection Not Working
```bash
# Error: Cannot load models
# Solution: Verify models are in public/models/
ls frontend/public/models/
# Should see: tiny_face_detector_models-*
```

#### Camera Access Denied
```bash
# Error: NotAllowedError
# Solution: Enable camera permissions in browser
# Chrome: Settings → Privacy → Site Settings → Camera
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

##  Testing

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

##  Acknowledgments

- face-api.js for face detection
- MongoDB for database
- React team for amazing library
- Express.js community
