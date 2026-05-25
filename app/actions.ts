'use server'

import db from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { google } from 'googleapis'; // הייבוא החדש שנוסף

export async function addJob(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;

  const company = formData.get('company') as string;
  const role = formData.get('role') as string;

  await db.job.create({
    data: {
      company,
      role,
      userId: session.user.id,
    },
  });
  revalidatePath('/');
}

export async function updateJobStatus(jobId: string, currentStatus: string) {
  const statuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
  const currentIndex = statuses.indexOf(currentStatus);
  
  if (currentIndex < statuses.length - 1) {
    const nextStatus = statuses[currentIndex + 1];
    await db.job.update({
      where: { id: jobId },
      data: { status: nextStatus },
    });
    revalidatePath('/');
  }
}

// פונקציה חדשה: חזרה לסטטוס הקודם
export async function prevJobStatus(jobId: string, currentStatus: string) {
  const statuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
  const currentIndex = statuses.indexOf(currentStatus);
  
  if (currentIndex > 0) {
    const prevStatus = statuses[currentIndex - 1];
    await db.job.update({
      where: { id: jobId },
      data: { status: prevStatus },
    });
    revalidatePath('/');
  }
}

// פונקציה חדשה: מחיקת משרה
export async function deleteJob(jobId: string) {
  await db.job.delete({
    where: { id: jobId },
  });
  revalidatePath('/');
}

// פונקציית סנכרון המיילים המלאה
export async function syncGmailJobs() {
  try {
    // 1. קבלת הסשן של המשתמש והטוקן
    const session = await auth();
    
    // בדוק אם המשתמש מחובר ויש לו טוקן
    if (!session?.user?.id) {
      console.error("❌ Sync Gmail failed: User not authenticated");
      throw new Error("User not authenticated. Please sign in.");
    }

    if (!session.accessToken) {
      console.error("❌ Sync Gmail failed: Missing Gmail token - permissions not granted");
      throw new Error("Gmail permissions not granted. Please sign in again and accept Gmail permissions.");
    }

    console.log("✅ User authenticated with Gmail token");

    // 2. התחברות לשירות של Gmail
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials({ access_token: session.accessToken });
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    try {
      // 3. משיכת רשימת המיילים
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'subject:"application" OR subject:"interview" OR subject:"משרה" OR subject:"ראיון" OR subject:"received"', 
        maxResults: 10, 
      });

      const messages = response.data.messages || [];
      console.log(`✅ Found ${messages.length} relevant messages in Gmail`);
      let newJobsCount = 0;

      for (const message of messages) {
        if (!message.id) continue;

        // מניעת כפילויות על ידי בדיקה אם ה-ID של המייל כבר קיים במסד הנתונים
        const existingJob = await db.job.findUnique({
          where: { gmailMsgId: message.id }
        });

        if (existingJob) {
          console.log(`Skipping duplicate: ${message.id}`);
          continue;
        }

        // משיכת התוכן המלא של המייל
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });

        const headers = fullMessage.data.payload?.headers;
        const subject = headers?.find(h => h.name === 'Subject')?.value || 'ללא נושא';
        const from = headers?.find(h => h.name === 'From')?.value || '';

        let company = "חברה לא ידועה";
        
        // חילוץ שם החברה מתוך הכתובת של השולח (אחרי ה-@)
        const domainMatch = from.match(/@([\w.-]+)\./);
        if (domainMatch) {
          company = domainMatch[1].charAt(0).toUpperCase() + domainMatch[1].slice(1);
        }

        // שמירה למסד הנתונים
        await db.job.create({
          data: {
            company: company,
            role: subject.substring(0, 40) + "...",
            userId: session.user.id,
            gmailMsgId: message.id,
          }
        });
        newJobsCount++;
        console.log(`✅ Added job: ${company} - ${subject.substring(0, 30)}...`);
      }

      console.log(`✅ Sync complete! Added ${newJobsCount} new jobs`);
      
      // Verify jobs were actually saved
      const savedJobs = await db.job.findMany({ where: { userId: session.user.id } });
      console.log(`✅ Verification: ${savedJobs.length} total jobs in database for user`);
      
      revalidatePath('/');

    } catch (gmailError) {
      console.error("❌ Gmail API error:", gmailError);
      throw new Error("Failed to fetch emails from Gmail. Check your Gmail permissions.");
    }
  } catch (error) {
    console.error("❌ Error syncing Gmail:", error);
    throw error;
  }
}