'use client';

export function AuthFeedback({ isSimple = false }: { isSimple?: boolean }) {
  return (
    <div className="flex items-center justify-center space-x-2 text-indigo-600 animate-in fade-in">
      {!isSimple && <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>}
      {isSimple ? (
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Đang thực hiện xác thực...</span>
      ) : (
        <span className="text-sm font-medium">Đang xác thực...</span>
      )}
    </div>
  );
}
