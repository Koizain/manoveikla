export interface GPMDeadline {
  month: number;
  day: number;
  label: string;
}

export const GPM_DEADLINES: GPMDeadline[] = [
  { month: 2, day: 15, label: "Kovo 15" },
  { month: 5, day: 15, label: "Birželio 15" },
  { month: 8, day: 15, label: "Rugsėjo 15" },
  { month: 11, day: 15, label: "Gruodžio 15" },
];

