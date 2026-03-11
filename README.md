# Mine Safety Companion (MSC) 👷‍♂️🚧

> A comprehensive safety orchestration platform designed to actively reduce mining incidents through immersive training, behavior analytics, and real-time monitoring.

## 🌟 Executive Summary

The **Mine Safety Companion** is a behavior-driven safety management and compliance tracking system built specifically for mining operations. Unlike traditional passive safety systems, MSC focuses on *habit formation*—actively enforcing correct employee behavior through mandatory workflows, real-time monitoring, and positive reinforcement. The application ensures workplace safety and regulatory compliance (e.g., DGMS standards) by tracking every safety ritual, hazard report, and training interaction.

---

## ✨ Core Features

### 1. Behavior-Driven Compliance & Rituals
*   **Mandatory Daily Checklists**: Workers and supervisors must complete role-specific safety checklists (including strict PPE verification) before starting their shift.
*   **Workflow Enforcement**: The system blocks access to certain features/work until the daily safety verification is complete.
*   **Gamification**: Encourages consistent safe behavior through compliance scores (0-100), streaks, and leaderboards.

### 2. Comprehensive Training Ecosystem
*   **Video Library**: Curated safety training videos with actual engagement tracking (monitoring watch time and milestones like 25%, 50%, 75%).
*   **Case Studies & Quizzes**: Real-world incident case studies paired with knowledge quizzes that directly impact the worker's compliance score.

### 3. Hazard & Emergency Management (SOS)
*   **Proactive Hazard Reporting**: Workers can report hazards with severity levels, exact locations, and photo evidence.
*   **Real-Time SOS System**: Instant alerts for critical emergencies (e.g., Underground Fire, Gas Leakage, Rock Fall) with GPS location tracking, triggering immediate notifications to supervisors and admins.

### 4. Advanced Analytics & Heatmaps
*   **Supervisor Dashboard**: Features compliance summary cards, trend charts, list of top performers vs. at-risk workers, and actionable behavior alerts.
*   **Risk Heatmaps**: Visualizes safety risks across different mine zones, identifying areas with frequent hazards or high PPE non-compliance.

### 5. Multilingual Support
*   Natively supports English, Telugu, Tamil, and Malayalam to effectively communicate critical safety instructions to a diverse workforce.

---

## 👥 User Roles & Responsibilities

| Role | Primary Access & Responsibilities |
| --- | --- |
| **Worker** | Complete daily checklists, watch training videos, report hazards, track personal compliance score and streaks. |
| **Supervisor** | Monitor crew compliance, view behavior analytics, manage hazards, acknowledge automatic alerts, and intervene proactively. |
| **Admin** | Full system administration, manage SOS critical alerts, user/site provisioning, and view comprehensive global reports. |
| **DGMS Officer** | Read-only audit access to ensure regulatory compliance and review incident histories. |

---

## 🏗️ Technical Architecture

### Backend Stack
*   **Runtime/Framework:** Node.js with Express.js
*   **Database:** MongoDB with Mongoose ODM
*   **Real-Time Communication:** Socket.IO for instant alerts and dashboard updates
*   **Security & Auth:** JWT (JSON Web Tokens), bcrypt hashing, Helmet.js, CORS, Rate Limiting

### Frontend Stack
*   **Framework:** React 18 with Vite
*   **State Management:** React Context API
*   **Styling & UI:** TailwindCSS, Framer Motion (animations), Chart.js (analytics)
*   **Localization:** i18next
*   **Real-Time Client:** Socket.IO Client

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v16 or higher recommended)
*   MongoDB instance (Local or Atlas)

### Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables by copying the sample file (e.g., `cp config/env.sample .env`) and configuring `CLIENT_URL`, `MONGODB_URI`, and `JWT_SECRET`.
4. Start the server:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables by copying the sample file (e.g., `cp env.sample .env`) and configuring `VITE_API_URL` to point to your backend.
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🔒 Security & Privacy

*   **Data Protection:** Secure HTTP-only cookies, input sanitization, and protection against XSS/CSRF.
*   **Access Control:** Strict Role-Based Access Control (RBAC) ensuring users only see data relevant to their role and clearance.
*   **Auditability:** Every system interaction (from checklist completion to video milestones) is explicitly timestamped and logged for post-incident review and regulatory audits.

---

## 🔮 Future Roadmap

*   **Mobile Application:** React Native/Expo client for offline-friendly experiences and hardware integrations (camera, push notifications).
*   **Predictive Analytics:** Implementation of machine learning models to forecast probable safety violations based on historical behavior snapshots.
*   **IoT Integration:** Real-time sensor data and geofencing to enrich zone heatmaps and automate environmental hazard detection.

---
*Building a culture of safety where correct behavior is the only option.*
