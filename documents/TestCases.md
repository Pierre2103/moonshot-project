<div align="center">

<img src="images/logo.png" alt="Ridizi Logo" width="400">

---

# Test Cases

**Title:** Ridizi – Moonshot Project

**Author:** Pierre GORIN

**Created on:** April 12<sup>th</sup>, 2025

**Last updated:** June 3<sup>rd</sup>, 2025

</div>

<br><details>

<summary><strong>Table of Contents (Click to expand)</strong></summary>

- [Test Cases](#test-cases)
  - [1. Introduction](#1-introduction)
  - [2. Test Case Table](#2-test-case-table)
  - [3. Test Case Detail](#3-test-case-detail)
    - [TC-001: Create User (Valid)](#tc-001-create-user-valid)
    - [TC-002: Create User (Duplicate)](#tc-002-create-user-duplicate)
    - [TC-003: List Users](#tc-003-list-users)
    - [TC-004: Add User Scan](#tc-004-add-user-scan)
    - [TC-005: Get Recently Scanned Books](#tc-005-get-recently-scanned-books)
    - [TC-006: Create Collection](#tc-006-create-collection)
    - [TC-007: Add Book to Collection](#tc-007-add-book-to-collection)
    - [TC-008: Get Books in Collection](#tc-008-get-books-in-collection)
    - [TC-009: Remove Book from Collection](#tc-009-remove-book-from-collection)
    - [TC-010: Update Collection](#tc-010-update-collection)
    - [TC-011: Delete Collection](#tc-011-delete-collection)
    - [TC-012: Search by Title](#tc-012-search-by-title)
    - [TC-013: Search by ISBN](#tc-013-search-by-isbn)
    - [TC-014: Search by Author](#tc-014-search-by-author)
    - [TC-015: Search by Genre](#tc-015-search-by-genre)
    - [TC-016: Scan Existing ISBN Barcode](#tc-016-scan-existing-isbn-barcode)
    - [TC-017: Scan Unknown ISBN Barcode](#tc-017-scan-unknown-isbn-barcode)
    - [TC-018: Manual ISBN Barcode Generation](#tc-018-manual-isbn-barcode-generation)
    - [TC-019: Scan Random Cover](#tc-019-scan-random-cover)
    - [TC-020: Cover Recognition (Image Match)](#tc-020-cover-recognition-image-match)
    - [TC-021: Get Book Details (Valid)](#tc-021-get-book-details-valid)
    - [TC-022: Get Book Details (Invalid)](#tc-022-get-book-details-invalid)
    - [TC-023: Analytics Overview](#tc-023-analytics-overview)
    - [TC-024: Analytics Timeline](#tc-024-analytics-timeline)
    - [TC-025: Analytics Top Authors](#tc-025-analytics-top-authors)
    - [TC-026: Analytics Top Publishers](#tc-026-analytics-top-publishers)
    - [TC-027: Analytics Language Distribution](#tc-027-analytics-language-distribution)
    - [TC-028: Analytics Page Distribution](#tc-028-analytics-page-distribution)
    - [TC-029: Analytics Metadata Coverage](#tc-029-analytics-metadata-coverage)
    - [TC-030: Analytics Genre Distribution](#tc-030-analytics-genre-distribution)
    - [TC-031: Worker Start](#tc-031-worker-start)
    - [TC-032: Worker Stop](#tc-032-worker-stop)
    - [TC-033: Worker Status](#tc-033-worker-status)
    - [TC-034: Create User (Empty Username)](#tc-034-create-user-empty-username)
    - [TC-035: Add User Scan (Invalid User)](#tc-035-add-user-scan-invalid-user)
    - [TC-036: Add Book to Invalid Collection](#tc-036-add-book-to-invalid-collection)
    - [TC-037: Scan Barcode (No ISBN)](#tc-037-scan-barcode-no-isbn)
    - [TC-038: Cover Recognition (Invalid Image)](#tc-038-cover-recognition-invalid-image)
    - [TC-039: Delete User](#tc-039-delete-user)
    - [TC-040: Cleanup Test Data](#tc-040-cleanup-test-data)
  - [4. Test Execution](#4-test-execution)
  - [5. Traceability Matrix](#5-traceability-matrix)
  - [6. End Matter](#6-end-matter)
    - [6.1 Project Owner](#61-project-owner)
    - [6.2 License](#62-license)
  - [6.3 References](#63-references)

</details>

---

## 1. Introduction

This document enumerates all test cases for the Ridizi platform. Each test case includes a unique ID, description, preconditions, steps, expected results, and links to automated scripts where applicable.

---

## 2. Test Case Table

| ID                                                | Title                             | Area       | Preconditions                  | Steps | Expected Result       | Automated |
| ------------------------------------------------- | --------------------------------- | ---------- | ------------------------------ | ----- | --------------------- | --------- |
| [TC-001](#tc-001-create-user-valid)               | Create User (Valid)               | User       | None                           | 1-3   | User created          | Yes       |
| [TC-002](#tc-002-create-user-duplicate)           | Create User (Duplicate)           | User       | User exists                    | 1-2   | 409 Conflict          | Yes       |
| [TC-003](#tc-003-list-users)                      | List Users                        | User       | At least 1 user                | 1     | User in list          | Yes       |
| [TC-004](#tc-004-add-user-scan)                   | Add User Scan                     | User       | User exists, book exists       | 1-2   | Scan recorded         | Yes       |
| [TC-005](#tc-005-get-recently-scanned-books)      | Get Recently Scanned Books        | User       | User has scans                 | 1     | List returned         | Yes       |
| [TC-006](#tc-006-create-collection)               | Create Collection                 | Collection | User exists                    | 1-2   | Collection created    | Yes       |
| [TC-007](#tc-007-add-book-to-collection)          | Add Book to Collection            | Collection | Collection exists, book exists | 1-2   | Book added            | Yes       |
| [TC-008](#tc-008-get-books-in-collection)         | Get Books in Collection           | Collection | Collection has books           | 1     | Book in list          | Yes       |
| [TC-009](#tc-009-remove-book-from-collection)     | Remove Book from Collection       | Collection | Book in collection             | 1     | Book removed          | Yes       |
| [TC-010](#tc-010-update-collection)               | Update Collection                 | Collection | Collection exists              | 1-2   | Collection updated    | Yes       |
| [TC-011](#tc-011-delete-collection)               | Delete Collection                 | Collection | Collection exists              | 1     | Collection deleted    | Yes       |
| [TC-012](#tc-012-search-by-title)                 | Search by Title                   | Search     | Books in DB                    | 1     | Results found         | Yes       |
| [TC-013](#tc-013-search-by-isbn)                  | Search by ISBN                    | Search     | Book exists                    | 1     | Book found            | Yes       |
| [TC-014](#tc-014-search-by-author)                | Search by Author                  | Search     | Author exists                  | 1     | Results found         | Yes       |
| [TC-015](#tc-015-search-by-genre)                 | Search by Genre                   | Search     | Genre exists                   | 1     | Results found         | Yes       |
| [TC-016](#tc-016-scan-existing-isbn-barcode)      | Scan Existing ISBN Barcode        | Scan       | Book exists                    | 1-2   | Already in DB         | Yes       |
| [TC-017](#tc-017-scan-unknown-isbn-barcode)       | Scan Unknown ISBN Barcode         | Scan       | ISBN not in DB                 | 1-2   | Queued for processing | Yes       |
| [TC-018](#tc-018-manual-isbn-barcode-generation)  | Manual ISBN Barcode Generation    | Scan       | None                           | 1-2   | Barcode image         | Yes       |
| [TC-019](#tc-019-scan-random-cover)               | Scan Random Cover                 | Scan       | Cover exists                   | 1-2   | Match found           | Yes       |
| [TC-020](#tc-020-cover-recognition-image-match)   | Cover Recognition (Image Match)   | Scan       | Cover exists                   | 1-2   | Match found           | Yes       |
| [TC-021](#tc-021-get-book-details-valid)          | Get Book Details (Valid)          | Book       | Book exists                    | 1     | Details returned      | Yes       |
| [TC-022](#tc-022-get-book-details-invalid)        | Get Book Details (Invalid)        | Book       | Book does not exist            | 1     | 404 Not Found         | Yes       |
| [TC-023](#tc-023-analytics-overview)              | Analytics Overview                | Analytics  | Data exists                    | 1     | Stats returned        | Yes       |
| [TC-024](#tc-024-analytics-timeline)              | Analytics Timeline                | Analytics  | Data exists                    | 1     | Timeline data         | Yes       |
| [TC-025](#tc-025-analytics-top-authors)           | Analytics Top Authors             | Analytics  | Data exists                    | 1     | Author stats          | Yes       |
| [TC-026](#tc-026-analytics-top-publishers)        | Analytics Top Publishers          | Analytics  | Data exists                    | 1     | Publisher stats       | Yes       |
| [TC-027](#tc-027-analytics-language-distribution) | Analytics Language Distribution   | Analytics  | Data exists                    | 1     | Language stats        | Yes       |
| [TC-028](#tc-028-analytics-page-distribution)     | Analytics Page Distribution       | Analytics  | Data exists                    | 1     | Page stats            | Yes       |
| [TC-029](#tc-029-analytics-metadata-coverage)     | Analytics Metadata Coverage       | Analytics  | Data exists                    | 1     | Coverage stats        | Yes       |
| [TC-030](#tc-030-analytics-genre-distribution)    | Analytics Genre Distribution      | Analytics  | Data exists                    | 1     | Genre stats           | Yes       |
| [TC-031](#tc-031-worker-start)                    | Worker Start                      | Worker     | Worker registered              | 1     | Worker started        | Yes       |
| [TC-032](#tc-032-worker-stop)                     | Worker Stop                       | Worker     | Worker running                 | 1     | Worker stopped        | Yes       |
| [TC-033](#tc-033-worker-status)                   | Worker Status                     | Worker     | Worker registered              | 1     | Status returned       | Yes       |
| [TC-034](#tc-034-create-user-empty-username)      | Create User (Empty Username)      | Error      | None                           | 1     | 400 Bad Request       | Yes       |
| [TC-035](#tc-035-add-user-scan-invalid-user)      | Add User Scan (Invalid User)      | Error      | User does not exist            | 1     | 404 Not Found         | Yes       |
| [TC-036](#tc-036-add-book-to-invalid-collection)  | Add Book to Invalid Collection    | Error      | Collection missing             | 1     | 404 Not Found         | Yes       |
| [TC-037](#tc-037-scan-barcode-no-isbn)            | Scan Barcode (No ISBN)            | Error      | None                           | 1     | 400 Bad Request       | Yes       |
| [TC-038](#tc-038-cover-recognition-invalid-image) | Cover Recognition (Invalid Image) | Error      | None                           | 1     | 400 Bad Request       | Yes       |
| [TC-039](#tc-039-delete-user)                     | Delete User                       | User       | User exists                    | 1-2   | User deleted          | Yes       |
| [TC-040](#tc-040-cleanup-test-data)               | Cleanup Test Data                 | Cleanup    | Test data exists               | 1     | Data cleaned          | Yes       |

---

## 3. Test Case Detail

### TC-001: Create User (Valid)
- **Area:** User
- **Preconditions:** None
- **Steps:**
  1. Send POST request to `/admin/api/users` with a unique username.
- **Expected Result:**  
  - User is created successfully (201).
  - Response contains user ID and username.
- **Automated:** Yes ([testCases.ts](../code/Backend/admin_ui/src/testing/testCases.ts))

---

### TC-002: Create User (Duplicate)
- **Area:** User
- **Preconditions:** User with the same username already exists.
- **Steps:**
  1. Send POST request to `/admin/api/users` with a username.
  2. Send POST request again with the same username.
- **Expected Result:**  
  - Second request returns 409 Conflict.
  - Error message indicates duplicate username.
- **Automated:** Yes

---

### TC-003: List Users
- **Area:** User
- **Preconditions:** At least one user exists.
- **Steps:**
  1. Send GET request to `/admin/api/users`.
- **Expected Result:**  
  - Response contains a list of users.
  - Newly created user appears in the list.
- **Automated:** Yes

---

### TC-004: Add User Scan
- **Area:** User
- **Preconditions:** User exists, book exists.
- **Steps:**
  1. Send POST request to `/admin/api/user_scans` with username and ISBN.
- **Expected Result:**  
  - Scan is recorded (201).
  - Response indicates success.
- **Automated:** Yes

---

### TC-005: Get Recently Scanned Books
- **Area:** User
- **Preconditions:** User has at least one scan.
- **Steps:**
  1. Send GET request to `/admin/api/recently_scanned/<username>`.
- **Expected Result:**  
  - Response contains a list of scanned books with timestamps.
- **Automated:** Yes

---

### TC-006: Create Collection
- **Area:** Collection
- **Preconditions:** User exists.
- **Steps:**
  1. Send POST request to `/api/collections/<username>` with collection name and icon.
- **Expected Result:**  
  - Collection is created (201).
  - Response contains collection ID, name, and icon.
- **Automated:** Yes

---

### TC-007: Add Book to Collection
- **Area:** Collection
- **Preconditions:** Collection exists, book exists.
- **Steps:**
  1. Send POST request to `/api/collections/<username>/<collection_id>/add` with ISBN.
- **Expected Result:**  
  - Book is added to collection (201).
  - Response indicates success.
- **Automated:** Yes

---

### TC-008: Get Books in Collection
- **Area:** Collection
- **Preconditions:** Collection has at least one book.
- **Steps:**
  1. Send GET request to `/api/collections/<collection_id>/books`.
- **Expected Result:**  
  - Response contains a list of books in the collection.
- **Automated:** Yes

---

### TC-009: Remove Book from Collection
- **Area:** Collection
- **Preconditions:** Book is in the collection.
- **Steps:**
  1. Send DELETE request to `/api/collections/<collection_id>/books/<isbn>`.
- **Expected Result:**  
  - Book is removed from collection (200).
- **Automated:** Yes

---

### TC-010: Update Collection
- **Area:** Collection
- **Preconditions:** Collection exists.
- **Steps:**
  1. Send PUT request to `/api/collections/<username>/<collection_id>` with new name and icon.
- **Expected Result:**  
  - Collection is updated (200).
  - Response contains updated name and icon.
- **Automated:** Yes

---

### TC-011: Delete Collection
- **Area:** Collection
- **Preconditions:** Collection exists.
- **Steps:**
  1. Send DELETE request to `/api/collections/<username>/<collection_id>`.
- **Expected Result:**  
  - Collection is deleted (200).
- **Automated:** Yes

---

### TC-012: Search by Title
- **Area:** Search
- **Preconditions:** Books exist in the database.
- **Steps:**
  1. Send GET request to `/api/search?q=<partial_title>`.
- **Expected Result:**  
  - Response contains books matching the title.
- **Automated:** Yes

---

### TC-013: Search by ISBN
- **Area:** Search
- **Preconditions:** Book exists.
- **Steps:**
  1. Send GET request to `/api/search?q=<isbn>`.
- **Expected Result:**  
  - Response contains the book with the given ISBN.
- **Automated:** Yes

---

### TC-014: Search by Author
- **Area:** Search
- **Preconditions:** Author exists.
- **Steps:**
  1. Send GET request to `/api/search?q=<author_name>`.
- **Expected Result:**  
  - Response contains books by the author.
- **Automated:** Yes

---

### TC-015: Search by Genre
- **Area:** Search
- **Preconditions:** Genre exists.
- **Steps:**
  1. Send GET request to `/api/search?q=<genre>`.
- **Expected Result:**  
  - Response contains books in the genre.
- **Automated:** Yes

---

### TC-016: Scan Existing ISBN Barcode
- **Area:** Scan
- **Preconditions:** Book exists.
- **Steps:**
  1. Send POST request to `/barcode` with existing ISBN.
- **Expected Result:**  
  - Response indicates book is already in dataset.
- **Automated:** Yes

---

### TC-017: Scan Unknown ISBN Barcode
- **Area:** Scan
- **Preconditions:** ISBN not in database.
- **Steps:**
  1. Send POST request to `/barcode` with unknown ISBN.
- **Expected Result:**  
  - Response indicates book is queued for processing.
- **Automated:** Yes

---

### TC-018: Manual ISBN Barcode Generation
- **Area:** Scan
- **Preconditions:** None.
- **Steps:**
  1. Send GET request to `/admin/api/testing/barcode/<isbn>`.
- **Expected Result:**  
  - Response is a PNG barcode image.
- **Automated:** Yes

---

### TC-019: Scan Random Cover
- **Area:** Scan
- **Preconditions:** Cover image exists.
- **Steps:**
  1. Upload a real cover image to `/match`.
- **Expected Result:**  
  - Response contains a match for the ISBN.
- **Automated:** Yes

---

### TC-020: Cover Recognition (Image Match)
- **Area:** Scan
- **Preconditions:** Cover image exists.
- **Steps:**
  1. Upload multiple cover images to `/match`.
- **Expected Result:**  
  - Each image is matched to the correct ISBN.
- **Automated:** Yes

---

### TC-021: Get Book Details (Valid)
- **Area:** Book
- **Preconditions:** Book exists.
- **Steps:**
  1. Send GET request to `/api/book/<isbn>`.
- **Expected Result:**  
  - Response contains detailed book information.
- **Automated:** Yes

---

### TC-022: Get Book Details (Invalid)
- **Area:** Book
- **Preconditions:** Book does not exist.
- **Steps:**
  1. Send GET request to `/api/book/<invalid_isbn>`.
- **Expected Result:**  
  - Response is 404 Not Found.
- **Automated:** Yes

---

### TC-023: Analytics Overview
- **Area:** Analytics
- **Preconditions:** Data exists.
- **Steps:**
  1. Send GET request to `/admin/api/analytics/overview`.
- **Expected Result:**  
  - Response contains global dataset statistics.
- **Automated:** Yes

---

### TC-024: Analytics Timeline
- **Area:** Analytics
- **Preconditions:** Data exists.
- **Steps:**
  1. Send GET request to `/admin/api/analytics/timeline`.
- **Expected Result:**  
  - Response contains publication timeline data.
- **Automated:** Yes

---

### TC-025: Analytics Top Authors
- **Area:** Analytics
- **Preconditions:** Data exists.
- **Steps:**
  1. Send GET request to `/admin/api/analytics/authors?limit=10`.
- **Expected Result:**  
  - Response contains top authors by book count.
- **Automated:** Yes

---

### TC-026: Analytics Top Publishers
- **Area:** Analytics
- **Preconditions:** Data exists.
- **Steps:**
  1. Send GET request to `/admin/api/analytics/publishers?limit=10`.
- **Expected Result:**  
  - Response contains top publishers by book count.
- **Automated:** Yes

---

### TC-027: Analytics Language Distribution
- **Area:** Analytics
- **Preconditions:** Data exists.
- **Steps:**
  1. Send GET request to `/admin/api/analytics/languages`.
- **Expected Result:**  
  - Response contains language distribution.
- **Automated:** Yes

---

### TC-028: Analytics Page Distribution
- **Area:** Analytics
- **Preconditions:** Data exists.
- **Steps:**
  1. Send GET request to `/admin/api/analytics/pages`.
- **Expected Result:**  
  - Response contains page statistics and distribution.
- **Automated:** Yes

---

### TC-029: Analytics Metadata Coverage
- **Area:** Analytics
- **Preconditions:** Data exists.
- **Steps:**
  1. Send GET request to `/admin/api/analytics/metadata-coverage`.
- **Expected Result:**  
  - Response contains metadata coverage statistics.
- **Automated:** Yes

---

### TC-030: Analytics Genre Distribution
- **Area:** Analytics
- **Preconditions:** Data exists.
- **Steps:**
  1. Send GET request to `/admin/api/analytics/genres`.
- **Expected Result:**  
  - Response contains genre distribution.
- **Automated:** Yes

---

### TC-031: Worker Start
- **Area:** Worker
- **Preconditions:** Worker is registered.
- **Steps:**
  1. Send POST request to `/admin/api/workers/book_worker/start`.
- **Expected Result:**  
  - Worker starts successfully (200).
- **Automated:** Yes

---

### TC-032: Worker Stop
- **Area:** Worker
- **Preconditions:** Worker is running.
- **Steps:**
  1. Send POST request to `/admin/api/workers/book_worker/stop`.
- **Expected Result:**  
  - Worker stops successfully (200).
- **Automated:** Yes

---

### TC-033: Worker Status
- **Area:** Worker
- **Preconditions:** Worker is registered.
- **Steps:**
  1. Send GET request to `/admin/api/workers/status`.
- **Expected Result:**  
  - Response contains status of all workers.
- **Automated:** Yes

---

### TC-034: Create User (Empty Username)
- **Area:** Error
- **Preconditions:** None.
- **Steps:**
  1. Send POST request to `/admin/api/users` with empty username.
- **Expected Result:**  
  - Response is 400 Bad Request.
- **Automated:** Yes

---

### TC-035: Add User Scan (Invalid User)
- **Area:** Error
- **Preconditions:** User does not exist.
- **Steps:**
  1. Send POST request to `/admin/api/user_scans` with invalid username.
- **Expected Result:**  
  - Response is 404 Not Found or appropriate error.
- **Automated:** Yes

---

### TC-036: Add Book to Invalid Collection
- **Area:** Error
- **Preconditions:** Collection does not exist.
- **Steps:**
  1. Send POST request to `/api/collections/<username>/<invalid_collection_id>/add` with ISBN.
- **Expected Result:**  
  - Response is 404 Not Found.
- **Automated:** Yes

---

### TC-037: Scan Barcode (No ISBN)
- **Area:** Error
- **Preconditions:** None.
- **Steps:**
  1. Send POST request to `/barcode` without ISBN.
- **Expected Result:**  
  - Response is 400 Bad Request.
- **Automated:** Yes

---

### TC-038: Cover Recognition (Invalid Image)
- **Area:** Error
- **Preconditions:** None.
- **Steps:**
  1. Upload a non-image file to `/match`.
- **Expected Result:**  
  - Response is 400 Bad Request.
- **Automated:** Yes

---

### TC-039: Delete User
- **Area:** User
- **Preconditions:** User exists.
- **Steps:**
  1. Send DELETE request to `/admin/api/users/<username>`.
- **Expected Result:**  
  - User is deleted (200).
  - User no longer appears in user list.
- **Automated:** Yes

---

### TC-040: Cleanup Test Data
- **Area:** Cleanup
- **Preconditions:** Test data exists.
- **Steps:**
  1. Run cleanup script to remove test users, collections, and ISBNs.
- **Expected Result:**  
  - All test data is removed.
- **Automated:** Yes

---

## 4. Test Execution

- All automated test cases are implemented in [`testCases.ts`](../code/Backend/admin_ui/src/testing/testCases.ts).
- Manual test results and notes are tracked in this document.
- Test execution is performed via the admin UI testing suite and CI pipeline.

---

## 5. Traceability Matrix

| Requirement (FS)        | Test Case IDs                                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User registration       | [TC-001](#tc-001-create-user-valid), [TC-002](#tc-002-create-user-duplicate), [TC-034](#tc-034-create-user-empty-username), [TC-039](#tc-039-delete-user) |
| Book scanning (cover)   | [TC-019](#tc-019-scan-random-cover), [TC-020](#tc-020-cover-recognition-image-match), [TC-038](#tc-038-cover-recognition-invalid-image)                   |
| Book scanning (barcode) | [TC-016](#tc-016-scan-existing-isbn-barcode), [TC-017](#tc-017-scan-unknown-isbn-barcode), [TC-037](#tc-037-scan-barcode-no-isbn)                         |
| Collections management  | [TC-006](#tc-006-create-collection) – [TC-011](#tc-011-delete-collection), [TC-036](#tc-036-add-book-to-invalid-collection)                               |
| Search                  | [TC-012](#tc-012-search-by-title) – [TC-015](#tc-015-search-by-genre)                                                                                     |
| Book details            | [TC-021](#tc-021-get-book-details-valid), [TC-022](#tc-022-get-book-details-invalid)                                                                      |
| Analytics               | [TC-023](#tc-023-analytics-overview) – [TC-030](#tc-030-analytics-genre-distribution)                                                                     |
| Worker management       | [TC-031](#tc-031-worker-start) – [TC-033](#tc-033-worker-status)                                                                                          |
| Error handling          | [TC-034](#tc-034-create-user-empty-username) – [TC-038](#tc-038-cover-recognition-invalid-image)                                                          |
| Data cleanup            | [TC-040](#tc-040-cleanup-test-data)                                                                                                                       |

---

## 6. End Matter

### 6.1 Project Owner

<div>
  <img src="https://avatars.githubusercontent.com/u/91249863?v=4" alt="Pierre GORIN" width="100">
  <p><strong>Pierre GORIN</strong></p>
  <p>Founder of Ridizi</p>
  <p>
    <a href="https://github.com/Pierre2103" target="_blank">GitHub</a> |
    <a href="https://www.linkedin.com/in/pierre-gorin-61a784221/" target="_blank">LinkedIn</a>
  </p>
</div>

---

### 6.2 License

This project is licensed under the MIT License – see the [LICENSE](../LICENSE.md) file for details.

---

## 6.3 References

- [Functional Specifications](./FunctionalSpecifications.md)
- [Technical Specifications](./TechnicalSpecifications.md)
- [Test Plan](./TestPlan.md)
- [Automated Test Suite](../code/Backend/admin_ui/src/testing/testCases.ts)
