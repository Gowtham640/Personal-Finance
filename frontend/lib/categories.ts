import {
  Car,
  Clapperboard,
  Fuel,
  HeartPulse,
  MoreHorizontal,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Utensils,
  Wallet,
} from "lucide-react";

export const categories = [
  { name: "Food", icon: Utensils },
  { name: "Entertainment", icon: Clapperboard },
  { name: "Petrol", icon: Fuel },
  { name: "Transport", icon: Car },
  { name: "Lifestyle", icon: ShoppingBag },
  { name: "Health", icon: HeartPulse },
  { name: "Shopping", icon: ShoppingCart },
  { name: "Bills", icon: Receipt },
  { name: "Salary", icon: Wallet },
  { name: "Other", icon: MoreHorizontal },
] as const;

export function categoryIcon(category: string | null) {
  return categories.find((item) => item.name === category)?.icon ?? MoreHorizontal;
}
