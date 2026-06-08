# 🚀 Job Tracker Pro - Full Stack Application

Job Tracker is a modern full-stack job application dashboard built with Next.js, TypeScript, Prisma, and Google authentication. It helps job seekers stay organized by tracking applications through an interactive Kanban board: Applied → Interview → Offer → Rejected.

The app is designed to simplify the job search process by combining:

secure sign-in with Google
a clean and responsive interface
persistent job tracking with a database
Gmail integration to help import and organize relevant job-related emails
This project reflects a practical approach to building real-world software: managing user data, handling authentication, working with APIs, and creating a user-friendly experience for career planning. It is a strong example of how modern web technologies can be used to solve a daily problem in a simple and effective way.
## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/AhmadEgbaria1/job-tracker-app.git](https://github.com/AhmadEgbaria1/job-tracker-app.git)
   cd job-tracker-app
Install dependencies:

Bash
npm install
Configure Environment Variables:
Create a .env file in the root directory and add your Google Client ID, Secret, and Database URL.

Initialize Database:

Bash
npx prisma migrate dev --name init
Run the development server:

Bash
npm run dev

Developed by Ahmad Egbaria computer sicence grauate at haifa univursity
