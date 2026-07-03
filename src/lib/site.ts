export const site = {
  name: "Aster Tiles",
  tagline: "Tiles · Wooden Floors · Bathrooms",
  description:
    "Aster Tiles – Premium Tiles, Wooden Floors & Bathrooms in Lifford, Co. Donegal, Ireland. Visit our showroom or explore online.",
  phone: "+353 89 428 8016",
  phoneHref: "tel:+353894288016",
  email: "astertiles.ie@gmail.com",
  emailHref: "mailto:astertiles.ie@gmail.com",
  address: {
    line1: "The Haw, Lifford",
    line2: "Co. Donegal, F93 X522",
    mapsUrl: "https://maps.google.com/?q=The+Haw,+Lifford,+Co.+Donegal,+F93+X522",
  },
  hours: [
    { days: "Monday – Friday", time: "9:00 – 18:00" },
    { days: "Saturday", time: "10:00 – 17:00" },
    { days: "Sunday", time: "Closed" },
  ],
  stats: [
    { value: 500, suffix: "+", label: "Tile Collections" },
    { value: 15, suffix: "+", label: "Years Experience" },
    { value: 5000, suffix: "+", label: "Happy Customers" },
  ],
  nav: [
    { href: "/", label: "Home" },
    { href: "/collections", label: "Collections" },
    { href: "/visualizer", label: "Room Visualizer" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

export const staff = [
  {
    id: "maire",
    name: "Máire Doherty",
    role: "Showroom Manager",
    bio: "Máire has led the Lifford showroom for over a decade and can match a tile to a home from a single photograph.",
    photo: "/media/staff/maire.jpg",
  },
  {
    id: "sean",
    name: "Seán Gallagher",
    role: "Flooring Specialist",
    bio: "Thirty years of floors — laminate, herringbone and luxury vinyl. Seán knows what lasts in an Irish hallway.",
    photo: "/media/staff/sean.jpg",
  },
  {
    id: "ciaran",
    name: "Ciarán Byrne",
    role: "Tile Consultant",
    bio: "Ciarán runs our sample library and the visualiser desk — bring your room photo and he'll do the rest.",
    photo: "/media/staff/ciaran.jpg",
  },
  {
    id: "aoife",
    name: "Aoife McLaughlin",
    role: "Bathroom Designer",
    bio: "From vanity units to walk-in showers, Aoife designs complete bathrooms around the tiles you love.",
    photo: "/media/staff/aoife.jpg",
  },
] as const;

export const testimonials = [
  {
    quote:
      "Absolutely stunning bathroom after fitting the Aster marble-effect tiles. The team helped us choose the perfect grout colour and the visualiser tool was brilliant!",
    name: "Siobhán Gallagher",
    location: "Letterkenny, Co. Donegal",
  },
  {
    quote:
      "We renovated our kitchen floor with 600×600 porcelain tiles from Aster. The calculator told us exactly how many to order — saved us buying too many!",
    name: "Patrick McGinley",
    location: "Ballybofey, Co. Donegal",
  },
  {
    quote:
      "Visited the showroom in Lifford — staff were incredibly helpful. They showed us samples and used the room visualiser on a photo of our hallway. Perfect result.",
    name: "Mairéad O'Brien",
    location: "Derry / Londonderry",
  },
  {
    quote:
      "Free delivery to Galway on a full pallet of outdoor porcelain. Every tile arrived perfect. Genuinely the best tile shop in the northwest.",
    name: "Tomás Ó Sé",
    location: "Galway",
  },
] as const;
