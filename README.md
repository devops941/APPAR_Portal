# APPAR Portal: Automated Permanent Academic Account Registry & Academic Depository

> A production-grade, multi-tenant digital academic repository and student credit passport aligned with the **National Education Policy (NEP 2020)** and **AICTE / UGC** guidelines.

---

## 📖 Quick Links
- **Full Architecture & Technical Documentation**: See [DOCUMENTATION.md](./DOCUMENTATION.md)
- **Final Year Engineering Project Report**: See [FINAL_YEAR_PROJECT_REPORT.md](./FINAL_YEAR_PROJECT_REPORT.md)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **MongoDB Atlas**: Cloud connection string configured in `.env.local`
- **Cloudinary**: Cloud name, API key & secret configured in `.env.local`

### 2. Installation & Setup
```powershell
# Install project dependencies
npm install

# Wipe and seed database with 2 HEIs, 4 Students, 8 Documents, and all personas
npm run seed

# Verify seeded MongoDB records
npm run seed:verify

# Run automated unit & integration tests
npm test

# Start Next.js development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demo Logins & Test Accounts

| Role | Email | Password | Primary Workflow |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@aicte.gov.in` | `Admin@123` | National AICTE portal oversight & HEI management |
| **Verification Officer** | `officer1@aicte.gov.in` | `Demo@12345` | Statutory Scrutiny Desk (`/verifications`) with White Theme document inspector |
| **Institution Admin (NITT)** | `admin.nitt@nitt.edu` | `Demo@12345` | NIT Trichy campus administration, catalog & admissions |
| **Institution Admin (GCT)** | `admin.gct@gct.ac.in` | `Demo@12345` | GCT Coimbatore campus administration |
| **Faculty Member (CSE)** | `faculty.cse@nitt.edu` | `Demo@12345` | Semester grade entry and marksheet upload |
| **Student (Arun Kumar)** | `arun.kumar@nitt.edu` | `Demo@12345` | Digital APAAR passport, QR card, transcript vault |
| **Student (Priya Sundaram)** | `priya.s@nitt.edu` | `Demo@12345` | Student self-service portal |
| **Student (Sneha)** | `sneha.r@gct.ac.in` | `Demo@12345` | Pending verification record for scrutiny testing |

---

## 🏛️ Key Features

- **12-Digit Lifelong APAAR Generation**: Automated unique identifier generation adhering to Ministry of Education guidelines.
- **Statutory Document Scrutiny Desk**: Multi-file document upload (AICTE EOA, UGC 2(f)/12(B), University Affiliation) stored on Cloudinary with inline streaming and **Pure White Theme** modal scrutiny.
- **Cryptographic SHA-256 Seals**: Tamper-proof hash validation for all institutional and student academic files.
- **UGC/AICTE 10-Point Grade Math**: Automated calculation of SGPA and CGPA without human calculation discrepancies.
- **Multi-Tenant Campus Isolation**: Enforced tenant scoping on all academic entities, departments, subjects, and records.
- **Public QR Attestation**: Zero-auth public verification page (`/verify`) with instant QR scanning.

---

*For detailed data models, sequence diagrams, and full API specifications, please refer to [DOCUMENTATION.md](./DOCUMENTATION.md).*
