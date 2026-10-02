// Row shapes for every table, replacing Prisma's generated client types now
// that the app talks to MySQL directly via src/lib/db.ts.

export interface User {
  id: string
  email: string
  username: string
  password: string
  accountType: string
  isActive: boolean
  displayName: string | null
  jobTitle: string | null
  department: string | null
  bio: string | null
  aboutText: string | null
  avatarUrl: string | null
  phone: string | null
  whatsapp: string | null
  website: string | null
  address: string | null
  businessHours: string | null
  leadFormEnabled: boolean
  theme: string
  template: string
  bgType: string
  bgColor: string
  bgGradient: string | null
  bgImage: string | null
  buttonStyle: string
  buttonSize: string
  buttonColor: string
  buttonTextColor: string
  fontFamily: string
  textColor: string
  plan: string
  planExpiresAt: Date | null
  businessId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Card {
  id: string
  code: string
  status: string
  userId: string | null
  businessId: string | null
  assignedAt: Date | null
  createdAt: Date
}

export interface Business {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  description: string | null
  website: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  category: string | null
  businessHours: string | null
  brandColor: string
  plan: string
  planExpiresAt: Date | null
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export interface Link {
  id: string
  title: string
  url: string
  thumbnail: string | null
  iconName: string | null
  description: string | null
  isActive: boolean
  position: number
  clicks: number
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface SocialLink {
  id: string
  platform: string
  url: string
  position: number
  userId: string
}

export interface Service {
  id: string
  userId: string
  name: string
  description: string | null
  price: string | null
  ctaType: string
  position: number
  createdAt: Date
}

export interface PortfolioItem {
  id: string
  userId: string
  title: string
  description: string | null
  imageUrl: string | null
  videoUrl: string | null
  type: string
  position: number
}

export interface Testimonial {
  id: string
  userId: string
  authorName: string
  content: string
  rating: number
  position: number
}

export interface StoreProduct {
  id: string
  userId: string
  name: string
  description: string | null
  imageUrl: string | null
  price: number
  discountPrice: number | null
  category: string | null
  variants: string | null
  availability: string
  position: number
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  slug: string
  subtitle: string | null
  category: string
  sku: string | null
  stock: number
  description: string | null
  images: string | null
  length: number | null
  width: number | null
  colors: string | null
  priceRegular: number
  priceSale: number | null
  productionTime: string
  availability: string
  customizationPrice: number
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  scope: string
  userId: string | null
  parentId: string | null
  position: number
  createdAt: Date
}

export interface SupportMessage {
  id: string
  userId: string
  sender: string
  body: string
  read: boolean
  createdAt: Date
}

export interface DeliveryZone {
  id: string
  name: string
  fee: number
}

export interface Order {
  id: string
  orderNumber: string
  userId: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  state: string
  city: string
  address: string
  deliveryInstructions: string | null
  deliveryFee: number
  subtotal: number
  total: number
  status: string
  paymentStatus: string
  profileSetupRequired: boolean
  courierName: string | null
  trackingNumber: string | null
  shippedAt: Date | null
  deliveredAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  color: string | null
  customization: boolean
  customizationNotes: string | null
  customizationFileUrl: string | null
  quantity: number
  unitPrice: number
}

export interface Payment {
  id: string
  orderId: string
  provider: string
  reference: string
  amount: number
  status: string
  rawResponse: string | null
  createdAt: Date
}

export interface SubscriptionPayment {
  id: string
  userId: string | null
  businessId: string | null
  plan: string
  amount: number
  reference: string
  status: string
  rawResponse: string | null
  createdAt: Date
}

export interface Lead {
  id: string
  ownerId: string
  name: string
  phone: string | null
  email: string | null
  message: string | null
  notes: string | null
  source: string
  status: string
  createdAt: Date
}

export interface AnalyticsEvent {
  id: string
  userId: string
  type: string
  meta: string | null
  createdAt: Date
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: Date
}

export interface NewsletterSubscriber {
  id: string
  email: string
  createdAt: Date
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  status: string
  createdAt: Date
}

export interface PasswordResetToken {
  id: string
  userId: string
  token: string
  expiresAt: Date
  used: boolean
  createdAt: Date
}

export interface OtpCode {
  id: string
  email: string
  code: string
  purpose: string
  attempts: number
  consumedAt: Date | null
  expiresAt: Date
  createdAt: Date
}
