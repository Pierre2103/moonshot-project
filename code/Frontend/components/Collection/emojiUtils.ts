/**
 * Emoji Utilities for Collection Management
 * 
 * Utility functions for generating and managing emoji icons for book collections.
 * Provides diverse emoji options for personalizing collection appearances.
 * 
 * Key Features:
 * - Random emoji generation from curated list
 * - Thematic emoji categories (books, fantasy, science, etc.)
 * - Gender-inclusive character options
 * - Scalable emoji pool for future expansion
 * 
 * Usage:
 * - Collection creation default icons
 * - Random icon generation on user request
 * - Fallback icons for collection imports
 * 
 * Technical Notes:
 * - Uses Unicode emoji for broad device compatibility
 * - Includes character variations for diversity
 * - Balanced selection across themes and preferences
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Comprehensive emoji collection for book collections.
 * 
 * Categories included:
 * - Books & Reading: 📚, 📖
 * - Creative Arts: 🎨, 🎵, 🎬, 🎮
 * - Academic & Science: 🧠, 💡
 * - Adventure & Travel: 🌍, 🚀
 * - Emotions & Reactions: 🌟, 🔥, 🎉, ❤️
 * - Fantasy Characters: 🦄, 👑, 🧙‍♂️, 🧙‍♀️, 🧚‍♂️, 🧚‍♀️
 * - Superhero & Adventure: 🦸‍♂️, 🦸‍♀️, 🦹‍♂️, 🦹‍♀️
 * - Mythical & Supernatural: 🧛‍♂️, 🧟‍♂️, 🧞‍♂️, 🧞‍♀️
 * - Fantasy Beings: 🧜‍♂️, 🧜‍♀️, 🧝‍♂️, 🧝‍♀️
 */
const EMOJI_POOL = [
  // Core book and reading themes
  "📚", "📖",
  
  // Creative and entertainment
  "🦄", "🌟", "🔥", "🎉", "💡", "🧠", "🚀", "🎨",
  
  // Character archetypes - male variants
  "🦸‍♂️", "🧙‍♂️", "🦸", "🦹‍♂️", "🧛‍♂️", "🧟‍♂️", 
  "🧞‍♂️", "🧚‍♂️", "🧜‍♂️", "🧝‍♂️",
  
  // Character archetypes - female variants
  "👑", "🦸‍♀️", "🦹‍♀️", "🧙‍♀️", "🧞‍♀️", "🧚‍♀️", 
  "🧜‍♀️", "🧝‍♀️",
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a random emoji from the curated emoji pool.
 * 
 * Provides fair distribution across all emoji categories and ensures
 * users get varied suggestions for their collections.
 * 
 * @returns {string} A random emoji character
 * 
 * @example
 * ```typescript
 * const randomIcon = getRandomEmoji();
 * console.log(randomIcon); // "🧙‍♀️" or any other emoji from the pool
 * ```
 */
export function getRandomEmoji(): string {
  const randomIndex = Math.floor(Math.random() * EMOJI_POOL.length);
  return EMOJI_POOL[randomIndex];
}

/**
 * Get multiple unique random emojis.
 * Useful for providing several options to users at once.
 * 
 * @param {number} count - Number of unique emojis to return
 * @returns {string[]} Array of unique emoji characters
 * 
 * @example
 * ```typescript
 * const suggestions = getMultipleRandomEmojis(3);
 * console.log(suggestions); // ["🎨", "🚀", "👑"]
 * ```
 */
export function getMultipleRandomEmojis(count: number): string[] {
  const shuffled = [...EMOJI_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, EMOJI_POOL.length));
}

/**
 * Check if a given string is a valid emoji from our collection.
 * Useful for validating user input or imports.
 * 
 * @param {string} emoji - The emoji to validate
 * @returns {boolean} True if the emoji is in our curated collection
 * 
 * @example
 * ```typescript
 * const isValid = isValidCollectionEmoji("📚");
 * console.log(isValid); // true
 * 
 * const isInvalid = isValidCollectionEmoji("🍕");
 * console.log(isInvalid); // false
 * ```
 */
export function isValidCollectionEmoji(emoji: string): boolean {
  return EMOJI_POOL.includes(emoji);
}

/**
 * Get the total number of available emojis in the pool.
 * Useful for analytics or UI displays.
 * 
 * @returns {number} Total count of available emojis
 */
export function getEmojiPoolSize(): number {
  return EMOJI_POOL.length;
}
