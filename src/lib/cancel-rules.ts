export const todayInYangon = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(now);

export const canCancelRequest = (status: string, eventStartDate: string, today: string) =>
  (status === "Pending" || status === "Approved") && eventStartDate >= today;
