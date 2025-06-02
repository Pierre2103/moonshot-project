/**
 * ISBN Scanner Type Definitions
 * 
 * TypeScript interfaces and types for the ISBN scanning system.
 * Provides type safety and clear contracts for scanner-related data structures.
 * 
 * Key Features:
 * - Comprehensive type coverage for scanning operations
 * - Clear data structure documentation
 * - Type safety for API interactions
 * - Extensible interfaces for future enhancements
 * 
 * Usage:
 * - Import types in scanner components for type safety
 * - Use interfaces for API response typing
 * - Extend types for additional scanner functionality
 * 
 * Technical Notes:
 * - Follows TypeScript best practices for interface design
 * - Uses descriptive property names for clarity
 * - Includes optional properties where appropriate
 */

// ============================================================================
// CORE SCANNER TYPES
// ============================================================================

/**
 * Scanned ISBN data structure.
 * 
 * Represents a successfully scanned ISBN with metadata for tracking
 * and display purposes within the scanner interface.
 * 
 * Properties:
 * - id: Unique identifier for the scan session
 * - code: The actual ISBN code that was scanned
 * - type: Barcode format (EAN-13, Code 128, etc.)
 * - timestamp: When the scan occurred (Unix timestamp)
 * 
 * @interface ScannedISBN
 * 
 * @example
 * ```typescript
 * const scannedBook: ScannedISBN = {
 *   id: 'scan_001',
 *   code: '9781234567890',
 *   type: 'EAN13',
 *   timestamp: Date.now()
 * };
 * ```
 */
export interface ScannedISBN {
  /** Unique identifier for this scan entry */
  id: string;
  
  /** The scanned ISBN code (with or without hyphens) */
  code: string;
  
  /** Barcode format type detected by the scanner */
  type: string;
  
  /** Unix timestamp when the scan occurred */
  timestamp: number;
}

// ============================================================================
// SCANNER STATE TYPES
// ============================================================================

/**
 * Scanner operational state enumeration.
 * 
 * Defines the possible states of the scanner component for UI management
 * and user feedback purposes.
 */
export enum ScannerState {
  /** Scanner is idle and ready to scan */
  IDLE = 'idle',
  
  /** Scanner is actively scanning for barcodes */
  SCANNING = 'scanning',
  
  /** Scanner has detected a barcode and is processing */
  PROCESSING = 'processing',
  
  /** Scanner encountered an error during operation */
  ERROR = 'error',
  
  /** Scanner permissions are not granted */
  PERMISSION_DENIED = 'permission_denied'
}

/**
 * Scanner configuration options.
 * 
 * Customizable settings for scanner behavior and appearance.
 * 
 * @interface ScannerConfig
 */
export interface ScannerConfig {
  /** Supported barcode formats for scanning */
  supportedFormats?: string[];
  
  /** Enable/disable scan sound feedback */
  playSoundOnScan?: boolean;
  
  /** Enable/disable haptic feedback on scan */
  enableHapticFeedback?: boolean;
  
  /** Timeout for scan processing in milliseconds */
  scanTimeout?: number;
  
  /** Maximum number of scans to store in history */
  maxHistorySize?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * API response for ISBN validation and book lookup.
 * 
 * Structure returned by the backend when validating or looking up
 * scanned ISBN codes.
 * 
 * @interface ISBNValidationResponse
 */
export interface ISBNValidationResponse {
  /** Whether the ISBN format is valid */
  isValid: boolean;
  
  /** The normalized ISBN (formatted consistently) */
  normalizedISBN?: string;
  
  /** Book information if found in database */
  bookInfo?: {
    title: string;
    authors: string[];
    publisher?: string;
    year?: number;
    coverUrl?: string;
  };
  
  /** Error message if validation failed */
  error?: string;
  
  /** Whether the book is already in the user's collection */
  inCollection?: boolean;
}

/**
 * Scanner hook return type.
 * 
 * Interface for the custom hook that manages scanner state and operations.
 * 
 * @interface UseScannerReturn
 */
export interface UseScannerReturn {
  /** Current scanner operational state */
  state: ScannerState;
  
  /** Array of successfully scanned ISBNs */
  scannedISBNs: ScannedISBN[];
  
  /** Camera permission status */
  hasPermission: boolean;
  
  /** Whether scanner is currently active */
  isScanning: boolean;
  
  /** Current scanner configuration */
  config: ScannerConfig;
  
  /** Function to start scanning operation */
  startScanning: () => void;
  
  /** Function to stop scanning operation */
  stopScanning: () => void;
  
  /** Function to clear scan history */
  clearHistory: () => void;
  
  /** Function to request camera permissions */
  requestPermission: () => Promise<boolean>;
  
  /** Function to handle successful barcode scan */
  handleBarCodeScanned: (scanResult: { data: string; type: string }) => void;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Scanner-specific error types for better error handling.
 * 
 * Provides structured error information for different failure scenarios
 * in the scanning process.
 */
export enum ScannerErrorType {
  /** Camera permission was denied */
  PERMISSION_DENIED = 'permission_denied',
  
  /** Camera hardware not available */
  CAMERA_UNAVAILABLE = 'camera_unavailable',
  
  /** Invalid barcode format detected */
  INVALID_BARCODE = 'invalid_barcode',
  
  /** Network error during ISBN validation */
  NETWORK_ERROR = 'network_error',
  
  /** Unknown error occurred */
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * Structured error object for scanner operations.
 * 
 * @interface ScannerError
 */
export interface ScannerError {
  /** Type of error that occurred */
  type: ScannerErrorType;
  
  /** Human-readable error message */
  message: string;
  
  /** Additional error details for debugging */
  details?: any;
  
  /** Timestamp when error occurred */
  timestamp: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard to check if a string is a valid ISBN format.
 * 
 * @param isbn - String to validate as ISBN
 * @returns Type predicate indicating if string is valid ISBN
 */
export type ISBNValidator = (isbn: string) => isbn is string;

/**
 * Callback function type for scan completion events.
 * 
 * @param result - The scanned ISBN result
 */
export type ScanCompletionCallback = (result: ScannedISBN) => void;

/**
 * Callback function type for scanner error events.
 * 
 * @param error - The scanner error that occurred
 */
export type ScanErrorCallback = (error: ScannerError) => void;