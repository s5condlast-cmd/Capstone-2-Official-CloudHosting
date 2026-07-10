<div align="center">
  <img width="1200" height="400" alt="STI Marikina OJT System Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# STI Marikina: Web-Based Practicum Management System with AI (v2.0)

A comprehensive, state-of-the-art web platform designed to streamline, track, and automate the student internship/practicum program at STI College Marikina. Built with interactive components, robust security, and intelligent document validation assistance.

---

## 🌟 Key Capabilities & Features

*   **Intelligent Document Auditing**: Features integrated AI grammar check panels and semantic content insights to assist advisers in reviewing student submissions.
*   **OJT Phase Guards**: Dynamically locks/unlocks system options based on student progress stages (Before OJT $\rightarrow$ In OJT $\rightarrow$ Finals).
*   **Built-in Template Builder**: Allows students to fill and generate structured, printable internship templates (DTR, MOA, Consent forms) directly from their portal.
*   **System Configuration Hub**: Provides administrators with fine-grained control over OJT requirements, required hours, academic terms, and data backups.
*   **Modern Interactive UI**: Sleek styling with CSS Glassmorphism, animations powered by Framer Motion, Tailwind CSS v4, and dynamic light/dark mode toggling.

---

## 👥 Roles & Workflows

### 1. Student Portal
Guided by a dynamic stage progression checklist, students can:
*   **Pre-OJT**: Create, download, and upload the Comprehensive Resume, Parent/Guardian Letter of Consent, Memorandum of Agreement (MOA), and Endorsement Letter.
*   **Active OJT**: Log and submit Daily Time Records (DTR), write Reflective Journals, and upload the Host Company Training Plan.
*   **Finals**: Request supervisor evaluations and submit final OJT completion documents.

### 2. Adviser Portal
Allows OJT Coordinators and Advisers to manage their cohort efficiency:
*   **Class Dashboard**: Track the real-time progress of all assigned sections and students.
*   **Document Review Room**: View and audit PDF and text submissions using side-by-side viewports and AI-assisted grammar and content analysis modules.
*   **Evaluations & Endorsements**: Sign off on company MOAs and supervisor evaluations.

### 3. Administrator Console
Gives full operational oversight over the system:
*   **System Configurations**: Configure Academic Year details, target hour limits, active document pipeline checklists, and 2-Factor Authentication overrides.
*   **Backup & Recovery**: Instantly create full system snapshots or restore database states to ensure high availability and disaster recovery.
*   **Announcements & Users**: Broadcast system-wide messages and manage user accounts and OJT coordinator assignments.

---

## 📁 Project Structure

A clean, modular structure hosting the source codebase:

```bash
Capstone 2/
├── .agents/               # Custom workspace rules and behavior guidelines
├── public/                # Static public assets (e.g. document samples)
├── src/
│   ├── components/
│   │   ├── compose/       # Interactive document layout modal inputs
│   │   ├── layout/        # Main layout, Sidebar, Topbar navigation, Route protection
│   │   ├── review/        # AI Grammar and Content Insight panels, PDF viewports
│   │   ├── templates/     # Form preview overlays (DTR, Resume, MOA templates)
│   │   └── ui/            # Reusable UI components (Card, Button, Badge, Stats)
│   ├── hooks/             # Custom utility hooks
│   ├── lib/               # Utility helper libraries
│   ├── pages/
│   │   ├── admin/         # Admin dashboards, Settings configuration, Monitoring panels
│   │   ├── adviser/       # Adviser dashboards, review sessions, class progress reports
│   │   ├── public/        # Landing page and Forgot Password panels
│   │   ├── student/       # OJT phase portals, requirement checklists, submission portals
│   │   ├── Login.tsx      # Multi-role authentication entry point
│   │   ├── Notifications.tsx
│   │   └── Profile.tsx    # Personal info and profile page
│   ├── App.tsx            # Main router and security configuration
│   ├── main.tsx           # Virtual DOM render hook
│   ├── types.ts           # Typescript interfaces (User, Roles, Submissions)
│   └── index.css          # Main Tailwind styles file
├── package.json           # Scripts and system package dependencies
└── vite.config.ts         # Vite bundler configurations
```

---

## 💻 Tech Stack

*   **Framework**: [React](https://react.dev/) + [Vite](https://vite.dev/) (Vite v6)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **Animations**: [Motion (Framer)](https://motion.dev/)
*   **Icons**: [Lucide React](https://lucide.dev/)

---

## 🛠️ Local Development Setup

### Prerequisites
*   Node.js (v18 or higher recommended)

### Getting Started

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/s5condlast-cmd/Web-Based-Practicum-System-With-AI-STI-MARIKINA-2.0.git
    cd Capstone 2
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Initialize your local configuration by copying `.env.example` to `.env`:
    ```bash
    copy .env.example .env
    ```
    Set your `GEMINI_API_KEY` in the `.env` file to activate AI grammar and insight features.

4.  **Run the Server**:
    Start the Vite local development server:
    ```bash
    npm run dev
    ```
    Open your browser and navigate to `http://localhost:3001/` (or the port specified in terminal).

5.  **Compile & Build**:
    To create a production build output in the `/dist` directory:
    ```bash
    npm run build
    ```
