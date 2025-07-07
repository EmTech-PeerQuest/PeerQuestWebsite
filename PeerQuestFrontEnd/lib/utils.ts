import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatTimeRemaining = (deadline: Date) => {
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()

  if (diff <= 0) return "Expired"

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`
  return "Less than 1 hour"
}

export const calculateLevel = (xp: number) => {
  return Math.floor(xp / 100) + 1
}

export const getXpForNextLevel = (xp: number) => {
  const currentLevel = calculateLevel(xp)
  return currentLevel * 100
}

export const getXpProgress = (xp: number) => {
  const currentLevelXp = (calculateLevel(xp) - 1) * 100
  const nextLevelXp = calculateLevel(xp) * 100
  return ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
}

export const getDifficultyClass = (difficulty: string) => {
  switch (difficulty) {
    case "initiate":
      return "badge-easy"  // Keep same styling for now
    case "adventurer":
      return "badge-medium"  // Keep same styling for now
    case "champion":
      return "badge-hard"  // Keep same styling for now
    case "mythic":
      return "badge-purple"
    default:
      return "badge-purple"
  }
}
