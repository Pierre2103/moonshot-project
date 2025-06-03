<div align="center">

<img src="images/logo.png" alt="Ridizi Logo" width="400">

---

# Test Plan

**Title:** Ridizi – Moonshot Project

**Author:** Pierre GORIN

**Created on:** April 16<sup>th</sup>, 2025

**Last updated:** June 3<sup>rd</sup>, 2025

</div>

<br><details>

<summary><strong>Table of Contents (Click to expand)</strong></summary>

- [Test Plan](#test-plan)
  - [1. Introduction](#1-introduction)
  - [2. Test Objectives](#2-test-objectives)
  - [3. Test Scope](#3-test-scope)
    - [3.1 In Scope](#31-in-scope)
    - [3.2 Out of Scope](#32-out-of-scope)
  - [4. Test Strategy](#4-test-strategy)
    - [4.1 Test Types](#41-test-types)
    - [4.2 Test Levels](#42-test-levels)
    - [4.3 Test Case Management](#43-test-case-management)
  - [5. Test Environment](#5-test-environment)
  - [6. Test Tools](#6-test-tools)
  - [7. Traceability Matrix](#7-traceability-matrix)
  - [8. End Matter](#8-end-matter)
    - [8.1 Project Owner](#81-project-owner)
    - [8.2 License](#82-license)
  - [8.3 References](#83-references)

</details>

---

## 1. Introduction

This Test Plan defines the overall approach for validating the Ridizi platform. It is tightly coupled with the [Test Cases](./TestCases.md) document, which enumerates all individual test cases with unique IDs and details.

---

## 2. Test Objectives

- Ensure all functional and non-functional requirements are met.
- Validate all workflows described in the [Functional Specifications](./FunctionalSpecifications.md).
- Achieve full coverage of all test cases listed in [TestCases.md](./TestCases.md).
- Detect and document all defects before release.

---

## 3. Test Scope

### 3.1 In Scope

- Mobile app (iOS, Android, Web)
- Backend API (REST endpoints)
- AI service (cover recognition)
- Admin dashboard (analytics, worker management)
- Database migrations and data integrity

### 3.2 Out of Scope

- Social features (chat, sharing)
- Offline mode
- Payment or e-commerce integrations

---

## 4. Test Strategy

### 4.1 Test Types

- **Unit Testing:** Individual functions and modules.
- **Integration Testing:** Interactions between components (API, DB, AI, frontend).
- **End-to-End (E2E) Testing:** User workflows from UI to backend.
- **Performance Testing:** Response times and throughput.
- **Security Testing:** Authentication, authorization, data privacy.
- **Regression Testing:** Ensure new changes do not break existing features.

### 4.2 Test Levels

- **Component Level:** API endpoints, UI components, AI routines.
- **System Level:** Full user journeys, admin workflows, data processing.

### 4.3 Test Case Management

- All test cases are defined in [TestCases.md](./TestCases.md) with unique IDs (e.g., [TC-001](./TestCases.md#tc-001-create-user-valid)).
- Each test case is mapped to requirements and features for traceability.

---

## 5. Test Environment

| Component      | Technology         | Version         | Notes                  |
| -------------- | ----------------- | --------------- | ---------------------- |
| Mobile App     | Expo (React Native)| Latest stable   | iOS/Android/Web        |
| Backend API    | Flask (Python)     | 3.x             | RESTful, Dockerized    |
| AI Service     | CLIP + FAISS       | Latest          | GPU/CPU fallback       |
| Database       | MySQL/MariaDB      | 10.x            | Local/Cloud            |
| Admin UI       | React + Ant Design | Latest          | Chrome/Edge/Firefox    |

Test data and synthetic users/collections are managed as described in [TestCases.md](./TestCases.md).

---

## 6. Test Tools

- **Automated:**  
  - Jest (frontend unit tests)
  - Custom test suite ([testCases.ts](../code/Backend/admin_ui/src/testing/testCases.ts))
  - Axios (API integration tests)
- **Manual:**  
  - Admin dashboard testing tools
  - Postman/Insomnia for API
  - Expo Go for mobile


## 7. Traceability Matrix

Each requirement from the [Functional Specifications](./FunctionalSpecifications.md) is mapped to one or more test cases in [TestCases.md](./TestCases.md):

| Requirement (FS)         | Test Case IDs         |
|--------------------------|----------------------|
| User registration        | [TC-001](./TestCases.md#tc-001-create-user-valid), [TC-002](./TestCases.md#tc-002-create-user-duplicate), [TC-034](./TestCases.md#tc-034-create-user-empty-username), [TC-039](./TestCases.md#tc-039-delete-user) |
| Book scanning (cover)    | [TC-019](./TestCases.md#tc-019-scan-random-cover), [TC-020](./TestCases.md#tc-020-cover-recognition-image-match), [TC-038](./TestCases.md#tc-038-cover-recognition-invalid-image) |
| Book scanning (barcode)  | [TC-016](./TestCases.md#tc-016-scan-existing-isbn-barcode), [TC-017](./TestCases.md#tc-017-scan-unknown-isbn-barcode), [TC-037](./TestCases.md#tc-037-scan-barcode-no-isbn) |
| Collections management   | [TC-006](./TestCases.md#tc-006-create-collection) – [TC-011](./TestCases.md#tc-011-delete-collection), [TC-036](./TestCases.md#tc-036-add-book-to-invalid-collection) |
| Search                   | [TC-012](./TestCases.md#tc-012-search-by-title) – [TC-015](./TestCases.md#tc-015-search-by-genre)      |
| Book details             | [TC-021](./TestCases.md#tc-021-get-book-details-valid), [TC-022](./TestCases.md#tc-022-get-book-details-invalid)       |
| Analytics                | [TC-023](./TestCases.md#tc-023-analytics-overview) – [TC-030](./TestCases.md#tc-030-analytics-genre-distribution)      |
| Worker management        | [TC-031](./TestCases.md#tc-031-worker-start) – [TC-033](./TestCases.md#tc-033-worker-status)      |
| Error handling           | [TC-034](./TestCases.md#tc-034-create-user-empty-username) – [TC-038](./TestCases.md#tc-038-cover-recognition-invalid-image)      |
| Data cleanup             | [TC-040](./TestCases.md#tc-040-cleanup-test-data)               |

---

## 8. End Matter

### 8.1 Project Owner

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

### 8.2 License

This project is licensed under the MIT License – see the [LICENSE](../LICENSE.md) file for details.

---

## 8.3 References

- [Functional Specifications](./FunctionalSpecifications.md)
- [Technical Specifications](./TechnicalSpecifications.md)
- [Test Cases](./TestCases.md)
- [Project Repository](https://github.com/Pierre2103/moonshot-project)