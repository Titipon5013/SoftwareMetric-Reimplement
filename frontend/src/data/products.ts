export type Product = {
  id: number
  name: string
  image: string
  price: number
  promotion_price?: number
  category: string
  brand?: string
  sizes?: string[]
  colors?: string[]
  description?: string
}

export const products: Product[] = [
  {
    id: 6,
    name: "Chrome Hearts Men's Round Neck Cotton Casual",
    image: "/assets/images/product1.jpg",
    price: 149,
    promotion_price: 117,
    category: "Men",
    brand: "Chrome Hearts",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White"],
    description: "Premium cotton tee with a relaxed fit and iconic detailing.",
  },
  {
    id: 7,
    name: "Jual Drew House Mascot Blue Hoodie",
    image: "/assets/images/product2.jpg",
    price: 359,
    promotion_price: 329,
    category: "Unisex",
    brand: "Drew House",
    sizes: ["S", "M", "L"],
    colors: ["Blue"],
    description: "Signature mascot hoodie in a soft, heavyweight fleece.",
  },
  {
    id: 11,
    name: "Young Thug Sp5der Vintage Pullover Hoodie",
    image: "/assets/images/product3.jpg",
    price: 249,
    promotion_price: 220,
    category: "Unisex",
    brand: "Sp5der",
    sizes: ["M", "L", "XL"],
    colors: ["Black", "Green"],
    description: "Vintage wash hoodie with bold branding and comfy feel.",
  },
  {
    id: 12,
    name: "Stüssy Basic Logo Tee",
    image: "/assets/images/h2.jpg",
    price: 59,
    category: "Men",
    brand: "Stüssy",
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Navy"],
    description: "Everyday tee featuring classic Stüssy logo print.",
  },
  {
    id: 13,
    name: "Amiri MX1 Denim",
    image: "/assets/images/t4.jpg",
    price: 980,
    category: "Men",
    brand: "Amiri",
    sizes: ["30", "32", "34"],
    colors: ["Indigo"],
    description: "Ripped denim with signature leather paneling.",
  },
]

export function getProductById(id: number): Product | undefined {
  return products.find(p => p.id === id)
}

export function getCategories(): string[] {
  return Array.from(new Set(products.map(p => p.category)))
}

export type SortKey = "name-asc" | "name-desc" | "price-asc" | "price-desc"

export function filterAndSortProducts(opts: {
  query?: string
  category?: string
  sort?: SortKey
}): Product[] {
  let list = products.slice()
  if (opts.query) {
    const q = opts.query.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || (p.brand?.toLowerCase().includes(q)))
  }
  if (opts.category && opts.category !== "ALL") {
    list = list.filter(p => p.category === opts.category)
  }
  switch (opts.sort) {
    case "name-asc":
      list.sort((a, b) => a.name.localeCompare(b.name))
      break
    case "name-desc":
      list.sort((a, b) => b.name.localeCompare(a.name))
      break
    case "price-asc":
      list.sort((a, b) => (a.promotion_price ?? a.price) - (b.promotion_price ?? b.price))
      break
    case "price-desc":
      list.sort((a, b) => (b.promotion_price ?? b.price) - (a.promotion_price ?? a.price))
      break
  }
  return list
}
