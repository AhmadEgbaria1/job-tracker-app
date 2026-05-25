# 🚀 Job Tracker Pro - Full Stack Application

A professional, secure, and interactive job application tracking system designed to streamline the career hunt. This project demonstrates modern web development practices including server-side logic, relational database management, and secure third-party authentication.

## ✨ Key Features
* **Google OAuth 2.0 Integration:** Secure user authentication and personalized sessions via Auth.js.
* **Interactive Kanban Board:** Manage your job pipeline with a dynamic board (Applied ➡️ Interview ➡️ Offer ➡️ Rejected).
* **Smart Navigation:** Effortlessly move job cards forward, backward, or delete them entirely.
* **Data Persistence:** Relational data storage using Prisma ORM to ensure your applications are never lost.
* **User Isolation:** Multi-user support where each user manages their own private dashboard.
* **Responsive UI:** Built with Tailwind CSS for a seamless experience across desktop and mobile devices.

## 🛠️ Tech Stack
* **Framework:** [Next.js 14+](https://nextjs.org/) (App Router & Server Actions)
* **Database:** [SQLite](https://www.sqlite.org/) with [Prisma ORM](https://www.prisma.io/)
* **Authentication:** [Auth.js (NextAuth)](https://authjs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Language:** TypeScript

## 🤖 Future Roadmap (AI Integration)
* **AI Email Agent:** Currently integrating **Google Gemini AI** to automatically parse Gmail notifications and update job statuses in real-time.
* **Analytics:** Visualizing application success rates and interview statistics.

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
