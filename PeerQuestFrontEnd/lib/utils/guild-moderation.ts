import type { Guild } from "@/lib/types"

/**
 * Check if a guild can perform actions (not disabled)
 */
export function canGuildPerformActions(guild: Guild): boolean {
  return !guild.is_disabled
}

/**
 * Get the reason why a guild cannot perform actions
 */
export function getGuildRestrictionReason(guild: Guild): string | null {
  if (guild.is_disabled) {
    return `This guild has been disabled due to ${guild.disable_reason || 'multiple warnings'}. Contact support for assistance.`
  }
  return null
}

/**
 * Get warning status for a guild
 */
export function getGuildWarningStatus(guild: Guild): {
  hasWarnings: boolean
  warningCount: number
  isNearDisable: boolean
  message: string | null
} {
  const hasWarnings = guild.warning_count > 0
  const isNearDisable = guild.warning_count >= 2
  
  let message = null
  if (guild.is_disabled) {
    message = "This guild is currently disabled and cannot perform any actions."
  } else if (isNearDisable) {
    message = "Warning: This guild is one warning away from being disabled!"
  } else if (hasWarnings) {
    message = `This guild has ${guild.warning_count} active warning${guild.warning_count > 1 ? 's' : ''}.`
  }
  
  return {
    hasWarnings,
    warningCount: guild.warning_count,
    isNearDisable,
    message
  }
}

/**
 * Check if a guild can apply for quests
 */
export function canGuildApplyForQuests(guild: Guild): {
  canApply: boolean
  reason?: string
} {
  if (guild.is_disabled) {
    return {
      canApply: false,
      reason: "Guild is disabled and cannot apply for quests"
    }
  }
  
  return { canApply: true }
}

/**
 * Check if a guild can receive payouts
 */
export function canGuildReceivePayouts(guild: Guild): {
  canReceive: boolean
  reason?: string
} {
  if (guild.is_disabled) {
    return {
      canReceive: false,
      reason: "Guild is disabled and cannot receive payouts"
    }
  }
  
  return { canReceive: true }
}

/**
 * Check if a guild can post new quests
 */
export function canGuildPostQuests(guild: Guild): {
  canPost: boolean
  reason?: string
} {
  if (guild.is_disabled) {
    return {
      canPost: false,
      reason: "Guild is disabled and cannot post quests"
    }
  }
  
  return { canPost: true }
}
