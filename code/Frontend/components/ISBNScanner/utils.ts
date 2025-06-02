/**
 * ISBN Scanner Utility Functions
 * 
 * Collection of helper functions for ISBN validation, formatting, and data processing.
 * Provides reusable utilities for the scanning system and related components.
 * 
 * Key Features:
 * - ISBN format validation and normalization
 * - Timestamp formatting for user-friendly display
 * - Barcode format detection and validation
 * - Data transformation utilities for scanner results
 * 
 * Usage:
 * - Import specific functions as needed in scanner components
 * - Use for data validation before API calls
 * - Apply for consistent formatting across the app
 * 
 * Technical Notes:
 * - Implements industry-standard ISBN validation algorithms
 * - Supports both ISBN-10 and ISBN-13 formats
 * - Provides locale-aware date formatting
 * - Includes comprehensive error handling
 */

// ============================================================================
// DATE AND TIME UTILITIES
// ============================================================================

/**
 * Format a timestamp into a human-readable date/time string.
 * 
 * Converts Unix timestamps into localized, user-friendly date/time strings
 * suitable for display in the scanner history and other UI components.
 * 
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date/time string
 * 
 * @example
 * ```typescript
 * const scanTime = formatTimestamp(1640995200000);
 * console.log(scanTime); // "Jan 1, 2022, 2:30 PM"
 * ```
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  
  // Format: "Jan 1, 2023, 2:30 PM"
  // Uses US English locale for consistency across devices
  return date.toLocaleString('en-US', {
    month: 'short',      // Jan, Feb, etc.
    day: 'numeric',      // 1, 2, 3, etc.
    year: 'numeric',     // 2023, 2024, etc.
    hour: 'numeric',     // 1, 2, 12, etc.
    minute: '2-digit',   // 00, 01, 30, etc.
    hour12: true,        // Use AM/PM format
  });
}

/**
 * Calculate relative time from timestamp (e.g., "2 hours ago").
 * 
 * Provides intuitive relative time descriptions for recent scans,
 * falling back to absolute dates for older entries.
 * 
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Relative time description
 * 
 * @example
 * ```typescript
 * const recent = getRelativeTime(Date.now() - 300000); // 5 minutes ago
 * console.log(recent); // "5 minutes ago"
 * ```
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  // For older entries, show formatted date
  return formatTimestamp(timestamp);
}

// ============================================================================
// ISBN VALIDATION UTILITIES
// ============================================================================

/**
 * Validates if a string is a valid ISBN-13 format.
 * 
 * Performs comprehensive validation including:
 * - Format checking (13 digits)
 * - Prefix validation (must start with 978 or 979)
 * - Checksum verification using ISBN-13 algorithm
 * 
 * @param {string} isbn - The ISBN string to validate
 * @returns {boolean} True if valid ISBN-13, false otherwise
 * 
 * @example
 * ```typescript
 * const valid = isValidISBN13('9781234567890');
 * console.log(valid); // true or false based on checksum
 * ```
 */
export function isValidISBN13(isbn: string): boolean {
  // Remove any hyphens, spaces, or other formatting characters
  const cleanISBN = isbn.replace(/[\s-]/g, '');
  
  // Check if it's 13 digits and starts with valid prefix (978 or 979)
  if (!/^(978|979)\d{10}$/.test(cleanISBN)) {
    return false;
  }
  
  // Calculate and verify checksum using ISBN-13 algorithm
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(cleanISBN[i]);
    // Alternate between multiplying by 1 and 3
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  
  // Calculate check digit
  const checkDigit = (10 - (sum % 10)) % 10;
  const providedCheckDigit = parseInt(cleanISBN[12]);
  
  return checkDigit === providedCheckDigit;
}

/**
 * Validates if a string is a valid ISBN-10 format.
 * 
 * Validates legacy ISBN-10 format with proper checksum verification.
 * 
 * @param {string} isbn - The ISBN-10 string to validate
 * @returns {boolean} True if valid ISBN-10, false otherwise
 * 
 * @example
 * ```typescript
 * const valid = isValidISBN10('0123456789');
 * console.log(valid); // true or false based on checksum
 * ```
 */
export function isValidISBN10(isbn: string): boolean {
  // Remove formatting and convert to uppercase (for 'X' check digit)
  const cleanISBN = isbn.replace(/[\s-]/g, '').toUpperCase();
  
  // Check if it's 10 characters (9 digits + 1 check character)
  if (!/^\d{9}[\dX]$/.test(cleanISBN)) {
    return false;
  }
  
  // Calculate checksum using ISBN-10 algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanISBN[i]) * (10 - i);
  }
  
  // Calculate check digit
  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? '0' : remainder === 1 ? 'X' : (11 - remainder).toString();
  
  return checkDigit === cleanISBN[9];
}

/**
 * Convert ISBN-10 to ISBN-13 format.
 * 
 * Transforms legacy ISBN-10 codes to modern ISBN-13 format
 * by adding the 978 prefix and recalculating the check digit.
 * 
 * @param {string} isbn10 - Valid ISBN-10 string
 * @returns {string | null} ISBN-13 string or null if conversion fails
 * 
 * @example
 * ```typescript
 * const isbn13 = convertISBN10to13('0123456789');
 * console.log(isbn13); // '9780123456786'
 * ```
 */
export function convertISBN10to13(isbn10: string): string | null {
  if (!isValidISBN10(isbn10)) {
    return null;
  }
  
  // Remove formatting and take first 9 digits
  const cleanISBN = isbn10.replace(/[\s-]/g, '');
  const base = '978' + cleanISBN.substring(0, 9);
  
  // Calculate new check digit for ISBN-13
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return base + checkDigit.toString();
}

// ============================================================================
// ISBN FORMATTING UTILITIES
// ============================================================================

/**
 * Format ISBN with hyphens for better readability.
 * 
 * Adds standard hyphen formatting to ISBN strings for display purposes.
 * Handles both ISBN-10 and ISBN-13 formats.
 * 
 * @param {string} isbn - Raw ISBN string without formatting
 * @returns {string} Formatted ISBN with hyphens
 * 
 * @example
 * ```typescript
 * const formatted = formatISBN('9781234567890');
 * console.log(formatted); // '978-1-234-56789-0'
 * ```
 */
export function formatISBN(isbn: string): string {
  const cleanISBN = isbn.replace(/[\s-]/g, '');
  
  if (cleanISBN.length === 13) {
    // Format ISBN-13: 978-1-234-56789-0
    return `${cleanISBN.slice(0, 3)}-${cleanISBN.slice(3, 4)}-${cleanISBN.slice(4, 7)}-${cleanISBN.slice(7, 12)}-${cleanISBN.slice(12)}`;
  } else if (cleanISBN.length === 10) {
    // Format ISBN-10: 1-234-56789-0
    return `${cleanISBN.slice(0, 1)}-${cleanISBN.slice(1, 4)}-${cleanISBN.slice(4, 9)}-${cleanISBN.slice(9)}`;
  }
  
  // Return original if format not recognized
  return isbn;
}

/**
 * Normalize ISBN to consistent format (removes formatting, validates).
 * 
 * Cleans and validates ISBN input, returning a standardized format
 * suitable for database storage and API calls.
 * 
 * @param {string} isbn - ISBN string in any format
 * @returns {string | null} Normalized ISBN or null if invalid
 * 
 * @example
 * ```typescript
 * const normalized = normalizeISBN('978-1-234-56789-0');
 * console.log(normalized); // '9781234567890'
 * ```
 */
export function normalizeISBN(isbn: string): string | null {
  const cleanISBN = isbn.replace(/[\s-]/g, '');
  
  if (isValidISBN13(cleanISBN)) {
    return cleanISBN;
  } else if (isValidISBN10(cleanISBN)) {
    // Convert ISBN-10 to ISBN-13 for consistency
    return convertISBN10to13(cleanISBN);
  }
  
  return null;
}

// ============================================================================
// BARCODE DETECTION UTILITIES
// ============================================================================

/**
 * Determine if a scanned barcode is likely an ISBN.
 * 
 * Analyzes barcode format and content to determine if it represents
 * a book ISBN rather than other product codes.
 * 
 * @param {string} barcode - Scanned barcode data
 * @param {string} format - Barcode format type
 * @returns {boolean} True if barcode appears to be an ISBN
 * 
 * @example
 * ```typescript
 * const isISBN = isLikelyISBN('9781234567890', 'EAN13');
 * console.log(isISBN); // true
 * ```
 */
export function isLikelyISBN(barcode: string, format: string): boolean {
  const cleanCode = barcode.replace(/[\s-]/g, '');
  
  // Check for EAN-13 format with book prefix
  if (format === 'EAN13' && cleanCode.length === 13) {
    return cleanCode.startsWith('978') || cleanCode.startsWith('979');
  }
  
  // Check for ISBN-10 format
  if (cleanCode.length === 10) {
    return isValidISBN10(cleanCode);
  }
  
  return false;
}

/**
 * Extract potential ISBN from various barcode formats.
 * 
 * Processes different barcode types to extract ISBN data,
 * handling format variations and embedded data.
 * 
 * @param {string} barcodeData - Raw barcode scan data
 * @param {string} barcodeFormat - Detected barcode format
 * @returns {string | null} Extracted ISBN or null if not found
 */
export function extractISBNFromBarcode(barcodeData: string, barcodeFormat: string): string | null {
  const cleanData = barcodeData.replace(/[\s-]/g, '');
  
  // Handle different barcode formats
  switch (barcodeFormat) {
    case 'EAN13':
      if (isLikelyISBN(cleanData, 'EAN13')) {
        return cleanData;
      }
      break;
      
    case 'CODE128':
      // CODE128 might contain ISBN with additional data
      const isbnMatch = cleanData.match(/(978|979)\d{10}/);
      if (isbnMatch) {
        return isbnMatch[0];
      }
      break;
      
    default:
      // Try to extract any ISBN-like pattern
      const isbn13Match = cleanData.match(/(978|979)\d{10}/);
      if (isbn13Match && isValidISBN13(isbn13Match[0])) {
        return isbn13Match[0];
      }
      
      const isbn10Match = cleanData.match(/\d{9}[\dX]/);
      if (isbn10Match && isValidISBN10(isbn10Match[0])) {
        return convertISBN10to13(isbn10Match[0]);
      }
  }
  
  return null;
}