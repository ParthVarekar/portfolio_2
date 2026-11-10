"use client";

import { useEffect, useState } from "react";

function formatTime() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function Clock() {
  const [time, setTime] = useState<string>("--:--");

  useEffect(() => {
    setTime(formatTime());
    const timer = window.setInterval(() => setTime(formatTime()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className="story-clock" suppressHydrationWarning>
      {time} <span style={{ fontSize: "0.55em", letterSpacing: "0.08em" }}>IST</span>
    </span>
  );
}
