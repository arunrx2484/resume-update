export function todayTokens(): string[] {
  const now = new Date();
  const localeFormats = [
    new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(now),
    new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(now),
    new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(now),
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(now)
  ];

  const day = now.getDate();
  const year = now.getFullYear();
  const monthLong = now.toLocaleString("en-US", { month: "long" });
  const monthShort = now.toLocaleString("en-US", { month: "short" });

  return [
    ...localeFormats,
    "Today",
    `${day} ${monthShort} ${year}`,
    `${day} ${monthLong} ${year}`,
    `${monthShort} ${day}, ${year}`,
    `${day}/${String(now.getMonth() + 1).padStart(2, "0")}/${year}`
  ];
}

export function textContainsToday(text: string): boolean {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  return todayTokens().some((token) => normalized.includes(token.toLowerCase()));
}
