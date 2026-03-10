/**
 * Calculate duration in minutes between two timestamps
 */
const getDurationMinutes = (start, end) => {
  const diff = new Date(end) - new Date(start);
  return Math.round(diff / 60000); // round instead of floor
};
  
  /**
   * Check if a timestamp is within the allowed window (seconds)
   */
  const isWithinWindow = (timestamp, windowSeconds = 60) => {
    const now = Date.now();
    const tokenTime = new Date(timestamp).getTime();
    return (now - tokenTime) <= windowSeconds * 1000; 
  };
  
  module.exports = { getDurationMinutes, isWithinWindow };