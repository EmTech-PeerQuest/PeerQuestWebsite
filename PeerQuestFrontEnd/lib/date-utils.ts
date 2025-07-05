/**
 * Utility functions for date formatting and display
 */

/**
 * Format a join date with relative time for recent dates and full date for older ones
 * @param dateString - The date string from user.createdAt or user.dateJoined
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatJoinDate(
  dateString: string | undefined | null,
  options: {
    fallback?: string;
    includeYear?: boolean;
    capitalizeFirst?: boolean;
  } = {}
): string {
  const { 
    fallback = "N/A", 
    includeYear = true,
    capitalizeFirst = false 
  } = options;

  if (!dateString) {
    return fallback;
  }
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return fallback;
    }
    
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let result: string;
    
    // Show relative time for very recent joins
    if (diffMinutes < 60) {
      result = "just now";
    } else if (diffHours < 24) {
      result = diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    } else if (diffDays === 0) {
      result = "today";
    } else if (diffDays === 1) {
      result = "yesterday";
    } else if (diffDays < 7) {
      result = `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      result = weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      result = months === 1 ? "1 month ago" : `${months} months ago`;
    } else {
      // For dates older than a year, show the actual date
      const formatOptions: Intl.DateTimeFormatOptions = { 
        month: 'long',
        ...(includeYear && { year: 'numeric' })
      };
      
      // Add day for very specific formatting
      if (diffDays > 730) { // More than 2 years
        formatOptions.day = 'numeric';
      }
      
      result = date.toLocaleDateString('en-US', formatOptions);
    }
    
    return capitalizeFirst ? result.charAt(0).toUpperCase() + result.slice(1) : result;
  } catch (error) {
    console.error('Error formatting join date:', error);
    return fallback;
  }
}

/**
 * Calculate the age of a password in human-readable format
 * @param lastPasswordChange - The date string when password was last changed
 * @returns Human-readable password age
 */
export function getPasswordAge(lastPasswordChange: string | undefined | null): string {
  if (!lastPasswordChange) return "Unknown";
  
  try {
    const lastChange = new Date(lastPasswordChange);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastChange.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day";
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? "1 month" : `${months} months`;
    }
    const years = Math.floor(diffDays / 365);
    return years === 1 ? "1 year" : `${years} years`;
  } catch (error) {
    console.error('Error calculating password age:', error);
    return "Unknown";
  }
}

/**
 * Get the number of days since a given date
 * @param dateString - The date string to calculate from
 * @returns Number of days since the date, or null if invalid
 */
export function getDaysSince(dateString: string | undefined | null): number | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Error calculating days since date:', error);
    return null;
  }
}
