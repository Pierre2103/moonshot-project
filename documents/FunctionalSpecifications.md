<div align="center">

<img src="images/logo.png" alt="Ridizi Logo" width="400">

---

# Functional Specifications

**Title:** Ridizi – Moonshot Project

**Author:** Pierre GORIN

**Created on:** Februrary 21<sup>st</sup>, 2024

**Last updated:** June 3<sup>rd</sup>, 2025

</div>

<br><details>

<summary><strong>Table of Contents (Click to expand)</strong></summary>

- [Functional Specifications](#functional-specifications)
  - [1. Introduction](#1-introduction)
    - [1.1 Overview](#11-overview)
    - [1.2 Project Definition](#12-project-definition)
      - [1.2.1 Purpose](#121-purpose)
      - [1.2.2 Scope](#122-scope)
      - [1.2.3 Deliverables](#123-deliverables)
    - [1.3 Project Plan](#13-project-plan)
      - [1.3.1 Milestones](#131-milestones)
      - [1.3.2 Resources](#132-resources)
      - [1.3.3 Assumptions and Constraints](#133-assumptions-and-constraints)
  - [2. Personas](#2-personas)
  - [3. Use Cases](#3-use-cases)
    - [3.1 Use Cases List](#31-use-cases-list)
    - [3.2 Use Cases Descriptions](#32-use-cases-descriptions)
      - [3.2.1 User Registration and Login](#321-user-registration-and-login)
      - [3.2.2 Scan Book Cover for Identification](#322-scan-book-cover-for-identification)
      - [3.2.3 Scan ISBN Barcode](#323-scan-isbn-barcode)
      - [3.2.4 Create and Manage Collections](#324-create-and-manage-collections)
      - [3.2.5 Search Books by Title or Genre](#325-search-books-by-title-or-genre)
      - [3.2.6 View Book Details](#326-view-book-details)
      - [3.2.7 Admin Dashboard – Analytics Overview](#327-admin-dashboard--analytics-overview)
      - [3.2.8 Worker Management](#328-worker-management)
      - [3.2.9 Error Handling and Notifications](#329-error-handling-and-notifications)
  - [4. Features](#4-features)
    - [4.1 Features List](#41-features-list)
    - [4.2 Features Descriptions](#42-features-descriptions)
      - [4.2.1 User Authentication](#421-user-authentication)
      - [4.2.2 Cover Scanning (AI Service)](#422-cover-scanning-ai-service)
      - [4.2.3 Barcode Scanning](#423-barcode-scanning)
      - [4.2.4 Collections CRUD](#424-collections-crud)
      - [4.2.5 Book Search](#425-book-search)
      - [4.2.6 Book Details Display](#426-book-details-display)
      - [4.2.7 Admin Analytics](#427-admin-analytics)
      - [4.2.8 Worker Management Interface](#428-worker-management-interface)
      - [4.2.9 Error Handling \& Notifications](#429-error-handling--notifications)
  - [5. Technology \& Libraries Used](#5-technology--libraries-used)
    - [5.1 Frontend](#51-frontend)
    - [5.2 Backend](#52-backend)
    - [5.3 AI Service](#53-ai-service)
    - [5.4 Database](#54-database)
    - [5.5 Testing](#55-testing)
  - [6. End Matter](#6-end-matter)
    - [6.1 Project Owner](#61-project-owner)
    - [6.2 License](#62-license)
    - [6.3 Glossary](#63-glossary)

</details>

---

## 1. Introduction

### 1.1 Overview

Ridizi is a cross‐platform book‐management solution that enables users to scan book covers or ISBN barcodes, automatically retrieve metadata via an AI‐powered service, organize scanned items into collections, and view detailed analytics through an admin dashboard. The platform consists of:

* **Mobile app** for end users to scan, search, and manage personal collections.
* **Backend API** exposing REST endpoints for authentication, book lookup, collection management, and analytics.
* **AI service** for cover recognition and metadata enrichment.
* **Admin dashboard** for operational metrics, worker management, and system health.
* **Database** for persistent storage of users, books, collections, and logs.

This functional specification describes all required behaviors, features, and user workflows to ensure a unified vision for the Ridizi platform.

### 1.2 Project Definition

#### 1.2.1 Purpose

The purpose of Ridizi is to provide a seamless, AI-driven experience for book recognition and organization. By combining cover recognition with barcode scanning, users can add physical books to their digital collections in just a few taps.

#### 1.2.2 Scope

| Feature                                    | Description                                                                              | In scope | Out of scope |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- | -------- | ------------ |
| Cover Scanning (AI Service Integration)    | Capture a book‐cover image, send it to AI service (CLIP + FAISS), and retrieve metadata. | ✅        |              |
| Barcode Book Adding (ISBN13)               | Add a book by entering or scanning its ISBN‐13 code.                                     | ✅        |              |
| API‐First Design (REST)                    | Expose all functionality via REST endpoints.                                             | ✅        |              |
| Mobile & Web UI (Responsive, Mobile‐First) | Responsive design, prioritizing mobile, also works on the web.                           | ✅        |              |
| Admin Analytics Dashboard                  | Dashboard with scan counts, popular genres, active users, and service health.            | ✅        |              |
| Error Handling                             | Log and handle errors gracefully (AI failure, API failures, etc.).                       | ✅        |              |
| Simple User Authentication                 | Only username, no password or email (MVP).                                               | ✅        |              |
| Collections CRUD                           | Create, read, update, and delete collections; assign books.                              | ✅        |              |
| Book Search (Title, Author, Genre, ISBN)   | Search within the collection or public index.                                            | ✅        |              |
| Book Details Display (Metadata + Notes)    | Show all metadata and allow user notes.                                                  | ✅        |              |
| User Registration & Authentication         | Complete registration with email and password.                                           |          | ❌            |
| Manual Metadata Entry                      | Allow manual entry of book details.                                                      |          | ❌            |
| Notifications (In‐App or Email)            | Send real‐time notifications to users.                                                   |          | ❌            |
| Offline Mode                               | Allow the app to function without internet connectivity.                                 |          | ❌            |

#### 1.2.3 Deliverables

| Deliverable                               | Link to Document / Directory                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| Functional Specifications (this document) | —                                                                                            |
| Technical Specifications                  | [🔗 TechnicalSpecifications.md](./TechnicalSpecifications.md)                                 |
| Test Plan                                 | [🔗 TestPlan.md](./TestPlan.md)                                                               |
| Test Cases                                | [🔗 TestCases.md](./TestCases.md)                                                             |
| Mobile App (iOS/Android/Web)              | [🔗 Frontend Directory](https://github.com/Pierre2103/moonshot-project/code/Frontend/)        |
| Backend API & AI Service Code             | [🔗 Backend Directory](https://github.com/Pierre2103/moonshot-project/code/Backend/api)       |
| Admin Dashboard Code                      | [🔗 Admin UI Directory](https://github.com/Pierre2103/moonshot-project/code/Backend/ui_admin) |

<!-- | User Manual                               | [🔗 UserManual.md](./UserManual.md)                                                            | -->

---

### 1.3 Project Plan

#### 1.3.1 Milestones

| No. | Milestone                                  | Start Date | End Date   |
| --- | ------------------------------------------ | ---------- | ---------- |
| 1   | Requirements & Specifications              | 21/02/2024 | 03/06/2025 |
| 2   | UI/UX Design & Prototyping                 | 11/03/2024 | 13/07/2024 |
| 3   | Core Backend & AI Service Development      | 03/07/2024 | 02/06/2025 |
| 4   | Core Frontend Implementation & Integration | 16/07/2024 | 01/09/2025 |
| 5   | Testing & Final Integration                | 12/05/2025 | 29/05/2025 |

---

#### 1.3.2 Resources

* **Tools & Services**:
  * Expo (React Native) for the mobile builds.
  * React + Ant Design for the admin dashboard.
  * Flask for the backend.
  * MariaDB for the database.
  * CLIP + FAISS for cover recognition.
  * Postman for API testing.
  * A custom script for automated tests.

---

#### 1.3.3 Assumptions and Constraints

**Assumptions:**

* Users have smartphones with camera access and a stable internet connection.
* Third-party book metadata APIs (e.g., Open Library, Google Books) remain available.
* AI model (CLIP + FAISS) will maintain ≥ 90% accuracy on cover recognition.
* The system will run on a local network for the MVP.

**Constraints:**

* Must comply with GDPR for user data management (no PII stored beyond necessity).
* The initial version is limited to ISBN‐13 barcodes (no proprietary barcodes).
* Mobile apps will require internet connectivity for cover recognition and metadata fetch.
* The admin dashboard is accessible only to authorized roles.
* Performance target: cover recognition inference < 2 seconds per image.

---

## 2. Personas

| The Book Collector                                                                                                                                                                                                                                                         | The Librarian                                                                                                                                                                                                                                                  | The Casual Reader                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ![Placeholder](images/functional/Persona_BookCollector.png)                                                                                                                                                                                                                | ![Placeholder](images/functional/Persona_Librarian.png)                                                                                                                                                                                                        | ![Placeholder](images/functional/Persona_CasualReader.png)                                                                                                                                                                                 |
| **Name:** Alex Martin                                                                                                                                                                                                                                                      | **Name:** Sofia Patel                                                                                                                                                                                                                                          | **Name:** Jade Nguyen                                                                                                                                                                                                                      |
| **Age:** 35                                                                                                                                                                                                                                                                | **Age:** 42                                                                                                                                                                                                                                                    | **Age:** 28                                                                                                                                                                                                                                |
| **Occupation:** Graphic Designer                                                                                                                                                                                                                                           | **Occupation:** Community Librarian                                                                                                                                                                                                                            | **Occupation:** Marketing Specialist                                                                                                                                                                                                       |
| **Tech Savviness:** ⭐⭐⭐⭐                                                                                                                                                                                                                                                   | **Tech Savviness:** ⭐⭐⭐                                                                                                                                                                                                                                        | **Tech Savviness:** ⭐⭐⭐                                                                                                                                                                                                                    |
| **Background:** Alex owns a personal library of over 500 books. He frequently acquires secondhand books at thrift stores and wants an easy way to catalog and organize them.                                                                                               | **Background:** Sofia manages a small community library. She oversees the acquisition, classification, and tracking of new donations and periodically updates catalogs.                                                                                        | **Background:** Jade enjoys reading bestsellers and often lends books to friends. She wants a simple mobile app to keep track of which books she owns, which ones are loaned out, and basic reading stats.                                 |
| **Goals:** <br> 1️⃣ Quickly add new books by simply snapping a photo of the cover or scanning the barcode. <br> 2️⃣ Organize books into thematic collections (e.g., “Art History,” “Graphic Novels”). <br> 3️⃣ Track reading progress and add personal notes to each book entry. | **Goals:** <br> 1️⃣ Use Ridizi’s batch scan feature (worker processes) to process large donations overnight. <br> 2️⃣ Monitor scan success/failure rates and reprocess items via the admin dashboard. <br> 3️⃣ Generate simple reports showing new entries by genre. | **Goals:** <br> 1️⃣ Add newly purchased bestsellers by scanning barcodes at the bookstore. <br> 2️⃣ Quickly search her “To Read” and “Already Read” collections. <br> 3️⃣ Get book recommendations based on her collection’s genre distribution. |
| **Pain Points:** <br> 1️⃣ Manual entry of book metadata is time‐consuming. <br> 2️⃣ Lost or incomplete metadata when buying used books without dust jackets.                                                                                                                   | **Pain Points:** <br> 1️⃣ Manual post-processing of scanned books can create backlogs. <br> 2️⃣ Occasional AI misidentification of cover art leads to incorrect metadata.                                                                                          | **Pain Points:** <br> 1️⃣ Overwhelmed by complex UIs—prefers a clean, straightforward experience. <br> 2️⃣ Doesn’t need admin features, just basic scanning and searching.                                                                     |

_Images Generated Using [ChatGPT](https://chat.openai.com/)._

---

## 3. Use Cases

### 3.1 Use Cases List

| ID  | Use Case Name                        |
| --- | ------------------------------------ |
| 1   | User Registration and Login          |
| 2   | Scan Book Cover for Identification   |
| 3   | Scan ISBN Barcode                    |
| 4   | Create and Manage Collections        |
| 5   | Search Books by Title or Genre       |
| 6   | View Book Details                    |
| 7   | Admin Dashboard – Analytics Overview |
| 8   | Worker Management                    |
| 9   | Error Handling and Notifications     |

---

### 3.2 Use Cases Descriptions

#### 3.2.1 User Registration and Login

| Use Case Name       | User Registration and Login                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Actors**          | End User (Mobile/Web), Backend API                                                                                                                                                                                                                                                                                                                                   |
| **Description**     | A new user registers an account or an existing user logs in to Ridizi.                                                                                                                                                                                                                                                                                               |
| **Pre-conditions**  | None or user has internet connectivity.                                                                                                                                                                                                                                                                                                                              |
| **Post-conditions** | User is authenticated and receives a JWT token for subsequent requests.                                                                                                                                                                                                                                                                                              |
| **Normal Flow**     | 1. The user opens the mobile/web app.  <br> 2. The user clicks “Register” or “Login.”  <br> 3. Registration: user enters email, password, and taps “Submit.”  <br> 4. The system sends a verification email (registration) or validates credentials (login).  <br> 5. On success, backend issues a JWT.  <br> 6. The app stores the JWT for authenticated API calls. |

#### 3.2.2 Scan Book Cover for Identification

| Use Case Name       | Scan Book Cover for Identification                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Actors**          | End User (Mobile/Web), AI Service (CLIP + FAISS), Backend API                                                                                                                                                                                                                                                                                                                                                                                               |
| **Description**     | The user photographs a book cover; AI service returns metadata.                                                                                                                                                                                                                                                                                                                                                                                             |
| **Pre-conditions**  | User is authenticated; camera permission granted.                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Post-conditions** | Metadata (title, author, ISBN, cover image URL) is returned to the app.                                                                                                                                                                                                                                                                                                                                                                                     |
| **Normal Flow**     | 1. The user opens the “Scan Cover” screen.  <br> 2. The user points the camera at the book cover and taps “Capture.”  <br> 3. The app uploads the image to `/api/v1/scan/cover`.  <br> 4. Backend forwards the image to AI service.  <br> 5. AI service returns best‐match metadata.  <br> 6. Backend stores or returns metadata; the app displays results for confirmation.  <br> 7. The user confirms or edits details before saving to their collection. |

#### 3.2.3 Scan ISBN Barcode

| Use Case Name       | Scan ISBN Barcode                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Actors**          | End User (Mobile/Web), Backend API                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Description**     | The user scans an ISBN barcode; the system fetches metadata from an external API.                                                                                                                                                                                                                                                                                                                                                                     |
| **Pre-conditions**  | User is authenticated; camera permission granted.                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Post-conditions** | Book metadata is retrieved and displayed.                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Normal Flow**     | 1. The user selects “Scan Barcode.”  <br> 2. The app launches the barcode scanner.  <br> 3. The user aligns the ISBN barcode in view; scanner reads the code.  <br> 4. The app sends the ISBN to `/api/v1/scan/barcode`.  <br> 5. Backend queries third‐party book metadata API (e.g., Open Library).  <br> 6. Metadata is returned; the app displays details for user confirmation.  <br> 7. The user confirms to save the book to their collection. |

#### 3.2.4 Create and Manage Collections

| Use Case Name       | Create and Manage Collections                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Actors**          | End User (Mobile/Web), Backend API                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Description**     | The user creates custom collections (e.g., “Favorites,” “To Read”), and can add/remove books.                                                                                                                                                                                                                                                                                                                                                                |
| **Pre-conditions**  | User is authenticated.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Post-conditions** | Updated collection state is persisted in the database.                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Normal Flow**     | 1. The user navigates to “My Collections.”  <br> 2. The user taps “Create New Collection,” enters a name, and taps “Save.”  <br> 3. Backend creates a collection record.  <br> 4. To add a book: user selects a book, chooses “Add to Collection,” picks a collection, and confirms.  <br> 5. Backend updates the collection‐book relationship.  <br> 6. To remove a book: user chooses “Remove from Collection,” confirms, and backend updates accordingly. |

#### 3.2.5 Search Books by Title or Genre

| Use Case Name       | Search Books by Title or Genre                                                                                                                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Actors**          | End User (Mobile/Web), Backend API                                                                                                                                                                                                                                                                                             |
| **Description**     | The user enters a search query; system returns matching books from their collection or public index.                                                                                                                                                                                                                           |
| **Pre-conditions**  | User is authenticated (for personal collection searches).                                                                                                                                                                                                                                                                      |
| **Post-conditions** | Matching list of books is displayed.                                                                                                                                                                                                                                                                                           |
| **Normal Flow**     | 1. The user taps on the search bar and types “J. K. Rowling” or “Fantasy.”  <br> 2. The app sends a GET request to `/api/v1/search?query=…&scope=personal/public`.  <br> 3. Backend searches collection and/or global index, returns paginated results.  <br> 4. The app displays results with cover image and basic metadata. |

#### 3.2.6 View Book Details

| Use Case Name       | View Book Details                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Actors**          | End User (Mobile/Web), Backend API                                                                                                                                                                                                                                                                                                                                                   |
| **Description**     | The user selects a book to view more detailed information and any personal notes.                                                                                                                                                                                                                                                                                                    |
| **Pre-conditions**  | Book exists in user’s collection.                                                                                                                                                                                                                                                                                                                                                    |
| **Post-conditions** | Detailed view shows full metadata, cover image, user notes, and related suggestions.                                                                                                                                                                                                                                                                                                 |
| **Normal Flow**     | 1. The user taps on a book in their collection or search results.  <br> 2. App requests `GET /api/v1/books/{bookId}`.  <br> 3. Backend returns detailed metadata (description, publish date, publisher, page count), user notes, and “Related Books” suggestions.  <br> 4. The app displays the information, allowing the user to edit notes or move the book to another collection. |

#### 3.2.7 Admin Dashboard – Analytics Overview

| Use Case Name       | Admin Dashboard – Analytics Overview                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Actors**          | Administrator, Backend API                                                                                                                                                                                                           |
| **Description**     | Admin views high‐level metrics: total scans (cover vs. barcode), active users, daily requests, and AI service health.                                                                                                                |
| **Pre-conditions**  | Admin is authenticated and has the “Administrator” role.                                                                                                                                                                             |
| **Post-conditions** | Dashboard populates with real‐time charts and health indicators.                                                                                                                                                                     |
| **Normal Flow**     | 1. Admin logs into `/admin`.  <br> 2. Backend validates admin JWT and role.  <br> 3. Backend aggregates metrics (scan counts, user sign-ups, failed requests).  <br> 4. Dashboard uses React + Ant Design charts to display metrics: |

* **Total Scans (Past 30 Days)** (cover vs. barcode)
* **Monthly Active Users**
* **AI Service Latency & Error Rate**
* **Database Error Rate** <br> 5. Admin can filter by date range or export CSV of aggregated data.  |

#### 3.2.8 Worker Management

| Use Case Name       | Worker Management                                                                                                                                                                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Actors**          | Administrator, Backend API                                                                                                                                                                                                                                                                                                               |
| **Description**     | Admin can view status of background workers (e.g., batch cover indexer, email sender) and start/stop them.                                                                                                                                                                                                                               |
| **Pre-conditions**  | Admin is authenticated with “Administrator” role.                                                                                                                                                                                                                                                                                        |
| **Post-conditions** | Worker processes are updated (started/stopped/restarted) as requested.                                                                                                                                                                                                                                                                   |
| **Normal Flow**     | 1. Admin navigates to “Worker Management” tab.  <br> 2. Backend returns a list of registered workers with status (running, idle, failed).  <br> 3. Admin clicks “Restart” or “Stop” on a worker.  <br> 4. Backend sends command to orchestrator (e.g., Kubernetes) to manage the worker.  <br> 5. Dashboard updates status in real time. |

#### 3.2.9 Error Handling and Notifications

| Use Case Name       | Error Handling and Notifications                                                                                                                                                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Actors**          | System (Backend, AI Service), Administrator, End User (optional)                                                                                                                                                                                                                                                          |
| **Description**     | When a critical error occurs (e.g., AI service down, metadata fetch fails), the system logs the error and notifies the admin; optionally, displays user-friendly error messages.                                                                                                                                          |
| **Pre-conditions**  | System components are running.                                                                                                                                                                                                                                                                                            |
| **Post-conditions** | Admin receives notification; UI displays relevant error prompts.                                                                                                                                                                                                                                                          |
| **Normal Flow**     | 1. AI service fails to respond within 5 seconds during cover scan.  <br> 2. Backend logs the error and increments failure count.  <br> 3. If failure count > threshold, send an email notification to admin(s).  <br> 4. On user side, the app shows: “Cover recognition temporarily unavailable—please try again later.” |

---

## 4. Features

### 4.1 Features List

| ID  | Feature Name                   |
| --- | ------------------------------ |
| 1   | User Authentication (JWT)      |
| 2   | Cover Scanning (AI Service)    |
| 3   | ISBN Barcode Scanning          |
| 4   | Collections CRUD               |
| 5   | Book Search                    |
| 6   | Book Details Display           |
| 7   | Admin Analytics Dashboard      |
| 8   | Worker Management Interface    |
| 9   | Error Handling & Notifications |
| 10  | Responsive Mobile & Web UI     |

---

### 4.2 Features Descriptions

#### 4.2.1 User Authentication

The system shall allow users to register, log in, and manage their profiles securely using JSON Web Tokens (JWT). Passwords must be hashed (bcrypt) before storing in the database. An email verification step is required for registration.

* **Registration Flow:**

  1. User submits email/password via `POST /api/v1/auth/register`.
  2. Backend generates a verification token and sends email.
  3. User clicks verification link (`GET /api/v1/auth/verify?token=…`), enabling the account.

* **Login Flow:**

  1. User submits credentials via `POST /api/v1/auth/login`.
  2. Backend validates and returns JWT with a 1­hour expiration.

* **Profile Management:**

  * `GET /api/v1/users/me` returns user details.
  * `PUT /api/v1/users/me` updates profile (name, avatar).

**Use Cases:**

* User Registration and Login.

---

#### 4.2.2 Cover Scanning (AI Service)

The system shall enable users to photograph a book cover; the image is sent to an AI service (CLIP + FAISS) which returns the best‐match metadata. The AI service uses a prebuilt index of known book covers; new covers can be added via a background worker.

* **Endpoint:** `POST /api/v1/scan/cover`

* **Payload:** `{ "image": <base64‐encoded> }`

* **Response:**

  ```json
  {
    "bookId": "string",
    "title": "string",
    "author": "string",
    "isbn": "string",
    "coverUrl": "string",
    "confidence": 0.92
  }
  ```

* **Failure Handling:**

  * If confidence < 0.75, return `"uncertain": true` and suggest manual entry.
  * If AI service is down, return `503 Service Unavailable`.

**Use Cases:**

* Scan Book Cover for Identification.

---

#### 4.2.3 Barcode Scanning

The system shall let users scan an ISBN‐13 barcode using the device camera. The scanned code is sent to the backend, which queries a third‐party book metadata API (e.g., Open Library or Google Books) to retrieve book details.

* **Endpoint:** `POST /api/v1/scan/barcode`

* **Payload:** `{ "isbn": "9780143127550" }`

* **Response:**

  ```json
  {
    "bookId": "string",
    "title": "string",
    "author": "string",
    "publishedDate": "YYYY-MM-DD",
    "coverUrl": "string"
  }
  ```

* **Failure Handling:**

  * If external API returns no data, respond with `404 Not Found` plus a prompt for manual entry.
  * If rate‐limited, respond with `429 Too Many Requests`.

**Use Cases:**

* Scan ISBN Barcode.

---

#### 4.2.4 Collections CRUD

Users can organize books into named collections (e.g., “Favorites,” “Sci­Fi Classics”). Each collection belongs to exactly one user and can contain zero or more books.

* **Endpoints:**

  * `POST /api/v1/collections`

    * Payload: `{ "name": "string" }`
    * Response: `{ "collectionId": "string", "name": "string" }`
  * `GET /api/v1/collections`

    * Response: `[ { "collectionId": "string", "name": "string", "bookCount": 5 }, … ]`
  * `PUT /api/v1/collections/{collectionId}`

    * Payload: `{ "name": "New Name" }`
    * Response: updated collection object.
  * `DELETE /api/v1/collections/{collectionId}`

    * Response: `204 No Content`.
  * `POST /api/v1/collections/{collectionId}/books`

    * Payload: `{ "bookId": "string" }`
    * Response: updated list of books in the collection.
  * `DELETE /api/v1/collections/{collectionId}/books/{bookId}`

    * Response: updated list of books.

**Use Cases:**

* Create and Manage Collections.

---

#### 4.2.5 Book Search

Users can search their personal library or the public index by title, author, or genre. Simple full‐text search is implemented on the backend, optionally paginated.

* **Endpoint:** `GET /api/v1/search?query={keyword}&scope={personal|public}&page={n}&limit={m}`

* **Response:**

  ```json
  {
    "totalResults": 123,
    "page": 1,
    "limit": 20,
    "books": [
      {
        "bookId": "string",
        "title": "string",
        "author": "string",
        "coverUrl": "string"
      },
      …
    ]
  }
  ```

* **Filters (optional):**

  * `genre`, `publishedYear`, `language`.

**Use Cases:**

* Search Books by Title or Genre.

---

#### 4.2.6 Book Details Display

For any selected book, the system shall display comprehensive metadata and allow users to add personal notes.

* **Endpoint:** `GET /api/v1/books/{bookId}`

* **Response:**

  ```json
  {
    "bookId": "string",
    "title": "string",
    "author": "string",
    "isbn": "string",
    "description": "string",
    "publishDate": "YYYY-MM-DD",
    "publisher": "string",
    "pageCount": 352,
    "coverUrl": "string",
    "userNotes": "string",
    "relatedBooks": [
      { "bookId": "string", "title": "string", "coverUrl": "string" },
      …
    ]
  }
  ```

* **User Notes:**

  * `PUT /api/v1/books/{bookId}/notes` with `{ "notes": "string" }`.

**Use Cases:**

* View Book Details.

---

#### 4.2.7 Admin Analytics

The admin interface shall provide real‐time visualizations of key metrics:

* **Total Scans (Last 30 Days):** Cover vs. barcode breakdown (bar chart).

* **Monthly Active Users:** Line chart plotting daily active users.

* **AI Service Health:**

  * Average latency (ms)
  * Error rate (%)

* **Database Metrics:**

  * Failed queries per hour
  * Uptime percentage

* **Endpoints (examples):**

  * `GET /api/v1/admin/analytics/scan-stats?range=30d`
  * `GET /api/v1/admin/analytics/user-stats?range=30d`
  * `GET /api/v1/admin/analytics/service-health`

**Use Cases:**

* Admin Dashboard – Analytics Overview.

---

#### 4.2.8 Worker Management Interface

Administrators need to manage background workers responsible for:

* **Cover Indexer:** Periodically ingest new cover images into FAISS index.

* **Email Sender:** Dispatch verification emails and notifications.

* **Data Cleanup:** Purge stale logs and temporary files.

* **Endpoints:**

  * `GET /api/v1/admin/workers` returns `[ { "workerName": "string", "status": "running|idle|failed" } ]`.
  * `POST /api/v1/admin/workers/{workerName}/action` with `{ "action": "start|stop|restart" }`.

**Use Cases:**

* Worker Management.

---

#### 4.2.9 Error Handling & Notifications

When critical errors occur in any subsystem (AI service, external metadata API, database), the backend shall:

* Log the error with timestamp and stack trace.
* If repeated failures exceed a threshold (e.g., 5 fails in 10 minutes), send an email to all admin users via `POST /api/v1/admin/notify`.
* On the mobile/web app, display user-friendly messages (e.g., “Service temporarily unavailable, please try again later”).

**Use Cases:**

* Error Handling and Notifications.

---

## 5. Technology & Libraries Used

### 5.1 Frontend

* **Mobile:**

  * **Expo (React Native)** – Latest stable version.
  * **React Navigation** – For screen routing.
  * **Redux + Redux Saga** – State management for asynchronous flows.
  * **React Native Camera** – For barcode and cover scanning.
* **Web:**

  * **React** – Latest stable.
  * **Ant Design** – UI component library.
  * **Axios** – HTTP client for API requests.

---

### 5.2 Backend

* **Language & Framework:**

  * **Python 3.9+** + **Flask** (RESTful API).
  * **Flask-JWT-Extended** – JWT authentication.
  * **React** – For admin dashboard.

---

### 5.3 AI Service

* **Framework:**

  * **PyTorch** – For CLIP model inference.
  * **FAISS** – Indexing and nearest‐neighbor search for cover embeddings.
* **Model:**

  * **OpenAI CLIP** (ViT‐B/32) pre‐trained, fine‐tuned on book cover dataset.
* **Endpoints:**

  * `POST /ai/recognize` expects base64 image; returns metadata.

---

### 5.4 Database

* **MySQL 8.0** (or MariaDB 10.x) – Main persistent store.

  * **Schemas:**

    * **Users:** id, email, password\_hash, name, created\_at, updated\_at.
    * **Books:** id, isbn, title, author, publish\_date, description, cover\_url, created\_at, updated\_at.
    * **Collections:** id, user\_id, name, created\_at, updated\_at.
    * **CollectionItems:** id, collection\_id, book\_id.
    * **Workers:** id, name, status, last\_heartbeat.
    * **Logs:** id, service, level, message, timestamp.
* **Migrations:** Controlled via Flask-Migrate (Alembic).

---

### 5.5 Testing

* **Unit Tests:**

  * **pytest** – For backend logic and API endpoints.
  * **Jest** – For frontend components.
* **Integration Tests:**

  * **pytest + requests** – Test end‐to‐end API flows.
  * **Cypress** – For web UI E2E.
* **Continuous Integration:**

  * **GitHub Actions** – Automatically run tests on push/PR.
* **Code Coverage:**

  * Aim for ≥ 85% coverage on critical modules.

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

### 6.3 Glossary

| Term                                          | Definition                                                                                                                                                     | More Information                                                             |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **API (Application Programming Interface)**   | A set of REST endpoints that allow clients (mobile, web, or admin dashboard) to interact with the backend services (authentication, book lookup, collections). | [🔗 Wikipedia](https://en.wikipedia.org/wiki/API)                             |
| **AI Service**                                | The microservice running CLIP + FAISS for book cover recognition. Given an image, it returns the nearest neighbor from its index along with metadata.          |                                                                              |
| **CLIP**                                      | Contrastive Language-Image Pre-training—an OpenAI model that embeds images and text into a shared latent space, used here for cover recognition.               | [🔗 OpenAI](https://openai.com/research/clip)                                 |
| **FAISS**                                     | Facebook AI Similarity Search—library used to index high-dimensional vectors (image embeddings) for fast nearest‐neighbor queries.                             | [🔗 GitHub](https://github.com/facebookresearch/faiss)                        |
| **JWT (JSON Web Token)**                      | A compact, URL-safe method for representing claims to be transferred between two parties, used for stateless authentication.                                   | [🔗 RFC 7519](https://tools.ietf.org/html/rfc7519)                            |
| **RBAC (Role-Based Access Control)**          | Access control model where permissions are assigned to roles rather than to individual users; roles are then assigned to users.                                | [🔗 Wikipedia](https://en.wikipedia.org/wiki/Role-based_access_control)       |
| **REST (Representational State Transfer)**    | Web architecture style for distributed systems; clarifies how resources are defined and addressed.                                                             | [🔗 Wikipedia](https://en.wikipedia.org/wiki/Representational_state_transfer) |
| **SQLAlchemy**                                | Python SQL toolkit and Object-Relational Mapping (ORM) library used to interact with MySQL/MariaDB from Flask.                                                 | [🔗 GitHub](https://github.com/sqlalchemy/sqlalchemy)                         |
| **Expo**                                      | A framework and platform for universal React applications, used for building Ridizi’s mobile apps.                                                             | [🔗 Expo](https://expo.dev)                                                   |
| **Ant Design**                                | A React UI library providing a set of high‐quality components, used for building the admin dashboard.                                                          | [🔗 Ant Design](https://ant.design)                                           |
| **Celery**                                    | An asynchronous task queue/job queue based on distributed message passing. Used for background jobs like cover indexing and email sending.                     | [🔗 Celery](https://docs.celeryproject.org)                                   |
| **Redis**                                     | In‐memory data structure store used as a message broker for Celery.                                                                                            | [🔗 Redis](https://redis.io)                                                  |
| **MySQL / MariaDB**                           | Relational database management systems used for persistent storage of users, books, collections, and logs.                                                     | [🔗 MySQL](https://www.mysql.com), [🔗 MariaDB](https://mariadb.org)           |
| **GDPR (General Data Protection Regulation)** | EU regulation on data protection and privacy. Requires user consent before storing personal data, and allows data deletion on request.                         | [🔗 GDPR](https://gdpr.eu)                                                    |