/** H2H カードの得点直上に出す延長表記（未延長なら null） */
export function h2hOvertimeDisplayLabel(
  wentToOvertime?: boolean,
  overtimePeriods?: number
): string | null {
  if (!wentToOvertime) return null;
  if (overtimePeriods === 2) return "2OT";
  if (overtimePeriods === 3) return "3OT";
  return "OT";
}
