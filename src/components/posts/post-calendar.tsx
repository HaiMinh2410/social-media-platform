'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { PostDTO, PostStatus } from '@/domain/types/posts';

// ─── Types ───────────────────────────────────────────────────────────────────

type PostCalendarProps = {
  posts: PostDTO[];
  onDayClick: (dateStr: string) => void; // YYYY-MM-DD
  onPostClick: (post: PostDTO) => void;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_DOT: Record<PostStatus, string> = {
  scheduled: 'bg-blue-400',
  published: 'bg-emerald-400',
  error: 'bg-red-400',
  draft: 'bg-slate-500',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function padZero(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${padZero(month + 1)}-${padZero(day)}`;
}

type CalendarCell = {
  dateKey: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PostCalendar({ posts, onDayClick, onPostClick }: PostCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  // Build posts-per-day map
  const postsByDay = useMemo(() => {
    const map: Record<string, PostDTO[]> = {};
    for (const post of posts) {
      if (!post.scheduledAt) continue;
      const d = new Date(post.scheduledAt);
      const key = `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
      if (!map[key]) map[key] = [];
      map[key].push(post);
    }
    return map;
  }, [posts]);

  // Build calendar grid
  const cells = useMemo<CalendarCell[]>(() => {
    const result: CalendarCell[] = [];
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    // Leading empty cells from previous month
    const prevMonthDays = getDaysInMonth(year, month === 0 ? 11 : month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateKey = toDateKey(prevYear, prevMonth, day);
      result.push({ dateKey, day, isCurrentMonth: false, isToday: false });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = toDateKey(year, month, day);
      result.push({ dateKey, day, isCurrentMonth: true, isToday: dateKey === todayKey });
    }

    // Trailing cells to fill 6 rows × 7 cols
    const total = Math.ceil(result.length / 7) * 7;
    let nextDay = 1;
    while (result.length < total) {
      const nextMon = month === 11 ? 0 : month + 1;
      const nextYr = month === 11 ? year + 1 : year;
      const dateKey = toDateKey(nextYr, nextMon, nextDay);
      result.push({ dateKey, day: nextDay, isCurrentMonth: false, isToday: false });
      nextDay++;
    }

    return result;
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h3 className="text-base font-semibold text-white">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b border-slate-800/60">
        {DAY_NAMES.map((name) => (
          <div key={name} className="py-2 text-center text-xs font-medium text-slate-500">
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {cells.map((cell, idx) => {
          const dayPosts = postsByDay[cell.dateKey] ?? [];
          const isLastRow = idx >= cells.length - 7;

          return (
            <div
              key={`${cell.dateKey}-${idx}`}
              onClick={() => cell.isCurrentMonth && onDayClick(cell.dateKey)}
              className={`relative min-h-[80px] p-2 border-b border-r border-slate-800/40 transition-colors ${
                isLastRow ? 'border-b-0' : ''
              } ${cell.isCurrentMonth
                  ? 'cursor-pointer hover:bg-slate-800/40'
                  : 'cursor-default opacity-30'
              }`}
            >
              {/* Day number */}
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium mb-1 ${
                cell.isToday
                  ? 'bg-blue-500 text-white'
                  : cell.isCurrentMonth
                    ? 'text-slate-300'
                    : 'text-slate-600'
              }`}>
                {cell.day}
              </div>

              {/* Post dots & mini cards */}
              <div className="space-y-0.5">
                {dayPosts.slice(0, 3).map((post) => (
                  <button
                    key={post.id}
                    onClick={(e) => { e.stopPropagation(); onPostClick(post); }}
                    title={post.content ?? 'No content'}
                    className="w-full flex items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-slate-700/60 transition-colors group/post"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[post.status] ?? 'bg-slate-500'}`} />
                    <span className="text-[10px] text-slate-400 group-hover/post:text-slate-200 truncate leading-tight">
                      {post.content?.slice(0, 18) ?? '(media)'}
                    </span>
                  </button>
                ))}
                {dayPosts.length > 3 && (
                  <span className="block px-1 text-[10px] text-slate-500">
                    +{dayPosts.length - 3} more
                  </span>
                )}
              </div>

              {/* Add post hint on hover */}
              {cell.isCurrentMonth && dayPosts.length === 0 && (
                <div className="absolute bottom-1 right-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                  <Plus className="h-3 w-3 text-slate-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
