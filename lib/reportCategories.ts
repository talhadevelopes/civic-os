export const REPORT_CATEGORIES = [
  { value: "POTHOLES", label: "Potholes" },
  { value: "GARBAGE", label: "Garbage" },
  { value: "WATER_LEAKAGE", label: "Water Leakage" },
  { value: "DRAINAGE_SEWAGE", label: "Drainage / Sewage" },
  { value: "STREETLIGHT", label: "Streetlight" },
  { value: "ROAD_DAMAGE", label: "Road Damage" },
  { value: "ILLEGAL_DUMPING", label: "Illegal Dumping" },
  { value: "STRAY_ANIMALS", label: "Stray Animals" },
  { value: "TRAFFIC_SIGNAL", label: "Traffic / Signal" },
  { value: "ENCROACHMENT", label: "Encroachment" },
  { value: "OTHER", label: "Other" },
] as const;

export type ReportCategoryValue = (typeof REPORT_CATEGORIES)[number]["value"];
