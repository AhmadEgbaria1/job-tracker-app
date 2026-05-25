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

// Helper function to extract job title from subject and body
// Helper function to extract job title from subject and body
function parseJobTitle(subject: string, body: string): string {
  // --- NEW: Smart filters for LinkedIn and automated job boards ---
  const jobBoardMatches = [
    subject.match(/application to\s+(.*?)\s+at\s+/i), // "Your application to [Role] at [Company]"
    subject.match(/application for\s+(.*?)(?:$| at )/i), // "...application for [Role]"
  ];
  
  for (const match of jobBoardMatches) {
    if (match && match[1]) {
      return match[1].trim().substring(0, 60);
    }
  }
  // --------------------------------------------------------------

  // Look for common job title patterns in subject
  const jobTitlePatterns = [
    /for\s+(?:the\s+)?["']?([^"']+?)["']?\s(?:role|position)/i,
    /(?:position|role|job):\s*([^|\n]+?)(?:\||$)/i,
    /(?:data|software|product|ux|design)\s+(?:engineer|developer|analyst|manager|designer)[^|\n]*/i,
    /^(?!Re:|Fwd:)([^|\n]+?)(?:\s*[-–|]\s*|\s+@\s+)/,
  ];

  for (const pattern of jobTitlePatterns) {
    const match = subject.match(pattern);
    if (match && match[1]) {
      return match[1].trim().substring(0, 60);
    }
  }

  // Fallback to looking in body
  const bodyLower = body.toLowerCase();
  const commonTitles = [
    'senior software engineer', 'junior software engineer', 'data analyst',
    'product manager', 'ux designer', 'software developer',
    'backend engineer', 'frontend engineer', 'full stack engineer',
  ];

  for (const title of commonTitles) {
    if (bodyLower.includes(title)) {
      return title.charAt(0).toUpperCase() + title.slice(1);
    }
  }

  // Last resort: clean up the subject line if everything else fails
  return subject.replace(/^(Re:|Fwd:|Fwd|Ahmad, your application was sent to.+)/i, '').trim().substring(0, 60) || 'Unknown Role';
}

// Helper function to extract company name from email body and headers
function parseCompanyName(from: string, subject: string, body: string): string {
  // --- NEW: Smart filters for LinkedIn and automated job boards ---
  // 1. "Your application to [Role] at [Company]"
  const atMatchBoard = subject.match(/application to\s+(?:.*?)\s+at\s+(.+)/i);
  if (atMatchBoard && atMatchBoard[1]) return atMatchBoard[1].trim();

  // 2. "Ahmad, your application was sent to [Company]"
  const sentToMatch = subject.match(/application was sent to\s+(.+)/i);
  if (sentToMatch && sentToMatch[1]) return sentToMatch[1].trim();
  // --------------------------------------------------------------

  // 1. Look for company names in email signatures/body
  const signaturePatterns = [
    /(?:sent from|regards|best|thanks)[,:]?\s+([A-Z][A-Za-z\s&]+(?:Ltd|Inc|Corp|Company|Team)?)/i,
    /([A-Z][A-Za-z\s&]+)\s+(?:Sourcing|Recruitment|HR|Team)/i,
    /([A-Z][A-Za-z\s&]+)\s+(?:Team|Support)/i,
  ];

  for (const pattern of signaturePatterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      const company = match[1].trim();
      if (company.length > 2 && company.length < 60) return company;
    }
  }

  // 2. Try to extract from email domain (ignoring generic job boards!)
  const emailDomain = from.match(/[@]([a-zA-Z0-9.-]+)/)?.[1] || '';
  if (emailDomain && !emailDomain.includes('linkedin') && !emailDomain.includes('myworkday') && !emailDomain.includes('amazon')) {
    const domainPatterns = [/^([a-zA-Z]+)international/, /^([a-zA-Z]+)digital/, /^([a-zA-Z]+)ai/];
    for (const pattern of domainPatterns) {
      const match = emailDomain.match(pattern);
      if (match) return match[1].charAt(0).toUpperCase() + match[1].slice(1);
    }

    const parts = emailDomain.split('.')[0];
    if (parts.length > 2) return parts.charAt(0).toUpperCase() + parts.slice(1);
  }

  // 3. Look in subject for company clues (e.g., "@ CompanyName")
  const atMatch = subject.match(/@\s*([A-Z][A-Za-z\s&]+?)(?:\s|$)/);
  if (atMatch && atMatch[1]) return atMatch[1].trim();

  return "Unknown Company";
}
// Helper function to extract plain text from email body
function extractEmailBody(payload: any): string {
  try {
    // Try to get the body text
    if (payload?.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }
    
    if (payload?.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }
  } catch (e) {
    console.warn("Could not extract email body:", e);
  }
  
  return '';
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
        const subject = headers?.find(h => h.name === 'Subject')?.value || 'No Subject';
        const from = headers?.find(h => h.name === 'From')?.value || '';
        
        // Extract email body for better parsing
        const body = extractEmailBody(fullMessage.data.payload);

        // Parse company name using improved logic
        const company = parseCompanyName(from, subject, body);
        
        // Parse job title using improved logic
        const role = parseJobTitle(subject, body);

        // שמירה למסד הנתונים
        await db.job.create({
          data: {
            company: company,
            role: role,
            userId: session.user.id,
            gmailMsgId: message.id,
          }
        });
        newJobsCount++;
        console.log(`✅ Added job: ${company} - ${role}`);
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