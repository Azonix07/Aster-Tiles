export type TileCategory = "stone" | "wood" | "metro" | "pattern";

export interface Tile {
  id: string;
  name: string;
  /** physical size of one tile in mm */
  widthMm: number;
  heightMm: number;
  finish: string;
  material: string;
  category: TileCategory;
  /** photographic texture of a single tile face */
  texture: string;
  /** suggested grout colour that flatters this tile */
  defaultGrout: string;
  pricePerSqm: number;
  /** discount percentage (0–100); 0 means no discount */
  discountPercent: number;
  bestFor: string[];
  description: string;
}

export const tiles: Tile[] = [
  {
    id: "venus-bianco",
    name: "Venus Bianco",
    widthMm: 600,
    heightMm: 600,
    finish: "Matt Carving",
    material: "Porcelain",
    category: "stone",
    texture: "/media/tiles/venus-bianco.jpg",
    defaultGrout: "#d8d4cf",
    pricePerSqm: 34,
    discountPercent: 0,
    bestFor: ["Living rooms", "Hallways", "Kitchens"],
    description:
      "A soft white marble-effect porcelain with warm grey veining that brightens any room without feeling clinical.",
  },
  {
    id: "sigma-statuario",
    name: "Sigma Statuario",
    widthMm: 800,
    heightMm: 1600,
    finish: "Matt Carving",
    material: "Porcelain",
    category: "stone",
    texture: "/media/tiles/sigma-statuario.jpg",
    defaultGrout: "#e2e0dd",
    pricePerSqm: 58,
    discountPercent: 0,
    bestFor: ["Feature walls", "Bathrooms", "Open plan"],
    description:
      "Large-format statuario with bold diagonal veining — a statement slab look at a fraction of natural marble cost.",
  },
  {
    id: "torano-gold",
    name: "Torano Gold",
    widthMm: 800,
    heightMm: 1600,
    finish: "Polished",
    material: "Porcelain",
    category: "stone",
    texture: "/media/tiles/torano-gold.jpg",
    defaultGrout: "#ded6c2",
    pricePerSqm: 62,
    discountPercent: 0,
    bestFor: ["Feature walls", "Bathrooms", "Hotels"],
    description:
      "Dramatic flowing gold and grey veining on a polished white body. Our most luxurious large-format tile.",
  },
  {
    id: "laurent-black",
    name: "Laurent Black",
    widthMm: 600,
    heightMm: 600,
    finish: "Polished",
    material: "Porcelain",
    category: "stone",
    texture: "/media/tiles/laurent-black.jpg",
    defaultGrout: "#2a2a2e",
    pricePerSqm: 48,
    discountPercent: 0,
    bestFor: ["Bathrooms", "Feature walls", "Bars"],
    description:
      "Deep black marble-effect with fine gold veins — moody, glamorous and unforgettable under warm light.",
  },
  {
    id: "rock-concrete",
    name: "Rock Concrete",
    widthMm: 600,
    heightMm: 600,
    finish: "Matt",
    material: "Porcelain",
    category: "stone",
    texture: "/media/tiles/rock-concrete.jpg",
    defaultGrout: "#9a9a98",
    pricePerSqm: 29,
    discountPercent: 0,
    bestFor: ["Kitchens", "Utility rooms", "Commercial"],
    description:
      "An honest, industrial concrete look that hides everyday life and pairs beautifully with timber and steel.",
  },
  {
    id: "terracotta",
    name: "Terracotta",
    widthMm: 300,
    heightMm: 300,
    finish: "Matt",
    material: "Ceramic",
    category: "stone",
    texture: "/media/tiles/terracotta.jpg",
    defaultGrout: "#b58a6a",
    pricePerSqm: 26,
    discountPercent: 0,
    bestFor: ["Kitchens", "Sunrooms", "Cottages"],
    description:
      "Warm handmade-look clay with natural tonal variation — timeless in Irish cottages and modern farmhouses alike.",
  },
  {
    id: "heritage-oak",
    name: "Heritage Oak",
    widthMm: 200,
    heightMm: 1200,
    finish: "Matt",
    material: "LVT",
    category: "wood",
    texture: "/media/tiles/heritage-oak.jpg",
    defaultGrout: "#c0a582",
    pricePerSqm: 32,
    discountPercent: 0,
    bestFor: ["Living rooms", "Bedrooms", "Hallways"],
    description:
      "Honey-toned oak planks with authentic grain and knots. All the warmth of timber, none of the upkeep.",
  },
  {
    id: "dark-walnut",
    name: "Dark Walnut",
    widthMm: 200,
    heightMm: 1200,
    finish: "Matt",
    material: "LVT",
    category: "wood",
    texture: "/media/tiles/dark-walnut.jpg",
    defaultGrout: "#4a3728",
    pricePerSqm: 34,
    discountPercent: 0,
    bestFor: ["Bedrooms", "Studies", "Snugs"],
    description:
      "Rich chocolate walnut planks that ground a room — stunning with cream rugs and brass lamplight.",
  },
  {
    id: "subway-white",
    name: "Subway White",
    widthMm: 75,
    heightMm: 150,
    finish: "Gloss",
    material: "Ceramic",
    category: "metro",
    texture: "/media/tiles/subway-white.jpg",
    defaultGrout: "#c8c8c8",
    pricePerSqm: 22,
    discountPercent: 0,
    bestFor: ["Splashbacks", "Bathrooms", "Utility"],
    description:
      "The classic bevelled metro in warm gloss white. Brick-bond it behind a range cooker and it never dates.",
  },
  {
    id: "metro-grey",
    name: "Metro Grey",
    widthMm: 75,
    heightMm: 150,
    finish: "Matt",
    material: "Ceramic",
    category: "metro",
    texture: "/media/tiles/metro-grey.jpg",
    defaultGrout: "#8f8f8f",
    pricePerSqm: 22,
    discountPercent: 0,
    bestFor: ["Splashbacks", "Shower walls", "WCs"],
    description:
      "A soft matt grey metro that swaps classic sparkle for calm, contemporary texture.",
  },
  {
    id: "hex-carrara",
    name: "Hex Carrara",
    widthMm: 200,
    heightMm: 200,
    finish: "Matt",
    material: "Porcelain",
    category: "pattern",
    texture: "/media/tiles/hex-carrara.jpg",
    defaultGrout: "#dcdcdc",
    pricePerSqm: 44,
    discountPercent: 0,
    bestFor: ["Shower floors", "Bathrooms", "Porches"],
    description:
      "Carrara marble hexagon mosaic — grippy underfoot, gorgeous from above. A shower-floor favourite.",
  },
  {
    id: "moroccan-star",
    name: "Moroccan Star",
    widthMm: 200,
    heightMm: 200,
    finish: "Matt",
    material: "Ceramic",
    category: "pattern",
    texture: "/media/tiles/moroccan-star.jpg",
    defaultGrout: "#20365a",
    pricePerSqm: 38,
    discountPercent: 0,
    bestFor: ["Splashbacks", "Porches", "Fireplaces"],
    description:
      "Navy and white star-and-cross encaustic pattern — one wall of this and the room designs itself.",
  },
];

export const tileCategories: { key: TileCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "stone", label: "Stone & Marble" },
  { key: "wood", label: "Wood Effect" },
  { key: "metro", label: "Metro" },
  { key: "pattern", label: "Pattern" },
];

export const collections = [
  {
    id: "floor-tiles",
    name: "Floor Tiles",
    blurb: "Porcelain · Large Format · Marble Effect",
    image: "/media/categories/floor-tiles.jpg",
    description:
      "Large-format porcelain floors that flow from hallway to kitchen — polished, matt and anti-slip finishes.",
  },
  {
    id: "wall-tiles",
    name: "Wall Tiles",
    blurb: "Feature Walls · Marble · Décor",
    image: "/media/categories/wall-tiles.jpg",
    description:
      "Statement feature walls in statuario, torano gold and textured décor panels.",
  },
  {
    id: "bathrooms",
    name: "Bathrooms",
    blurb: "Suites · Wet Rooms · Vanities",
    image: "/media/categories/bathrooms.jpg",
    description:
      "Complete bathroom design — from zellige walls and terrazzo floors to vanity units and fluted glass.",
  },
  {
    id: "wooden-floors",
    name: "Wooden Floors",
    blurb: "Laminates · Luxury Vinyl · Herringbone",
    image: "/media/categories/wooden-floors.jpg",
    description:
      "Herringbone, wide plank and classic straight-lay in oak, walnut and painted tones.",
  },
  {
    id: "outdoor",
    name: "Outdoor",
    blurb: "Patios · Porcelain · Anti-Slip",
    image: "/media/categories/outdoor.jpg",
    description:
      "20mm anti-slip outdoor porcelain that shrugs off Irish weather — patios, paths and steps.",
  },
  {
    id: "kitchen",
    name: "Kitchen",
    blurb: "Splashbacks · Counters · Floors",
    image: "/media/categories/kitchen.jpg",
    description:
      "Splashbacks and floors that stand up to the busiest room in the house.",
  },
] as const;

export const gallery = [
  {
    id: "open-plan-marble",
    image: "/media/gallery/open-plan-marble.jpg",
    tag: "Porcelain Floor",
    span: "wide" as const,
  },
  {
    id: "black-marble-bath",
    image: "/media/gallery/black-marble-bath.jpg",
    tag: "Black Marble Bathroom",
    span: "tall" as const,
  },
  {
    id: "moroccan-kitchen",
    image: "/media/gallery/moroccan-kitchen.jpg",
    tag: "Patterned Splashback",
    span: "tall" as const,
  },
  {
    id: "hex-shower",
    image: "/media/gallery/hex-shower.jpg",
    tag: "Hex Mosaic Shower",
    span: "tall" as const,
  },
  {
    id: "walnut-bedroom",
    image: "/media/gallery/walnut-bedroom.jpg",
    tag: "Walnut Bedroom",
    span: "wide" as const,
  },
  {
    id: "outdoor-kitchen",
    image: "/media/gallery/outdoor-kitchen.jpg",
    tag: "Outdoor Living",
    span: "std" as const,
  },
] as const;
