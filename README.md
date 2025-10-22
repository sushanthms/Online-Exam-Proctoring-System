# Online Exam Proctoring System
A full-stack web application that allows secure online examinations with role-based access for Admin and Student users. The system includes features such as face detection, exam monitoring, automated evaluation, and result generation.

# 💻 Tech Stack
```
| Component          | Technology                      |
| ------------------ | ------------------------------- |
| **Frontend**       | React.js, HTML, CSS, JavaScript |
| **Backend**        | Node.js, Express.js             |
| **Database**       | MongoDB                         |
| **Authentication** | JWT (JSON Web Token)            |
| **Face Detection** | face-api.js                     |
| **Styling**        | CSS, Tailwind (optional)        |
```
## ⚙️ Installation

# 1️⃣ Clone the Repository
git clone https://github.com/sushanthms/online-exam-proctoring.git
cd online-exam-proctoring

# 2️⃣ Install Dependencies
cd backend
npm install
cd ../frontend
npm install

# 3️⃣ Configure Environment Variables

Create a .env file inside the backend directory:
```
MONGO_URI = your_mongodb_connection_string
JWT_SECRET = your_secret_key
PORT = 5000
```
# 4️⃣ Run the Project
# Start backend
cd backend
npm start

# Start frontend
cd ../frontend
npm start

# Project Structure
```
Online Exam Proctoring System
│
├── backend
│   ├── models
│   │   ├── ExamPaper.js
│   │   ├── MultipleFaceLog.js
│   │   ├── Submission.js
│   │   └── User.js
│   │
│   ├── routes
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── exam.js
│   │   └── faceLog.js
│   │
│   ├── .env
│   ├── package-lock.json
│   ├── package.json
│   └── server.js
│
├── frontend
│   ├── public
│   │   ├── models
│   │   │   ├── tiny_face_detector_model-shard1
│   │   │   └── tiny_face_detector_model-weights_manifest.json
│   │   └── index.html
│   │
│   ├── src
│   │   ├── components
│   │   │   ├── hooks
│   │   │   │   └── useKeyboardShortcuts.js
│   │   │   ├── AdminDashboard.css
│   │   │   ├── AdminDashboard.js
│   │   │   ├── ExamCreator.css
│   │   │   ├── ExamCreator.js
│   │   │   ├── ExamPage.css
│   │   │   ├── ExamPage.js
│   │   │   ├── HomePage.css
│   │   │   ├── HomePage.js
│   │   │   ├── LoginPage.css
│   │   │   ├── LoginPage.js
│   │   │   ├── MyResultsPage.css
│   │   │   ├── MyResultsPage.js
│   │   │   ├── Notification.js
│   │   │   ├── ProctoringOverlay.js
│   │   │   ├── RegisterPage.css
│   │   │   ├── RegisterPage.js
│   │   │   ├── ResultPage.css
│   │   │   ├── ResultPage.js
│   │   │   ├── StudentDashboard.css
│   │   │   ├── StudentDashboard.js
│   │   │   └── SubmissionPage.js
│   │   │
│   │   ├── styles
│   │   │   ├── global.css
│   │   │   └── variables.css
│   │   │
│   │   ├── api.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── styles.css
│   │
│   ├── package-lock.json
│   └── package.json
│
└── README.md
```
