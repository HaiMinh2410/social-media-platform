export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Welcome back</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder cards */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium">Unread Messages</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">12</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium">Active Bots</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">3</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium">Scheduled Posts</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">5</p>
        </div>
      </div>
    </div>
  );
}
