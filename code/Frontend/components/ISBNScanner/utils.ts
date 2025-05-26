/**
 * Format a timestamp into a human-readable date/time string
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  
  // Format: "Jan 1, 2023, 2:30 PM"
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Validates if a string is a valid ISBN-13
 * ISBN-13 must start with 978 or 979 and be 13 digits
 */
export function isValidISBN13(isbn: string): boolean {
  // Remove any hyphens or spaces
  const cleanISBN = isbn.replace(/[\s-]/g, '');
  
  // Check if it's 13 digits and starts with 978 or 979
  if (!/^(978|979)\d{10}$/.test(cleanISBN)) {
    return false;
  }
  
  // Check the checksum using the ISBN-13 algorithm
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanISBN[i]) * (i % 2 === 0 ? 1 : 3);
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(cleanISBN[12]);
}