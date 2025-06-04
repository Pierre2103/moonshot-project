<div align="center">

<img src="images/logo.png" alt="Ridizi Logo" width="400">

---

# Final Report

**Title:** Ridizi – Moonshot Project

**Author:** Pierre GORIN

**Created on:** May 27<sup>th</sup>, 2025 

**Last updated:** June 4<sup>th</sup>, 2025

</div>

<br><details>

<summary><strong>Table of Contents (Click to expand)</strong></summary>

- [Final Report](#final-report)
  - [1. Introduction](#1-introduction)
    - [1.1. Project Description](#11-project-description)
    - [Built With](#built-with)
    - [1.2. Project Context](#12-project-context)
    - [1.3. Motivation and Objectives](#13-motivation-and-objectives)
    - [1.4. Target Audience](#14-target-audience)
  - [2. Project Overview](#2-project-overview)
    - [2.1. Problem Statement](#21-problem-statement)
    - [2.2. Proposed Solution](#22-proposed-solution)
    - [2.3. Project Scope and Limitations](#23-project-scope-and-limitations)
    - [2.4. Personas and Use Cases](#24-personas-and-use-cases)
  - [3. Functional Specifications](#3-functional-specifications)
    - [3.1. Core Features](#31-core-features)
    - [3.2. User Roles and Permissions](#32-user-roles-and-permissions)
    - [3.3. User Journey and UI Flows](#33-user-journey-and-ui-flows)
    - [3.4. Non-Functional Requirements](#34-non-functional-requirements)
  - [4. Technical Specifications](#4-technical-specifications)
    - [4.1. System Architecture](#41-system-architecture)
    - [4.2. Database Design and Models](#42-database-design-and-models)
    - [4.3. API Structure and Endpoints](#43-api-structure-and-endpoints)
    - [4.4. Tools, Frameworks, and Services](#44-tools-frameworks-and-services)
  - [5. Algorithmic Choices and Implementation](#5-algorithmic-choices-and-implementation)
    - [5.1. Key Algorithms Used](#51-key-algorithms-used)
    - [5.2. Justification of Choices](#52-justification-of-choices)
    - [5.3. Performance Considerations](#53-performance-considerations)
    - [5.4. Alternative Approaches Considered](#54-alternative-approaches-considered)
  - [6. Testing and Quality Assurance](#6-testing-and-quality-assurance)
    - [6.1. Testing Strategy](#61-testing-strategy)
    - [6.2. Test Plan and Methodologies](#62-test-plan-and-methodologies)
    - [6.3. Test Cases and Coverage](#63-test-cases-and-coverage)
    - [6.4. Bug Tracking and Resolution](#64-bug-tracking-and-resolution)
  - [7. Deployment and Production](#7-deployment-and-production)
    - [7.1. CI/CD Workflow](#71-cicd-workflow)
    - [7.2. Hosting and Infrastructure](#72-hosting-and-infrastructure)
    - [7.3. Security and Data Protection](#73-security-and-data-protection)
    - [7.4. Monitoring and Maintenance](#74-monitoring-and-maintenance)
  - [8. Project Evolution and Future Improvements](#8-project-evolution-and-future-improvements)
    - [8.1. Features Added During Development](#81-features-added-during-development)
    - [8.2. Known Limitations](#82-known-limitations)
    - [8.3. Short- and Long-Term Roadmap](#83-short--and-long-term-roadmap)
  - [9. Market Analysis and Business Model](#9-market-analysis-and-business-model)
    - [9.1. Market Research](#91-market-research)
    - [9.2. Competitive Landscape](#92-competitive-landscape)
    - [9.3. Unique Value Proposition](#93-unique-value-proposition)
    - [9.4. Business Model and Monetization](#94-business-model-and-monetization)
  - [10. Project Management and Methodology](#10-project-management-and-methodology)
    - [10.1. Planning and Timeline](#101-planning-and-timeline)
    - [10.2. Task Management and Tools](#102-task-management-and-tools)
    - [10.3. Challenges and Resolutions](#103-challenges-and-resolutions)
    - [10.4. Personal Reflections](#104-personal-reflections)
  - [11. Conclusion](#11-conclusion)
    - [11.1. Summary of Achievements](#111-summary-of-achievements)
    - [11.2. Lessons Learned](#112-lessons-learned)
    - [11.3. Outlook](#113-outlook)
  - [12. Appendix](#12-appendix)
    - [12.1. Screenshots and UI Mockups](#121-screenshots-and-ui-mockups)
    - [12.2. Code Repository and Links](#122-code-repository-and-links)
    - [12.3. Additional Resources](#123-additional-resources)

</details>


---

## 1. Introduction

This document serves as the official report for the Ridizi project. It outlines the project’s purpose, design, development process, and technical implementation. It is intended to provide a clear and structured overview of the work carried out.

### 1.1. Project Description

**Ridizi** is a mobile application that enables users to scan the **cover of a book** and instantly access rich, structured metadata such as title, author, summary, genre, price, and publication date.

The goal of Ridizi is to make book recognition **fast, effortless, and visually intuitive**. The app is particularly useful for readers who want to catalog personal collections, track their reading history, or discover new books through visual scanning—without any typing or search forms.

When a book is not recognized, the user can optionally scan the **barcode** to contribute that book to the database.

### Built With

| Technology                                                                                                                                                                                                                                                                                          | Description                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| ![React Native](https://img.shields.io/badge/React--Native-61DAFB?style=for-the-badge&logo=react&logoColor=white&color=20232A)                                                                                                                                                                      | Used to build the cross-platform mobile application.         |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)                                                                                                                                                                                   | For all frontend and backend logic.                          |
| ![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)                                                                                                                                                                                                     | To simplify mobile app development and testing.              |
| ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)                                                                                                                                                                                               | Used for the backend API and AI services.                    |
| ![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)                                                                                                                                                                                                  | Backend framework powering the REST API.                     |
| ![FAISS](https://img.shields.io/badge/FAISS-0077C2?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiMwMDc3QzIiLz48L3N2Zz4=) | Used for fast vector similarity search in cover recognition. |
| ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)                                                                                                                                                                                                  | Main relational database for storing user data and metadata. |

### 1.2. Project Context

The original idea for this project had nothing to do with books—it started in museums.

I imagined an app that would let visitors scan artworks with their phone and immediately access detailed information about the piece, its artist, and its historical context. To make the experience more engaging, I also wanted to include two mini-games: one quiz-based, and another designed as a treasure hunt to guide users through exhibitions.

But during the mock-up phase, I came across Smartify, a widely adopted app offering nearly the same concept. With partnerships in over 30 countries and 700+ institutions, it was clear that Smartify already dominated that space. Rather than compete with an established solution, I chose to pivot.

That pivot became Ridizi—a similar visual recognition concept, but applied to books.

The idea is simple: users scan a book cover with their phone, and Ridizi displays all the relevant information instantly—author, title, summary, genre, price, publication date, and more. No need to type anything. No need to search. Just point, scan, and explore.

This new direction also connects to something more personal. Seven years ago, I built my first website to catalog my comic book collection. Back then, I had to manually input every single detail. In contrast, Ridizi is the tool I wish I had at the time—an app that automates the entire process, from recognition to metadata display.

### 1.3. Motivation and Objectives

Ridizi is designed for end users only—readers who want to visually identify books, store them in collections, keep track of what they own or have read, and explore metadata-rich profiles of each title.

The project’s core objectives are:
- To create an intuitive mobile experience centered on book cover recognition.
- To allow users to build a personal, visual library with no manual entry required.
- To let users contribute new books if a title is not found in the system, using the book's barcode.

An internal admin dashboard exists solely for monitoring technical processes (e.g., ingestion queues, background jobs). It plays no role in managing content or user-facing features.

### 1.4. Target Audience

Ridizi is made for anyone who interacts with physical books regularly and wants a smarter way to catalog or explore them. Target users include:
- Casual readers who want to scan and save books they own or wish to read.
- teacher-documentalist and librarians who manage local collections.
- Collectors and bibliophiles who seek accurate metadata for reference or archiving.

These users expect fast, visual, and effortless interaction. Ridizi answers that need with a design-first, mobile-first interface that removes complexity while offering depth.

---

## 2. Project Overview

### 2.1. Problem Statement

### 2.2. Proposed Solution

### 2.3. Project Scope and Limitations

### 2.4. Personas and Use Cases

---

## 3. Functional Specifications

### 3.1. Core Features

### 3.2. User Roles and Permissions

### 3.3. User Journey and UI Flows

### 3.4. Non-Functional Requirements

---

## 4. Technical Specifications

### 4.1. System Architecture

### 4.2. Database Design and Models

### 4.3. API Structure and Endpoints

### 4.4. Tools, Frameworks, and Services

---

## 5. Algorithmic Choices and Implementation

### 5.1. Key Algorithms Used

### 5.2. Justification of Choices

### 5.3. Performance Considerations

### 5.4. Alternative Approaches Considered

---

## 6. Testing and Quality Assurance

### 6.1. Testing Strategy

### 6.2. Test Plan and Methodologies

### 6.3. Test Cases and Coverage

### 6.4. Bug Tracking and Resolution

---

## 7. Deployment and Production

### 7.1. CI/CD Workflow

### 7.2. Hosting and Infrastructure

### 7.3. Security and Data Protection

### 7.4. Monitoring and Maintenance

---

## 8. Project Evolution and Future Improvements

### 8.1. Features Added During Development

### 8.2. Known Limitations

### 8.3. Short- and Long-Term Roadmap

---

## 9. Market Analysis and Business Model

### 9.1. Market Research

### 9.2. Competitive Landscape

### 9.3. Unique Value Proposition

### 9.4. Business Model and Monetization

---

## 10. Project Management and Methodology

### 10.1. Planning and Timeline

### 10.2. Task Management and Tools

### 10.3. Challenges and Resolutions

### 10.4. Personal Reflections

---

## 11. Conclusion

### 11.1. Summary of Achievements

### 11.2. Lessons Learned

### 11.3. Outlook

---

## 12. Appendix

### 12.1. Screenshots and UI Mockups

### 12.2. Code Repository and Links

### 12.3. Additional Resources