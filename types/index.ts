export type Lang = 'es' | 'en'
export type LocalizedString = { es: string; en: string }
export type SeoMeta = {
  title: LocalizedString
  description: LocalizedString
  keywords: string[]
}
export type SocialLinks = {
  instagram?: string
  facebook?: string
  telegram?: string
  twitter?: string
  whatsapp?: string
  tiktok?: string
  youtube?: string
  linkedin?: string
}

// ─── Schedule ────────────────────────────────────────────────────────────────
export type DaySchedule = { closed: boolean; h24: boolean; open: string; close: string }
export const WEEKDAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const
export type Weekday = typeof WEEKDAYS[number]
export type StructuredSchedule = { alwaysOpen: boolean; days: Record<Weekday, DaySchedule> }
export const DEFAULT_DAY_SCHEDULE: DaySchedule = { closed: false, h24: false, open: '09:00', close: '22:00' }
export function makeDefaultSchedule(): StructuredSchedule {
  return {
    alwaysOpen: false,
    days: {
      monday:    { ...DEFAULT_DAY_SCHEDULE },
      tuesday:   { ...DEFAULT_DAY_SCHEDULE },
      wednesday: { ...DEFAULT_DAY_SCHEDULE },
      thursday:  { ...DEFAULT_DAY_SCHEDULE },
      friday:    { ...DEFAULT_DAY_SCHEDULE },
      saturday:  { ...DEFAULT_DAY_SCHEDULE, open:'10:00', close:'23:00' },
      sunday:    { ...DEFAULT_DAY_SCHEDULE, open:'10:00', close:'20:00' },
    }
  }
}

// ─── Palette ─────────────────────────────────────────────────────────────────
export type PaletteTier = 'standard' | 'sponsored' | 'premium'
export type BusinessPalette = {
  name?: string
  tier?: PaletteTier       // 'standard' | 'sponsored' | 'premium'
  animated?: boolean       // animated themes (premium only)
  animationKey?: string    // e.g. 'gamer' | 'aurora' | 'neon-pulse' | 'cyber' | 'rainbow'
  accent: string; accentText: string; accentSoft: string
  bg: string; surface: string; surface2: string
  border: string; text: string; textMuted: string; priceColor: string
}
export const DEFAULT_PALETTE: BusinessPalette = {
  name: 'Amber Night',
  accent:'#f97316', accentText:'#ffffff', accentSoft:'#fff7ed',
  bg:'#0f0f0f', surface:'#1a1a1a', surface2:'#242424',
  border:'#2e2e2e', text:'#f0ece4', textMuted:'#888888', priceColor:'#fbbf24',
}

// ─── Config ──────────────────────────────────────────────────────────────────
export type DeveloperConfig = {
  name?: string
  email?: string
  phone?: string
  whatsapp?: string
  telegram?: string
  website?: string
}
export type MarqueeConfigItem = {
  slug: string
  promoType: PromoType
  active?: boolean
  label?: LocalizedString
}

export type AppConfig = {
  homePalette?: BusinessPalette
  customPalettes?: { name: string; palette: BusinessPalette }[]
  developer?: DeveloperConfig
  marqueeItems?: MarqueeConfigItem[]
  defaultProductEmoji?: string      // e.g. '🛍️' — shown when product has no image
  defaultProductImage?: string      // URL — shown when product has no image
}

// ─── Business ────────────────────────────────────────────────────────────────
export type BusinessStatus = 'open' | 'closed' | 'unavailable'

export type Business = {
  id: number
  slug: string           // REQUIRED
  name: LocalizedString  // REQUIRED
  description?: LocalizedString
  slogan?: LocalizedString
  logo?: string
  image?: string
  coverImages?: string[]
  hidden?: boolean
  sponsored?: boolean
  premium?: boolean
  unavailable?: boolean
  categories?: string[]
  category?: string
  seo?: SeoMeta
  created_at?: string             // ISO timestamp when registered
  // Business owner auth
  ownerPasswordHash?: string
  ownerCode?: string
}

// ─── Promo codes (Premium) ───────────────────────────────────────────────────
export type PromoCode = {
  id: string             // e.g. "PROMO10"
  discount: number       // e.g. 10 for 10%
  type: 'percent' | 'fixed'
  active: boolean
  expiresAt?: string     // ISO date string
}

// ─── Reports ────────────────────────────────────────────────────────────────
export type BusinessReport = {
  id: string
  slug: string
  name: string
  email: string
  reason: string
  description: string
  created_at: string
  reviewed?: boolean
}
export type BusinessesData = { businesses: Business[] }

// ─── Payment method with optional modifier ──────────────────────────────────
export type PaymentMethodDetail = {
  id: string
  label?: string
  modifier?: number
  modifierType?: 'percent' | 'fixed'
  note?: string
}

export type BusinessDetail = {
  slug: string
  province?: string
  municipality?: string
  address?: LocalizedString
  addresses?: LocalizedString[]
  phone?: string
  cardNumber?: string
  paymentMethods?: string[]
  paymentMethodDetails?: PaymentMethodDetail[]
  donationsEnabled?: boolean
  website?: string
  socialLinks?: SocialLinks
  schedule?: StructuredSchedule
  currency?: string
  palette?: BusinessPalette
  seo?: SeoMeta
  promoCodes?: PromoCode[]
  clientInstructions?: LocalizedString
  businessCategories?: string[]
  businessTags?: string[]
}

// ─── Promotions ──────────────────────────────────────────────────────────────
export type PromoType = 'standard' | 'sale' | 'new' | 'special' | 'limited'
export type PromoItem = {
  slug: string           // business slug
  productId?: number     // if promoting a specific product (null = whole business)
  promoType: PromoType
  label?: LocalizedString // custom label override
  active: boolean
}

// ─── Product ─────────────────────────────────────────────────────────────────
export type ProductTag = { label: LocalizedString; color: string; textColor: string }
export type Product = {
  id: number
  name: LocalizedString
  description: LocalizedString
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  imageKeywords: string[]
  category: LocalizedString
  featured: boolean
  hidden: boolean
  tags?: ProductTag[]
  position?: number
  available?: boolean
  promote?: PromoType | 'NO'    // 'NO' | 'standard' | 'sale' | 'new' | 'special' | 'limited'
  seo: SeoMeta
}
export type ProductsData = { products: Product[] }
export type ProductIndexes = {
  productsById: Map<number, Product>
  productsByCategory: Map<string, Product[]>
  featuredProducts: Product[]
  allCategories: string[]
}
export type CartItem = { productId: number; quantity: number; note?: string }
export type Cart = { [slug: string]: CartItem[] }
export type AdminState = {
  businesses: Business[]
  details: Record<string, BusinessDetail>
  products: Record<string, Product[]>
}
