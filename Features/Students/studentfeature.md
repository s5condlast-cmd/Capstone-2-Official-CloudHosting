# Student Document Workflow Feature

This document explains the core workflow for how students interact with OJT templates throughout the system (Before, During, and After OJT phases).

## Overview
The system provides a seamless, accurate way for students to view official OJT templates and fill them out without breaking any formatting. Instead of relying on external software, students can preview the exact document and fill it out directly within the web app.

---

## The Workflow

### 1. 📄 View the Template
- **Action:** The student clicks on any required template in their OJT checklist (e.g., *Application Letter*, *MOA*, *Evaluation*).
- **What Happens:** The system immediately loads a **pixel-perfect, read-only PDF preview** of the exact document. This allows the student to read the official layout, letterheads, and margins exactly as they appear in real life.
- **Why:** To ensure the student knows exactly what the final document will look like before they start typing.

### 2. 📝 Edit via UI Form
- **Action:** The student clicks the **"Fill Form"** (or Edit) button located in the top-right toolbar.
- **What Happens:** The screen splits into two panels:
  - **Left Panel:** The original PDF remains visible for reference.
  - **Right Panel (UI Editor):** A clean, user-friendly React web form slides into view, asking *only* for the necessary blanks (e.g., *Student Name, Company Name, Required Hours*).
- **Why:** Instead of forcing students to download a file, mess up the Microsoft Word formatting, and re-upload it, the web UI forces them to only input the required data, ensuring the template's integrity remains 100% intact.

### 3. 📥 Generate & Download
- **Action:** Once the student finishes typing their details into the right-side form, they click the **"Download Filled .docx"** button.
- **What Happens:** The system takes their inputted data and programmatically merges it into the original `.docx` template using placeholder tags. The student instantly receives a fully formatted, ready-to-print Microsoft Word document.
- **Why:** The output is a `.docx` file rather than a PDF so the student or their supervisor can make any final manual tweaks or add physical/digital signatures before final submission.

---

## Technical Summary
- **Viewer Engine:** Native PDF Iframe Embed (for 100% visual accuracy).
- **Form Engine:** React State + Dynamic Form Generation.
- **Generation Engine:** `easy-template-x` (Reads the native `.docx` template, searches for `{placeholder}` tags, and injects the student's data seamlessly).
