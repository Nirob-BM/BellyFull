import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OpeningHourRow {
  day_of_week: number;
  day_name: string;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean | null;
}

const TIME_ZONE = "Asia/Dhaka";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Parse "11:00", "11:00:00", "11:00 AM", "11 PM" into minutes from midnight. */
export const parseTimeToMinutes = (value: string | null): number | null => {
  if (!value) return null;
  const match = value
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)?$/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const suffix = match[3];
  if (suffix === "pm" && hours < 12) hours += 12;
  if (suffix === "am" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

export const formatMinutes = (minutes: number): string => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const m = normalized % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
};

export const formatRange = (open: string | null, close: string | null): string => {
  const o = parseTimeToMinutes(open);
  const c = parseTimeToMinutes(close);
  if (o === null || c === null) return "Closed";
  return `${formatMinutes(o)} – ${formatMinutes(c)}`;
};

/** Current day index (0=Sunday) and minutes-of-day in the restaurant's timezone. */
const getLocalNow = (now: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const day = weekdayMap[get("weekday")] ?? now.getDay();
  const hour = parseInt(get("hour"), 10) % 24;
  const minute = parseInt(get("minute"), 10);
  return { day, minutes: hour * 60 + minute };
};

export interface OpeningStatus {
  hours: OpeningHourRow[];
  isLoading: boolean;
  /** True while the restaurant is currently serving. */
  isOpen: boolean;
  /** Today's display string, e.g. "11:00 AM – 11:00 PM" or "Closed". */
  todayLabel: string;
  todayIndex: number;
  /** Human text like "Opens Saturday at 11:00 AM" — null while open or unknown. */
  nextOpeningLabel: string | null;
  /** "Closing at 11:00 PM" while open. */
  closingLabel: string | null;
}

export const useOpeningStatus = (): OpeningStatus => {
  const [hours, setHours] = useState<OpeningHourRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let active = true;
    const fetchHours = async () => {
      const { data, error } = await supabase
        .from("opening_hours")
        .select("day_of_week, day_name, open_time, close_time, is_closed")
        .order("day_of_week");
      if (!active) return;
      if (error) console.error("Error fetching opening hours:", error);
      setHours((data as OpeningHourRow[]) || []);
      setIsLoading(false);
    };
    fetchHours();

    const channel = supabase
      .channel("opening-hours-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "opening_hours" },
        () => fetchHours()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Re-evaluate every 30 seconds so the status flips without a reload.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    const onVisible = () => setNow(new Date());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return useMemo(() => {
    const { day: todayIndex, minutes } = getLocalNow(now);
    const byDay = new Map<number, OpeningHourRow>();
    hours.forEach((h) => byDay.set(h.day_of_week, h));

    const windowFor = (dayIndex: number) => {
      const row = byDay.get(dayIndex);
      if (!row || row.is_closed) return null;
      const open = parseTimeToMinutes(row.open_time);
      const close = parseTimeToMinutes(row.close_time);
      if (open === null || close === null) return null;
      // Support windows that run past midnight (e.g. 6 PM – 2 AM).
      return { open, close: close <= open ? close + 1440 : close };
    };

    const today = windowFor(todayIndex);
    const yesterday = windowFor((todayIndex + 6) % 7);

    let isOpen = false;
    let closesAt: number | null = null;
    if (today && minutes >= today.open && minutes < today.close) {
      isOpen = true;
      closesAt = today.close;
    } else if (yesterday && yesterday.close > 1440 && minutes < yesterday.close - 1440) {
      // Still inside last night's late window.
      isOpen = true;
      closesAt = yesterday.close - 1440;
    }

    let nextOpeningLabel: string | null = null;
    if (!isOpen && hours.length > 0) {
      for (let offset = 0; offset < 8; offset++) {
        const dayIndex = (todayIndex + offset) % 7;
        const w = windowFor(dayIndex);
        if (!w) continue;
        if (offset === 0 && minutes >= w.open) continue;
        const label =
          offset === 0
            ? "today"
            : offset === 1
              ? "tomorrow"
              : `on ${byDay.get(dayIndex)?.day_name || DAY_NAMES[dayIndex]}`;
        nextOpeningLabel = `Opens ${label} at ${formatMinutes(w.open)}`;
        break;
      }
    }

    const todayRow = byDay.get(todayIndex);
    const todayLabel =
      !todayRow || todayRow.is_closed
        ? "Closed today"
        : formatRange(todayRow.open_time, todayRow.close_time);

    return {
      hours,
      isLoading,
      isOpen,
      todayLabel,
      todayIndex,
      nextOpeningLabel,
      closingLabel: isOpen && closesAt !== null ? `Closes at ${formatMinutes(closesAt)}` : null,
    };
  }, [hours, isLoading, now]);
};
