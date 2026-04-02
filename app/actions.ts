'use server'

import db from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

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