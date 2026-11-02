const paths: Record<string, string> = {
  home: "M3 10 12 3l9 7M5 9v12h14V9M10 21v-8h4v8",
  plan: "M3 3h18v18H3zM8 3v18M8 9h13M14 9v12M3 15h5",
  plant: "M12 21V11M12 15C3 15 3 8 3 6c7 0 9 4 9 9ZM12 11c0-6 5-8 9-8 0 6-3 10-9 10",
  structure: "m3 8 9-5 9 5v10l-9 4-9-4ZM3 8l9 5 9-5M12 13v9",
  shape: "M3 12h9v9H3zM17 3l5 8H12ZM6 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
  note: "M5 4h14M12 4v17M8 21h8",
  select: "m5 3 14 10-7 1-4 7Z",
  row: "M4 5h2M11 5h2M18 5h2M4 12h2M11 12h2M18 12h2M4 19h2M11 19h2M18 19h2",
  bed: "M3 5h18v14H3zM6 8h12v8H6z",
  path: "M3 8h18M3 16h18M6 12h3M15 12h3",
  trellis: "M6 3v18M18 3v18M3 7h18M3 14h18",
  tree: "M12 21v-7M8 17h8M7 14a5 5 0 0 1-2-9 7 7 0 0 1 14 0 5 5 0 0 1-2 9Z",
  journal: "M5 3h14v18H5zM8 7h8M8 11h8M8 15h5",
  menu: "M4 6h16M4 12h16M4 18h16",
};

export function PlannerIcon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] ?? paths.plan} /></svg>;
}
