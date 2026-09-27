import {
  ArrowLeftRight,
  Baby,
  BookOpen,
  BriefcaseBusiness,
  Car,
  Clapperboard,
  Coffee,
  Dumbbell,
  Fuel,
  Gift,
  GraduationCap,
  HeartPulse,
  HeartHandshake,
  House,
  Landmark,
  Lightbulb,
  MoreHorizontal,
  Package,
  PawPrint,
  PiggyBank,
  Plane,
  Receipt,
  RotateCcw,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Smartphone,
  TrainFront,
  Utensils,
  Wallet,
} from "lucide-react";

export const debitCategories = [
  { name: "Food", icon: Utensils },
  { name: "Entertainment", icon: Clapperboard },
  { name: "Petrol", icon: Fuel },
  { name: "Transport", icon: Car },
  { name: "Lifestyle", icon: ShoppingBag },
  { name: "Health", icon: HeartPulse },
  { name: "Shopping", icon: ShoppingCart },
  { name: "Grocery", icon: ShoppingBasket },
  { name: "Bills", icon: Receipt },
  { name: "Rent", icon: House },
  { name: "Bills/Rent", icon: Receipt },
  { name: "Misc", icon: Package },
  { name: "Other", icon: MoreHorizontal },
] as const;

export const creditCategories = [
  { name: "Income", icon: Wallet },
  { name: "Salary", icon: BriefcaseBusiness },
  { name: "Refund", icon: RotateCcw },
  { name: "Transfer", icon: ArrowLeftRight },
  { name: "Interest", icon: Landmark },
  { name: "Other", icon: MoreHorizontal },
] as const;

export const categories = [
  ...debitCategories,
  ...creditCategories.filter((credit) => !debitCategories.some((debit) => debit.name === credit.name)),
] as const;

export const categoryIconChoices = [
  { key: "food", label: "Food", icon: Utensils },
  { key: "entertainment", label: "Entertainment", icon: Clapperboard },
  { key: "petrol", label: "Fuel", icon: Fuel },
  { key: "transport", label: "Car", icon: Car },
  { key: "lifestyle", label: "Bag", icon: ShoppingBag },
  { key: "health", label: "Health", icon: HeartPulse },
  { key: "shopping", label: "Cart", icon: ShoppingCart },
  { key: "grocery", label: "Basket", icon: ShoppingBasket },
  { key: "bills", label: "Receipt", icon: Receipt },
  { key: "rent", label: "Home", icon: House },
  { key: "misc", label: "Package", icon: Package },
  { key: "other", label: "More", icon: MoreHorizontal },
  { key: "income", label: "Wallet", icon: Wallet },
  { key: "salary", label: "Work", icon: BriefcaseBusiness },
  { key: "refund", label: "Refund", icon: RotateCcw },
  { key: "transfer", label: "Transfer", icon: ArrowLeftRight },
  { key: "interest", label: "Bank", icon: Landmark },
  { key: "coffee", label: "Coffee", icon: Coffee },
  { key: "travel", label: "Travel", icon: Plane },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "gift", label: "Gift", icon: Gift },
  { key: "pets", label: "Pets", icon: PawPrint },
  { key: "fitness", label: "Fitness", icon: Dumbbell },
  { key: "utilities", label: "Utilities", icon: Lightbulb },
  { key: "phone", label: "Phone", icon: Smartphone },
  { key: "savings", label: "Savings", icon: PiggyBank },
  { key: "charity", label: "Charity", icon: HeartHandshake },
  { key: "baby", label: "Baby", icon: Baby },
  { key: "train", label: "Train", icon: TrainFront },
  { key: "books", label: "Books", icon: BookOpen },
] as const;

const iconByKey = new Map<string, (typeof categoryIconChoices)[number]["icon"]>(categoryIconChoices.map((item) => [item.key, item.icon]));

export function categoryIcon(category: string | null, iconKey?: string | null) {
  const key = iconKey ?? category?.toLowerCase();
  return (key ? iconByKey.get(key) : undefined)
    ?? categories.find((item) => item.name === category)?.icon
    ?? MoreHorizontal;
}
