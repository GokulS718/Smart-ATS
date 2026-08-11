# Smart-ATS — AI-Powered Applicant Tracking & Resume Match Engine 

<div align="center">

**Smart-ATS** is an enterprise-grade, full-stack recruitment and ATS optimization platform. It utilizes **Apache PDFBox** and **Google Gemini AI** to parse complex PDF resumes, sanitize contact icons, match technical skill matrices against job descriptions, calculate unified ATS scores, and empower HR recruiters with real-time analytics, applicant filtering, and automated SMTP email notifications.

</div> 
  
--- 
 
##  Key Features

### 1.  AI-Powered Resume Analysis & Scoring 
- **Dual Extraction Pipeline**: Combines deterministic Regex text parsing via Apache PDFBox with Google Gemini 1.5 Flash fallback.
- **Accurate Contact Extraction**: Strips Unicode contact icons (`✉`, `☎`, `📱`, `📧`, `📞`, `📇`) and handles concatenated LinkedIn URL fragments (e.g., `user@gmailin/user/` $\rightarrow$ `user@gmail.com`).
- **Indian & Global Phone Support**: Automatically normalizes 10-digit Indian numbers (`+91 75982 02292` $\rightarrow$ `7598202292`) and international formats.
- **Synchronized Scoring**: Ensures the exact ATS match score generated in Candidate Analysis is persisted to MongoDB and displayed identically in the HR Recruiter Hub.

### 2.  Multi-PDF Batch Upload (Up to 7 Resumes)
- Upload and analyze **up to 7 PDF resumes simultaneously** via drag-and-drop or multi-file picker. 
- Live progress indicators with an automated **Batch Evaluation Leaderboard** ranking candidates by match percentage. 

### 3.  Job Description Preset Combobox
- Pre-configured, high-demand industry job presets for instant evaluation:
  - **Cloud Computing**: AWS, GCP, Docker, Kubernetes, Terraform, Microservices
  - **Full Stack Web Development (FSWD)**: React, Node.js, Spring Boot, MongoDB, REST APIs
  - **Artificial Intelligence (AI)**: LLMs, Gemini/OpenAI API, Prompt Engineering, Python, Vector DB
  - **Machine Learning (AI/ML)**: Scikit-Learn, PyTorch, TensorFlow, FastAPI, Model Deployment
  - **Data Science (DS)**: Python, Pandas, NumPy, Data Modeling, Predictive Analytics 
  - **Data Analytics**: SQL, Power BI, Excel, Data Visualization, Python

### 4.  HR Recruiter Hub
- **Dynamic Numeric Threshold Filter**: Smooth score slider with `parseFloat` filtering that updates candidate rows in real time.
- **Status Management**: Instant toggles for `Accepted`, `Rejected`, and `Pending Review`.
- **Candidate Deletion**: One-click deletion (`DELETE /api/resumes/{id}`) from MongoDB with instant state sync and toast alerts.
- **Automated SMTP Email Alerts**: Send personalized acceptance, rejection, or update emails to candidates via Spring Mail.

### 5.  Real-Time Analytics Dashboard
- Interactive visualizations powered by **Recharts**: 
  - Skill Frequency Distribution Bar Chart
  - Applicant Status Breakdown Donut Chart
  - Average ATS Benchmark KPIs & Acceptance Rate Leaderboards

---

##  Architecture & Tech Stack

```
Smart-ATS/
├── backend/demo/                 # Spring Boot Backend (Java 21)
│   ├── src/main/java/com/example/demo/
│   │   ├── controller/           # REST Controllers (ResumeController, NotificationController)
│   │   ├── dto/                  # Data Transfer Objects (ATSEvaluationResponse, EvaluateRequest)
│   │   ├── model/                # MongoDB Document Entities (Resume, Evaluation)
│   │   ├── repository/           # Spring Data MongoDB Repositories
│   │   ├── service/              # Business Logic (ResumeService, GeminiService, EmailService)
│   │   └── util/                 # Regex & Sanitization (ContactExtractor)
│   ├── src/main/resources/       # application.properties
│   ├── Dockerfile                # Multi-stage Docker build for Render
│   └── pom.xml                   # Maven dependencies
├── frontend/                     # React Frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/           # UI Components (Header, Sidebar)
│   │   ├── config/               # API Base URL & Environment Config (api.js)
│   │   ├── pages/                # Dashboards (CandidateDashboard, RecruiterDashboard, AnalyticsDashboard)
│   │   ├── App.jsx               # App routing & health ping
│   │   └── main.jsx              # React DOM entry
│   ├── vercel.json               # SPA routing rewrite rules for Vercel
│   ├── .env                      # Local development environment
│   └── .env.production           # Production environment variables
└── README.md                     # Project documentation
```

### Technologies Used:
- **Frontend**: React 18, Vite 5, Tailwind CSS 3.4, Lucide React, Recharts, React Hot Toast, React Router DOM v7
- **Backend**: Java 21, Spring Boot 3.2.5, Spring Web, Spring Data MongoDB, Apache PDFBox 3.0.3, Spring Mail, Dotenv Java
- **AI Integration**: Google Gemini 1.5 Flash API (REST via Java 21 `HttpClient`)
- **Database**: MongoDB Atlas Cluster
- **Deployment**: Render (Docker Backend) + Vercel (Static Site Frontend)

---

##  Getting Started Locally

### Prerequisites
- **JDK 21** or later installed
- **Node.js 18+** & **npm** installed
- **MongoDB Atlas** database URI or local MongoDB instance

---

### 1. Backend Setup (Spring Boot)

1. Navigate to the backend directory:
   ```bash
   cd backend/demo
   ```

2. Configure environment variables in `backend/demo/.env` or `application.properties`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/SmartATS?retryWrites=true&w=majority
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-google-app-password
   GEMINI_API_KEY=your-gemini-api-key
   ```

3. Run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```
   *Windows command:*
   ```cmd
   .\mvnw.cmd spring-boot:run
   ```

Backend will be active at: `http://localhost:8080`

---

### 2. Frontend Setup (React + Vite)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Ensure `.env` is configured:
   ```env
   VITE_API_URL=http://localhost:8080
   ```

4. Start Vite development server:
   ```bash
   npm run dev
   ```

Frontend will be active at: `http://localhost:5173`

---

##  REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/resumes/upload` | Multipart upload for PDF resume; parses contact details, skills, and persists to MongoDB |
| `POST` | `/api/resumes/evaluate` | Evaluates resume text against job description keywords and returns match score & feedback |
| `GET` | `/api/resumes/all` | Retrieves all parsed candidate resumes from MongoDB |
| `PUT` | `/api/resumes/{id}/status` | Updates candidate status (`Accepted`/`Rejected`) and ATS score |
| `DELETE` | `/api/resumes/{id}` | Deletes a candidate resume by MongoDB ID |
| `POST` | `/api/notifications/send-email` | Sends status update email via Gmail SMTP |

---

## ☁️ Deployment Guide

### Backend on Render (Docker Web Service)
1. Set **Root Directory**: `backend/demo`
2. Set **Runtime**: `Docker`
3. Add Environment Variables on Render:
   - `MONGODB_URI`: `<Your MongoDB Connection String>`
   - `MAIL_USERNAME`: `<Your Gmail Address>`
   - `MAIL_PASSWORD`: `<Your Google App Password>`
   - `GEMINI_API_KEY`: `<Your Gemini API Key>`

### Frontend on Vercel
1. Set **Root Directory**: `frontend`
2. Set **Framework Preset**: `Vite`
3. Set **Build Command**: `npm run build`
4. Set **Output Directory**: `dist`
5. Add Environment Variable:
   - `VITE_API_URL`: `https://smart-ats-backend.onrender.com`

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
