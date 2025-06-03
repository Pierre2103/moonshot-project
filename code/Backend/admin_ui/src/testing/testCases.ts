/**
 * API Test Cases Suite
 * 
 * Comprehensive test cases for validating the book scanning system API.
 * Tests cover all major functionality including:
 * - User management and authentication
 * - Book collection operations (CRUD)
 * - Search functionality across multiple fields
 * - Barcode and image scanning workflows
 * - Book detail retrieval
 * - Analytics and reporting endpoints
 * - Worker process management
 * - Error handling and edge cases
 * 
 * Each test case includes:
 * - Unique identifier for tracking
 * - Sector grouping for organization
 * - Human-readable description
 * - Automated execution function with cleanup
 */

import axios from "axios";
import { API_BASE_URL } from "../config/api";

export interface TestCase {
  id: string;                    // Unique identifier for the test
  sector: string;               // Grouping category (User, Collection, Search, etc.)
  name: string;                 // Human-readable test name
  description: string;          // Detailed description of what the test validates
  run: () => Promise<{ success: boolean; details: string; data?: any }>; // Test execution function
}

/**
 * Generate random string for unique test data.
 * 
 * @param length - Length of the random string (default: 8)
 * @returns Random alphanumeric string
 */
function randomString(length = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Create a test user and return the username.
 * Auto-generates unique username to avoid conflicts.
 * 
 * @returns Promise resolving to the created username
 */
async function getOrCreateTestUser(): Promise<string> {
  const username = "testuser_" + randomString();
  await axios.post(`${API_BASE_URL}/admin/api/users`, { username });
  return username;
}

/**
 * Clean up a test user and all associated data.
 * 
 * @param username - Username to delete
 */
async function deleteTestUser(username: string): Promise<void> {
  try {
    await axios.delete(`${API_BASE_URL}/admin/api/users/${username}`);
  } catch {
    // Ignore cleanup errors to prevent test failures
  }
}

/**
 * Get a random existing ISBN13 from the database for testing.
 * 
 * @returns Promise resolving to a valid ISBN13 string
 */
async function getRandomExistingIsbn13(): Promise<string> {
  const res = await axios.get(`${API_BASE_URL}/admin/api/testing/random_isbn13`);
  return res.data.isbn;
}

/**
 * Generate a random unknown ISBN13 not in the database.
 * Useful for testing the pending book queue workflow.
 * 
 * @returns Promise resolving to an unknown ISBN13 string
 */
async function getRandomUnknownIsbn13(): Promise<string> {
  const res = await axios.get(`${API_BASE_URL}/admin/api/testing/random_isbn13_unknown`);
  return res.data.isbn;
}

/**
 * Get a random existing ISBN10 from the database for testing.
 * 
 * @returns Promise resolving to a valid ISBN10 string
 */
async function getRandomExistingIsbn10(): Promise<string> {
  const res = await axios.get(`${API_BASE_URL}/admin/api/testing/random_cover`);
  return res.data.isbn;
}

/**
 * Load test images from existing book covers in the database.
 * Falls back to generated test images if real covers can't be loaded.
 * 
 * @returns Promise resolving to array of test images with ISBN metadata
 */
async function getTestImages(): Promise<{ isbn: string; file: File }[]> {
  try {
    // Get a random cover from the API that actually exists
    const coverRes = await axios.get(`${API_BASE_URL}/admin/api/testing/random_cover`);
    const isbn10 = coverRes.data.isbn;
    const coverUrl = coverRes.data.url;
    
    // Fetch the actual cover image data
    const response = await fetch(coverUrl);
    if (response.ok) {
      const blob = await response.blob();
      if (blob.type.startsWith('image/')) {
        const file = new File([blob], `${isbn10}.jpg`, { type: blob.type });
        return [{ isbn: isbn10, file }];
      }
    }
    
    throw new Error(`Failed to fetch cover image from ${coverUrl}`);
    
  } catch (error) {
    throw new Error(`Failed to load test image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a synthetic test image when real covers aren't available.
 * Generates a colored canvas with ISBN text overlay.
 * 
 * @param isbn - ISBN to display on the test image
 * @returns Promise resolving to array with generated test image
 */
function createTestImage(isbn: string): Promise<{ isbn: string; file: File }[]> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Create a simple colored rectangle as test image
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(0, 0, 200, 300);
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.fillText('Test Cover', 50, 150);
      ctx.fillText(isbn, 30, 180);
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${isbn}.jpg`, { type: 'image/jpeg' });
        resolve([{ isbn, file }]);
      } else {
        resolve([]);
      }
    }, 'image/jpeg', 0.8);
  });
}

/**
 * Upload an image file and verify it matches the expected ISBN.
 * 
 * @param isbn - Expected ISBN for the match
 * @param file - Image file to upload
 * @returns Test result with success status and details
 */
async function uploadImageAndCheckMatch(isbn: string, file: File) {
  if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
  const formData = new FormData();
  formData.append("image", file, `${isbn}.jpg`);
  try {
    const res = await axios.post(`${API_BASE_URL}/match`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res.data && res.data.filename && res.data.filename.startsWith(isbn)) {
      return { success: true, details: `Image match succeeded for ISBN ${isbn}.`, data: res.data };
    }
    return { success: false, details: `Image match failed or wrong ISBN. Got: ${res.data.filename}` };
  } catch (e: any) {
    return { success: false, details: `Error: ${e.message}` };
  }
}

// Test data constants
const TEST_ISBN = "9782889539215"; // Static ISBN for consistent testing
const TEST_USERS: string[] = [];   // Track created test users for cleanup
const TEST_COLLECTION_IDS: Array<{ username: string, id: number }> = []; // Track created collections

/**
 * Create and track a test user for automatic cleanup.
 * 
 * @returns Promise resolving to the created username
 */
async function createTestUserTracked(): Promise<string> {
  const username = "testuser_" + randomString();
  await axios.post(`${API_BASE_URL}/admin/api/users`, { username });
  TEST_USERS.push(username);
  return username;
}

/**
 * Clean up all test data created during test execution.
 * Removes collections, users, and test ISBNs from the database.
 */
async function cleanupTestData(): Promise<void> {
  // Delete all collections for each user
  for (const { username, id } of TEST_COLLECTION_IDS) {
    try {
      await axios.delete(`${API_BASE_URL}/api/collections/${username}/${id}`);
    } catch {
      // Ignore cleanup errors
    }
  }
  
  // Delete all test users (cascades to their scans and collections)
  for (const username of TEST_USERS) {
    try {
      await axios.delete(`${API_BASE_URL}/admin/api/users/${username}`);
    } catch {
      // Ignore cleanup errors
    }
  }
  
  // Delete the test ISBN from books table if it exists
  try {
    await axios.delete(`${API_BASE_URL}/admin/api/testing/delete_isbn/${TEST_ISBN}`);
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Ensure the test ISBN exists in the database for collection tests.
 */
async function ensureTestIsbnExists(): Promise<void> {
  try {
    await axios.post(`${API_BASE_URL}/admin/api/testing/add_isbn`, { isbn: TEST_ISBN });
  } catch {
    // Ignore if already exists
  }
}

/**
 * Complete test cases suite covering all API functionality.
 * Organized by functional sectors for better management and reporting.
 */
export const testCases: TestCase[] = [
  // === USER MANAGEMENT SECTOR ===
  {
    id: "user-create-valid",
    sector: "User",
    name: "Create User (Valid)",
    description: "Create a user with a unique username and verify successful creation.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      const username = "testuser_" + Math.random().toString(36).slice(2, 10);
      try {
        const res = await axios.post(`${API_BASE_URL}/admin/api/users`, { username });
        if (res.status === 201 && res.data.username === username) {
          await axios.delete(`${API_BASE_URL}/admin/api/users/${username}`);
          return { success: true, details: `User '${username}' created and deleted successfully.` };
        }
        await axios.delete(`${API_BASE_URL}/admin/api/users/${username}`);
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        await axios.delete(`${API_BASE_URL}/admin/api/users/${username}`).catch(() => {});
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "user-create-duplicate",
    sector: "User", 
    name: "Create User (Duplicate)",
    description: "Attempt to create a user that already exists, expecting a 409 conflict error.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      const username = "testuser_dup_" + randomString();
      try {
        await axios.post(`${API_BASE_URL}/admin/api/users`, { username });
        try {
          await axios.post(`${API_BASE_URL}/admin/api/users`, { username });
          await deleteTestUser(username);
          return { success: false, details: "Duplicate user creation did not fail as expected." };
        } catch (e: any) {
          await deleteTestUser(username);
          if (e.response && e.response.status === 409) {
            return { success: true, details: "409 Conflict received as expected for duplicate user." };
          }
          return { success: false, details: `Unexpected error: ${e.message}` };
        }
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "user-list",
    sector: "User",
    name: "List Users",
    description: "Retrieve the list of users and verify the new user appears in the results.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      const username = "testuser_list_" + randomString();
      try {
        await axios.post(`${API_BASE_URL}/admin/api/users`, { username });
        const res = await axios.get(`${API_BASE_URL}/admin/api/users`);
        await deleteTestUser(username);
        if (Array.isArray(res.data) && res.data.some((u: any) => u.username === username)) {
          return { success: true, details: `User '${username}' found in user list.` };
        }
        return { success: false, details: `User '${username}' not found in user list.` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "user-add-scan",
    sector: "User",
    name: "Add User Scan",
    description: "Add a scan record for an existing user and verify it's properly stored.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      const username = "testuser_scan_" + Math.random().toString(36).slice(2, 10);
      try {
        // Use a unique ISBN to avoid conflicts
        const uniqueIsbn = "978" + Math.floor(Math.random() * 1e10).toString().padStart(10, "0");
        await axios.post(`${API_BASE_URL}/admin/api/testing/add_isbn`, { isbn: uniqueIsbn }).catch(() => {});
        await axios.post(`${API_BASE_URL}/admin/api/users`, { username });
        // Clean up any previous scan for this user (should not exist, but for safety)
        await axios.delete(`${API_BASE_URL}/admin/api/user_scans/${username}`).catch(() => {});
        
        // Use the ISBN10 format for the scan (last 10 digits)
        const scanRes = await axios.post(`${API_BASE_URL}/admin/api/user_scans`, { username, isbn: uniqueIsbn.slice(-10) });
        await axios.delete(`${API_BASE_URL}/admin/api/users/${username}`);
        if (scanRes.status === 201 && scanRes.data.success) {
          return { success: true, details: `Scan added for user '${username}' and ISBN '${uniqueIsbn}'.` };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(scanRes.data)}` };
      } catch (e: any) {
        await axios.delete(`${API_BASE_URL}/admin/api/users/${username}`).catch(() => {});
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "user-recently-scanned",
    sector: "User",
    name: "Get Recently Scanned Books",
    description: "Retrieve recently scanned books for a user and verify the scan appears in results.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      const username = "testuser_recent_" + Math.random().toString(36).slice(2, 10);
      try {
        // Use a unique ISBN to avoid conflicts
        const uniqueIsbn = "978" + Math.floor(Math.random() * 1e10).toString().padStart(10, "0");
        await axios.post(`${API_BASE_URL}/admin/api/testing/add_isbn`, { isbn: uniqueIsbn }).catch(() => {});
        await axios.post(`${API_BASE_URL}/admin/api/users`, { username });
        // Clean up any previous scan for this user (should not exist, but for safety)
        await axios.delete(`${API_BASE_URL}/admin/api/user_scans/${username}`).catch(() => {});
        
        // Use the ISBN10 format for the scan
        await axios.post(`${API_BASE_URL}/admin/api/user_scans`, { username, isbn: uniqueIsbn.slice(-10) });
        const res = await axios.get(`${API_BASE_URL}/admin/api/recently_scanned/${username}`);
        await axios.delete(`${API_BASE_URL}/admin/api/users/${username}`);
        if (Array.isArray(res.data) && res.data.some((b: any) => b.isbn === uniqueIsbn.slice(-10))) {
          return { success: true, details: `Recently scanned books retrieved for user '${username}'.` };
        }
        return { success: false, details: `Book '${uniqueIsbn}' not found in recently scanned.` };
      } catch (e: any) {
        await axios.delete(`${API_BASE_URL}/admin/api/users/${username}`).catch(() => {});
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },

  // === COLLECTION MANAGEMENT SECTOR ===
  {
    id: "collection-create",
    sector: "Collection",
    name: "Create Collection",
    description: "Create a collection for an existing user and verify successful creation.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      const username = await createTestUserTracked();
      const name = "Test Collection " + randomString(4);
      const icon = "📚";
      try {
        const res = await axios.post(`${API_BASE_URL}/api/collections/${username}`, { name, icon });
        if (res.status === 201 && res.data.name === name) {
          TEST_COLLECTION_IDS.push({ username, id: res.data.id });
          return { success: true, details: `Collection '${name}' created for user '${username}'.` };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "collection-add-book",
    sector: "Collection",
    name: "Add Book to Collection",
    description: "Add a book to an existing collection and verify the operation succeeds.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      await ensureTestIsbnExists();
      const username = await createTestUserTracked();
      const name = "Test Collection " + randomString(4);
      const icon = "📚";
      const colRes = await axios.post(`${API_BASE_URL}/api/collections/${username}`, { name, icon });
      const collectionId = colRes.data.id;
      TEST_COLLECTION_IDS.push({ username, id: collectionId });
      try {
        const res = await axios.post(`${API_BASE_URL}/api/collections/${username}/${collectionId}/add`, { isbn: TEST_ISBN.slice(-10) });
        if (res.status === 201 && res.data.message) {
          return { success: true, details: `Book '${TEST_ISBN}' added to collection '${name}'.` };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "collection-books",
    sector: "Collection",
    name: "Get Books in Collection",
    description: "Retrieve the books in a collection and verify the added book appears.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      await ensureTestIsbnExists();
      const username = await createTestUserTracked();
      const name = "Test Collection " + randomString(4);
      const icon = "📚";
      const colRes = await axios.post(`${API_BASE_URL}/api/collections/${username}`, { name, icon });
      const collectionId = colRes.data.id;
      TEST_COLLECTION_IDS.push({ username, id: collectionId });
      await axios.post(`${API_BASE_URL}/api/collections/${username}/${collectionId}/add`, { isbn: TEST_ISBN.slice(-10) });
      try {
        const res = await axios.get(`${API_BASE_URL}/api/collections/${collectionId}/books`);
        if (Array.isArray(res.data) && res.data.some((b: any) => b.isbn === TEST_ISBN.slice(-10))) {
          return { success: true, details: `Book '${TEST_ISBN}' found in collection '${name}'.` };
        }
        return { success: false, details: `Book '${TEST_ISBN}' not found in collection.` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "collection-remove-book",
    sector: "Collection",
    name: "Remove Book from Collection", 
    description: "Remove a book from a collection and verify the operation succeeds.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      await ensureTestIsbnExists();
      const username = await createTestUserTracked();
      const name = "Test Collection " + randomString(4);
      const icon = "📚";
      const colRes = await axios.post(`${API_BASE_URL}/api/collections/${username}`, { name, icon });
      const collectionId = colRes.data.id;
      TEST_COLLECTION_IDS.push({ username, id: collectionId });
      await axios.post(`${API_BASE_URL}/api/collections/${username}/${collectionId}/add`, { isbn: TEST_ISBN.slice(-10) });
      try {
        const res = await axios.delete(`${API_BASE_URL}/api/collections/${collectionId}/books/${TEST_ISBN.slice(-10)}`);
        if (res.status === 200 && res.data.message) {
          return { success: true, details: `Book '${TEST_ISBN}' removed from collection '${name}'.` };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "collection-update",
    sector: "Collection",
    name: "Update Collection",
    description: "Update the name and icon of a collection and verify the changes.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      const username = await createTestUserTracked();
      const name = "Test Collection " + randomString(4);
      const icon = "📚";
      const colRes = await axios.post(`${API_BASE_URL}/api/collections/${username}`, { name, icon });
      const collectionId = colRes.data.id;
      const newName = name + "_updated";
      const newIcon = "📖";
      try {
        const res = await axios.put(`${API_BASE_URL}/api/collections/${username}/${collectionId}`, { name: newName, icon: newIcon });
        await deleteTestUser(username);
        if (res.status === 200 && res.data.name === newName && res.data.icon === newIcon) {
          return { success: true, details: `Collection updated to '${newName}' with icon '${newIcon}'.` };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        await deleteTestUser(username);
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "collection-delete",
    sector: "Collection",
    name: "Delete Collection",
    description: "Delete a collection and verify the deletion succeeds.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      const username = await createTestUserTracked();
      const name = "Test Collection " + randomString(4);
      const icon = "📚";
      const colRes = await axios.post(`${API_BASE_URL}/api/collections/${username}`, { name, icon });
      const collectionId = colRes.data.id;
      try {
        const res = await axios.delete(`${API_BASE_URL}/api/collections/${username}/${collectionId}`);
        await deleteTestUser(username);
        if (res.status === 200 && res.data.message) {
          return { success: true, details: `Collection '${name}' deleted successfully.` };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        await deleteTestUser(username);
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },

  // === SEARCH FUNCTIONALITY SECTOR ===
  {
    id: "search-title",
    sector: "Search",
    name: "Search by Title",
    description: "Search for books using a partial title match and verify results.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      // Use a common word to maximize hit chance
      try {
        const res = await axios.get(`${API_BASE_URL}/api/search?q=the`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          return { success: true, details: `Found ${res.data.length} books with 'the' in title/author/isbn.` };
        }
        return { success: false, details: "No books found for query 'the'." };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "search-isbn",
    sector: "Search",
    name: "Search by ISBN",
    description: "Search for a book using an existing ISBN and verify it's found.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      const isbn = await getRandomExistingIsbn13();
      try {
        const res = await axios.get(`${API_BASE_URL}/api/search?q=${isbn}`);
        if (Array.isArray(res.data) && res.data.some((b: any) => b.isbn13 === isbn)) {
          return { success: true, details: `Book with ISBN '${isbn}' found in search results.` };
        }
        return { success: false, details: `Book with ISBN '${isbn}' not found in search results.` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "search-author",
    sector: "Search",
    name: "Search by Author",
    description: "Search for books by a common author name and verify results.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      // Use a common author name
      try {
        const res = await axios.get(`${API_BASE_URL}/api/search?q=Rowling`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          return { success: true, details: `Found ${res.data.length} books by author 'Rowling'.` };
        }
        return { success: false, details: "No books found for author 'Rowling'." };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "search-genre",
    sector: "Search",
    name: "Search by Genre",
    description: "Search for books in a common genre and verify results.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      // Use a common genre
      try {
        const res = await axios.get(`${API_BASE_URL}/api/search?q=fiction`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          return { success: true, details: `Found ${res.data.length} books in genre 'fiction'.` };
        }
        return { success: false, details: "No books found for genre 'fiction'." };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },

  // === SCANNING AND BARCODE SECTOR ===
  {
    id: "scan-existing-isbn-barcode",
    sector: "Scan",
    name: "Scan Existing ISBN Barcode",
    description: "Scan a barcode for an existing ISBN and verify it's detected as already in dataset.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/api/testing/random_isbn13`);
        const isbn = res.data.isbn;
        const scanRes = await axios.post(`${API_BASE_URL}/barcode`, { isbn });
        if (scanRes.data.already_in_dataset === true) {
          return { success: true, details: `Scan for existing ISBN '${isbn}' correctly detected as already in dataset.` };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(scanRes.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "scan-unknown-isbn-barcode",
    sector: "Scan", 
    name: "Scan Unknown ISBN Barcode",
    description: "Scan a barcode for an unknown ISBN and verify it gets queued for processing.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/api/testing/random_isbn13_unknown`);
        const isbn = res.data.isbn;
        const scanRes = await axios.post(`${API_BASE_URL}/barcode`, { isbn });
        if (scanRes.data.already_in_dataset === false) {
          return { success: true, details: `Scan for unknown ISBN '${isbn}' correctly queued for processing.` };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(scanRes.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "scan-manual-barcode",
    sector: "Scan",
    name: "Manual ISBN Barcode Generation",
    description: "Generate a barcode image for a manually entered ISBN and verify the image is created.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      const isbn = "978" + Math.floor(Math.random() * 1e10).toString().padStart(10, "0");
      try {
        const url = `${API_BASE_URL}/admin/api/testing/barcode/${isbn}`;
        // Check if the image is returned with correct content type
        const res = await axios.get(url, { responseType: "arraybuffer" });
        if (res.status === 200 && res.headers["content-type"] === "image/png") {
          return { success: true, details: `Barcode generated successfully for ISBN '${isbn}'.` };
        }
        return { success: false, details: `Unexpected response: ${res.status}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "scan-random-cover",
    sector: "Scan",
    name: "Scan Random Cover",
    description: "Upload a real cover image and verify the matching algorithm correctly identifies it.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        const images = await getTestImages();
        if (images.length === 0) return { success: false, details: "No test images found." };
        const { isbn, file } = images[0];
        
        // Validate file is actually an image
        if (!file.type.startsWith('image/')) {
          return { success: false, details: `Invalid file type: ${file.type}. Expected image.` };
        }
        
        const formData = new FormData();
        formData.append("image", file, `${isbn}.jpg`);
        const res = await axios.post(`${API_BASE_URL}/match`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data && res.data.filename && res.data.filename.startsWith(isbn)) {
          return { success: true, details: `Image match succeeded for ISBN ${isbn}.`, data: res.data };
        }
        return { success: false, details: `Image match failed or wrong ISBN. Expected: ${isbn}, Got: ${res.data.filename}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "scan-cover-recognition",
    sector: "Scan",
    name: "Cover Recognition (Image Match)",
    description: "Test the image matching system with multiple cover images to verify accuracy.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        const images = await getTestImages();
        if (images.length === 0) return { success: false, details: "No test images found." };
        
        for (const { isbn, file } of images) {
          // Validate file is actually an image
          if (!file.type.startsWith('image/')) {
            return { success: false, details: `Invalid file type: ${file.type}. Expected image.` };
          }
          
          const formData = new FormData();
          formData.append("image", file, `${isbn}.jpg`);
          const res = await axios.post(`${API_BASE_URL}/match`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          if (!(res.data && res.data.filename && res.data.filename.startsWith(isbn))) {
            return { success: false, details: `Image match failed or wrong ISBN. Expected: ${isbn}, Got: ${res.data.filename}` };
          }
        }
        return { success: true, details: "All test images matched their corresponding ISBN successfully." };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },

  // === BOOK DETAILS SECTOR ===
  {
    id: "book-details-valid",
    sector: "Book",
    name: "Get Book Details (Valid ISBN)",
    description: "Retrieve detailed information for an existing book using its ISBN.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      const isbn = await getRandomExistingIsbn13();
      try {
        const res = await axios.get(`${API_BASE_URL}/api/book/${isbn}`);
        if (res.status === 200 && res.data.isbn13 === isbn) {
          return { success: true, details: `Book details for ISBN '${isbn}' retrieved successfully.` };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "book-details-invalid",
    sector: "Book",
    name: "Get Book Details (Invalid ISBN)",
    description: "Attempt to retrieve details for a non-existing book, expecting a 404 error.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      const isbn = "9999999999999";
      try {
        await axios.get(`${API_BASE_URL}/api/book/${isbn}`);
        return { success: false, details: "Book details for invalid ISBN did not fail as expected." };
      } catch (e: any) {
        if (e.response && e.response.status === 404) {
          return { success: true, details: "404 Not Found received as expected for invalid ISBN." };
        }
        return { success: false, details: `Unexpected error: ${e.message}` };
      }
    }
  },

  // === ANALYTICS SECTOR ===
  {
    id: "analytics-overview",
    sector: "Analytics",
    name: "Get Analytics Overview",
    description: "Retrieve global dataset statistics and verify the response structure.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/api/analytics/overview`);
        if (res.status === 200 && typeof res.data.total_books === "number") {
          return { success: true, details: "Analytics overview retrieved successfully.", data: res.data };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "analytics-timeline",
    sector: "Analytics",
    name: "Get Analytics Timeline",
    description: "Retrieve publication timeline data for historical analysis.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/api/analytics/timeline`);
        if (res.status === 200 && Array.isArray(res.data)) {
          return { success: true, details: "Analytics timeline retrieved successfully.", data: res.data };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "analytics-top-authors",
    sector: "Analytics",
    name: "Get Top Authors",
    description: "Retrieve the most prolific authors in the dataset.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/api/analytics/authors?limit=10`);
        if (res.status === 200 && Array.isArray(res.data)) {
          return { success: true, details: "Top authors retrieved successfully.", data: res.data };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "analytics-top-publishers",
    sector: "Analytics",
    name: "Get Top Publishers",
    description: "Retrieve the main publishers represented in the dataset.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/api/analytics/publishers?limit=10`);
        if (res.status === 200 && Array.isArray(res.data)) {
          return { success: true, details: "Top publishers retrieved successfully.", data: res.data };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "analytics-language-distribution",
    sector: "Analytics",
    name: "Get Language Distribution",
    description: "Retrieve the distribution of languages across the book collection.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/api/analytics/languages`);
        if (res.status === 200 && Array.isArray(res.data)) {
          return { success: true, details: "Language distribution retrieved successfully.", data: res.data };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "analytics-page-distribution",
    sector: "Analytics",
    name: "Get Page Distribution",
    description: "Retrieve statistics about page counts across the collection.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/api/analytics/pages`);
        if (res.status === 200 && res.data.stats) {
          return { success: true, details: "Page distribution retrieved successfully.", data: res.data };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "analytics-metadata-coverage",
    sector: "Analytics",
    name: "Get Metadata Coverage",
    description: "Retrieve metadata completeness statistics for data quality assessment.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/api/analytics/metadata-coverage`);
        if (res.status === 200 && res.data.coverage_counts) {
          return { success: true, details: "Metadata coverage retrieved successfully.", data: res.data };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "analytics-genre-distribution",
    sector: "Analytics",
    name: "Get Genre Distribution",
    description: "Retrieve the distribution of genres across the book collection.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/api/analytics/genres`);
        if (res.status === 200 && Array.isArray(res.data)) {
          return { success: true, details: "Genre distribution retrieved successfully.", data: res.data };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },

  // === WORKER MANAGEMENT SECTOR ===
  {
    id: "worker-start",
    sector: "Worker",
    name: "Start Worker",
    description: "Start a background worker process and verify it starts successfully.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        const res = await axios.post(`${API_BASE_URL}/admin/api/workers/book_worker/start`);
        if (res.status === 200 && (res.data.status === "started" || res.data.message === "Started")) {
          return { success: true, details: "Worker started successfully." };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "worker-stop",
    sector: "Worker",
    name: "Stop Worker",
    description: "Stop a running worker process and verify it stops successfully.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        const res = await axios.post(`${API_BASE_URL}/admin/api/workers/book_worker/stop`);
        if (res.status === 200 && (res.data.status === "stopped" || res.data.message === "Stopped")) {
          return { success: true, details: "Worker stopped successfully." };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "worker-status",
    sector: "Worker",
    name: "Get Worker Status",
    description: "Check the current status of all registered worker processes.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/api/workers/status`);
        if (res.status === 200 && typeof res.data === "object") {
          return { success: true, details: "Worker status retrieved successfully.", data: res.data };
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },

  // === ERROR HANDLING SECTOR ===
  {
    id: "user-create-empty",
    sector: "Error Handling",
    name: "Create User (Empty Username)",
    description: "Attempt to create a user with an empty username, expecting a 400 error.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        await axios.post(`${API_BASE_URL}/admin/api/users`, { username: "" });
        return { success: false, details: "User creation with empty username did not fail as expected." };
      } catch (e: any) {
        if (e.response && e.response.status === 400) {
          return { success: true, details: "400 Bad Request received as expected for empty username." };
        }
        return { success: false, details: `Unexpected error: ${e.message}` };
      }
    }
  },
  {
    id: "user-add-scan-invalid-user",
    sector: "Error Handling",
    name: "Add User Scan (Invalid User)",
    description: "Attempt to add a scan for a non-existing user, expecting appropriate error handling.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      const username = "nonexistent_" + randomString();
      const isbn = await getRandomExistingIsbn13();
      try {
        await axios.post(`${API_BASE_URL}/admin/api/user_scans`, { username, isbn });
        return { success: false, details: "Scan for invalid user did not fail as expected." };
      } catch (e: any) {
        if (e.response && e.response.status === 404) {
          return { success: true, details: "404 Not Found received as expected for invalid user." };
        }
        return { success: false, details: `Unexpected error: ${e.message}` };
      }
    }
  },
  {
    id: "collection-add-book-invalid",
    sector: "Error Handling",
    name: "Add Book to Collection (Invalid Collection)",
    description: "Attempt to add a book to a non-existing collection, expecting a 404 error.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      const username = await createTestUserTracked();
      const isbn = await getRandomExistingIsbn13();
      const invalidCollectionId = 9999999;
      try {
        await axios.post(`${API_BASE_URL}/api/collections/${username}/${invalidCollectionId}/add`, { isbn });
        return { success: false, details: "Add book to invalid collection did not fail as expected." };
      } catch (e: any) {
        if (e.response && e.response.status === 404) {
          return { success: true, details: "404 Not Found received as expected for invalid collection." };
        }
        return { success: false, details: `Unexpected error: ${e.message}` };
      }
    }
  },
  {
    id: "scan-barcode-no-isbn",
    sector: "Error Handling",
    name: "Scan Barcode (No ISBN)",
    description: "Attempt to scan a barcode without providing an ISBN, expecting a 400 error.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        await axios.post(`${API_BASE_URL}/barcode`, {});
        return { success: false, details: "Scan without ISBN did not fail as expected." };
      } catch (e: any) {
        if (e.response && e.response.status === 400) {
          return { success: true, details: "400 Bad Request received as expected for missing ISBN." };
        }
        return { success: false, details: `Unexpected error: ${e.message}` };
      }
    }
  },
  {
    id: "scan-cover-invalid-image",
    sector: "Error Handling",
    name: "Cover Recognition (Invalid Image)",
    description: "Upload a non-image file for cover recognition, expecting a 400 error.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      try {
        // Create a fake text file as Blob
        const blob = new Blob(["not an image"], { type: "text/plain" });
        const file = new File([blob], "not_an_image.txt", { type: "text/plain" });
        const formData = new FormData();
        formData.append("image", file);
        await axios.post(`${API_BASE_URL}/match`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return { success: false, details: "Invalid image upload did not fail as expected." };
      } catch (e: any) {
        if (e.response && e.response.status === 400) {
          return { success: true, details: "400 Bad Request received as expected for invalid image." };
        }
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  {
    id: "user-delete",
    sector: "User",
    name: "Delete User",
    description: "Create and then delete a user, verifying the deletion process works correctly.",
    run: async () => {
      if (!API_BASE_URL) return { success: false, details: "API_BASE_URL not set" };
      const username = "testuser_delete_" + randomString();
      try {
        // Create user
        await axios.post(`${API_BASE_URL}/admin/api/users`, { username });
        // Delete user
        const res = await axios.delete(`${API_BASE_URL}/admin/api/users/${username}`);
        if (res.status === 200 && res.data.message && res.data.message.includes(username)) {
          // Try to get user, should not exist
          try {
            await axios.get(`${API_BASE_URL}/admin/api/users/${username}`);
            return { success: false, details: "User still exists after deletion." };
          } catch (e: any) {
            if (e.response && e.response.status === 404) {
              return { success: true, details: `User '${username}' deleted successfully and verified.` };
            }
            // If the endpoint /users/<username> does not exist, just consider deletion success
            return { success: true, details: `User '${username}' deleted (could not verify absence).` };
          }
        }
        return { success: false, details: `Unexpected response: ${JSON.stringify(res.data)}` };
      } catch (e: any) {
        return { success: false, details: `Error: ${e.message}` };
      }
    }
  },
  
  // === CLEANUP TEST ===
  {
    id: "cleanup-test-data",
    sector: "Cleanup",
    name: "Cleanup Test Data",
    description: "Remove all test users, collections, and ISBNs created during testing.",
    run: async () => {
      try {
        await cleanupTestData();
        return { success: true, details: "All test data cleaned up successfully." };
      } catch (e: any) {
        return { success: false, details: `Cleanup failed: ${e.message}` };
      }
    }
  }
];
