import type { LevelThreshold } from "./types"

export const levelThresholds: LevelThreshold[] = [
  { level: 1, xpRequired: 0, title: "Novice Adventurer" },
  { level: 2, xpRequired: 100, title: "Apprentice Adventurer" },
  { level: 3, xpRequired: 250, title: "Journeyman Adventurer" },
  { level: 4, xpRequired: 500, title: "Adept Adventurer" },
  { level: 5, xpRequired: 1000, title: "Expert Adventurer" },
  { level: 6, xpRequired: 1750, title: "Master Adventurer" },
  { level: 7, xpRequired: 2750, title: "Grandmaster Adventurer" },
  { level: 8, xpRequired: 4000, title: "Legendary Adventurer" },
  { level: 9, xpRequired: 5500, title: "Mythic Adventurer" },
  { level: 10, xpRequired: 7500, title: "Divine Adventurer" },
]

export const calculateLevel = (xp: number): number => {
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (xp >= levelThresholds[i].xpRequired) {
      return levelThresholds[i].level
    }
  }
  return 1
}

export const getXpForNextLevel = (xp: number): number => {
  const currentLevel = calculateLevel(xp)
  const nextLevelIndex = levelThresholds.findIndex((threshold) => threshold.level === currentLevel + 1)

  if (nextLevelIndex === -1) {
    // Max level reached
    return levelThresholds[levelThresholds.length - 1].xpRequired
  }

  return levelThresholds[nextLevelIndex].xpRequired
}

export const getXpProgress = (xp: number): number => {
  const currentLevel = calculateLevel(xp)
  const currentLevelIndex = levelThresholds.findIndex((threshold) => threshold.level === currentLevel)
  const nextLevelIndex = levelThresholds.findIndex((threshold) => threshold.level === currentLevel + 1)

  if (nextLevelIndex === -1) {
    // Max level reached
    return 100
  }

  const currentLevelXp = levelThresholds[currentLevelIndex].xpRequired
  const nextLevelXp = levelThresholds[nextLevelIndex].xpRequired
  const xpForCurrentLevel = xp - currentLevelXp
  const xpRequiredForNextLevel = nextLevelXp - currentLevelXp

  return Math.min(100, Math.floor((xpForCurrentLevel / xpRequiredForNextLevel) * 100))
}

export const getLevelTitle = (level: number): string => {
  const levelData = levelThresholds.find((threshold) => threshold.level === level)
  return levelData ? levelData.title : "Adventurer"
}

export const getTotalXpRequired = (level: number): number => {
  const levelData = levelThresholds.find((threshold) => threshold.level === level)
  return levelData ? levelData.xpRequired : 0
}
