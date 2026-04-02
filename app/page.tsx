import db from "@/lib/db";
import { auth, signIn, signOut } from "../auth";
import { addJob, updateJobStatus, prevJobStatus, deleteJob } from "./actions";

export default async function Home() {
  const session = await auth();
  const jobs = session?.user?.id 
    ? await db.job.findMany({ where: { userId: session.user.id } }) 
    : [];
  const statuses = ['Applied', 'Interview', 'Offer', 'Rejected'];

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-blue-900 tracking-tight">Job Tracker</h1>
            {session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium bg-green-100 text-green-700 px-2 py-1 rounded-md">
                  Connected as {session.user?.name}
                </span>
                <form action={async () => { "use server"; await signOut(); }}>
                  <button className="text-xs text-red-500 hover:underline font-semibold">Sign Out</button>
                </form>
              </div>
            ) : (
              <form action={async () => { "use server"; await signIn("google"); }}>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-2">
                  Login with Google 🚀
                </button>
              </form>
            )}
          </div>

          <form action={addJob} className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            <input name="company" placeholder="Company" className="p-2 border rounded-lg text-sm w-32 md:w-40" required />
            <input name="role" placeholder="Role" className="p-2 border rounded-lg text-sm w-32 md:w-40" required />
            <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-black transition">+ Add</button>
          </form>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statuses.map((status) => (
            <div key={status} className="bg-slate-200/50 p-4 rounded-2xl min-h-[500px] border border-slate-200/60 shadow-inner">
              <div className="flex justify-between items-center mb-4 text-slate-500">
                <h2 className="font-bold uppercase text-xs tracking-widest">{status}</h2>
                <span className="bg-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold">{jobs.filter(j => j.status === status).length}</span>
              </div>
              
              <div className="space-y-3">
                {jobs.filter(j => j.status === status).map((job) => (
                  <div key={job.id} className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 group relative hover:border-blue-300 transition-all">
                    
                    {/* כפתור מחיקה - מופיע רק כשמעבירים עכבר (Hover) */}
                    <form action={async () => { "use server"; await deleteJob(job.id); }} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-slate-300 hover:text-red-500 font-bold text-xs p-1">✕</button>
                    </form>

                    <p className="font-bold text-slate-800 pr-4">{job.company}</p>
                    <p className="text-sm text-slate-500 mb-4">{job.role}</p>

                    {/* כפתורי ניווט (קדימה ואחורה) */}
                    <div className="flex gap-1">
                      {job.status !== 'Applied' && (
                        <form action={async () => { "use server"; await prevJobStatus(job.id, job.status); }} className="flex-1">
                          <button className="w-full text-[9px] bg-slate-50 hover:bg-slate-200 text-slate-500 py-1 rounded transition font-bold uppercase">
                            ← Back
                          </button>
                        </form>
                      )}
                      
                      {job.status !== 'Rejected' && (
                        <form action={async () => { "use server"; await updateJobStatus(job.id, job.status); }} className="flex-1">
                          <button className="w-full text-[9px] bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white py-1 rounded transition font-bold uppercase">
                            Next →
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}