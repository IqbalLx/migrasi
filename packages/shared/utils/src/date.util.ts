export function toUnixInSeconds(date: Date): number {
  // milliseconds to seconds
  return date.getTime() / 1000;
}

export function addDaysToDate(startDate: Date, addedDays: number): Date {
  const startDateCopy = new Date(startDate.getTime());
  startDateCopy.setDate(startDateCopy.getDate() + addedDays);

  return startDateCopy;
}
