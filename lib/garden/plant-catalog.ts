export type PlantType = "Vegetable" | "Fruit" | "Herb" | "Flower" | "Native";

export type PlantOption = {
  name: string;
  icon: string;
  spacingCm: number;
  spacing: string;
  type: PlantType;
  varieties: string[];
};

export const plants: PlantOption[] = [
  { name: "Tomato", icon: "🍅", spacingCm: 50, spacing: "45–60 cm", type: "Vegetable", varieties: ["Roma", "Black Krim", "Moneymaker", "Beefsteak"] },
  { name: "Strawberry", icon: "🍓", spacingCm: 35, spacing: "30–40 cm", type: "Fruit", varieties: ["Camarosa", "Albion", "Monterey", "Unknown crown"] },
  { name: "Bean", icon: "🫘", spacingCm: 18, spacing: "15–20 cm", type: "Vegetable", varieties: ["King Purple", "Superstar", "Scarlet Runner", "Climbing bean"] },
  { name: "Lettuce", icon: "🥬", spacingCm: 28, spacing: "25–30 cm", type: "Vegetable", varieties: ["Butterhead", "Cos", "Loose leaf", "Iceberg"] },
  { name: "Pumpkin", icon: "🎃", spacingCm: 105, spacing: "90–120 cm", type: "Vegetable", varieties: ["Crown", "Butternut", "Gem squash", "Kabocha"] },
  { name: "Carrot", icon: "🥕", spacingCm: 7, spacing: "5–8 cm", type: "Vegetable", varieties: ["Nantes", "Chantenay", "Amsterdam", "Rainbow"] },
  { name: "Broccoli", icon: "🥦", spacingCm: 50, spacing: "45–60 cm", type: "Vegetable", varieties: ["Winter Rudolph", "Green Dragon", "Calabrese"] },
  { name: "Raspberry", icon: "🔴", spacingCm: 50, spacing: "45–60 cm", type: "Fruit", varieties: ["Heritage", "Aspiring", "Waiau", "Unknown cane"] },
  { name: "Blueberry", icon: "🫐", spacingCm: 120, spacing: "1–1.5 m", type: "Fruit", varieties: ["Southern Highbush", "Rabbiteye", "Unknown"] },
  { name: "Herbs", icon: "🌿", spacingCm: 25, spacing: "20–30 cm", type: "Herb", varieties: ["Basil", "Chives", "Thyme", "Parsley"] },
  { name: "Achillea", icon: "🌼", spacingCm: 40, spacing: "35–45 cm", type: "Flower", varieties: ["Achillea"] },
  { name: "Agastache", icon: "💜", spacingCm: 40, spacing: "35–45 cm", type: "Flower", varieties: ["Agastache"] },
  { name: "Ageratum", icon: "🌸", spacingCm: 25, spacing: "20–30 cm", type: "Flower", varieties: ["Ageratum"] },
  { name: "Agrostemma", icon: "🌸", spacingCm: 30, spacing: "25–35 cm", type: "Flower", varieties: ["Agrostemma"] },
  { name: "Akeake", icon: "🌿", spacingCm: 100, spacing: "80–120 cm", type: "Native", varieties: ["Akeake"] },
  { name: "Alyssum", icon: "🌼", spacingCm: 20, spacing: "15–25 cm", type: "Flower", varieties: ["Alyssum"] },
  { name: "Amaranth", icon: "🌿", spacingCm: 30, spacing: "25–35 cm", type: "Vegetable", varieties: ["Garnet Red", "Green Red"] },
  { name: "Angelica", icon: "🌿", spacingCm: 60, spacing: "50–70 cm", type: "Herb", varieties: ["Chinese", "Holy Ghost"] },
  { name: "Anise", icon: "🌿", spacingCm: 25, spacing: "20–30 cm", type: "Herb", varieties: ["Anise"] },
  { name: "Anise Hyssop", icon: "💜", spacingCm: 35, spacing: "30–40 cm", type: "Herb", varieties: ["Anise Hyssop"] },
  { name: "Artichoke", icon: "🌱", spacingCm: 100, spacing: "90–120 cm", type: "Vegetable", varieties: ["Green Globe"] },
  { name: "Asparagus", icon: "🌱", spacingCm: 40, spacing: "35–45 cm", type: "Vegetable", varieties: ["Mary Washington", "Pacific Challenger F1", "Pacific Purple"] },
  { name: "Asparagus Pea", icon: "🌱", spacingCm: 20, spacing: "15–25 cm", type: "Vegetable", varieties: ["Asparagus Pea"] },
  { name: "Aster", icon: "🌸", spacingCm: 30, spacing: "25–35 cm", type: "Flower", varieties: ["Aster"] },
  { name: "Astragalus", icon: "🌼", spacingCm: 30, spacing: "25–35 cm", type: "Herb", varieties: ["Astragalus"] },
  { name: "Basil", icon: "🌿", spacingCm: 20, spacing: "15–25 cm", type: "Herb", varieties: ["Compact"] },
];

