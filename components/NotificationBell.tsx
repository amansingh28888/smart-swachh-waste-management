"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/types";
import { timeAgo } from "@/lib/utils/format";
import { EmptyState } from "@/components/ui/EmptyState";

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (active && data) setItems(data as AppNotification[]);
    }
    load();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => setItems((prev) => [payload.new as AppNotification, ...prev])
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const unread = items.filter((n) => !n.read).length;

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread > 0) markAllRead();
        }}
        className="relative rounded-full p-2 hover:bg-slate-100"
      >
        <Bell className="h-5 w-5 text-slate-600" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft">
          <p className="px-2 py-1.5 text-sm font-semibold text-slate-900">Notifications</p>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-3">
                <EmptyState title="No notifications yet" />
              </div>
            ) : (
              items.map((n) => (
                <div key={n.id} className="rounded-xl px-2 py-2 hover:bg-slate-50">
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-500">{n.message}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(n.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
