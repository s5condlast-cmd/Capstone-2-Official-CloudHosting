---
title: "Web-Based Practicum System with AI-Assisted Validation and Compliance Monitoring"
description: "Official Capstone Project Proposal document and structural outline for STI College Marikina."
tags:
  - sti-ojt
  - capstone-proposal
  - academic-spec
  - proposal-defense
aliases:
  - "Capstone Proposal"
  - "Main Proposal Document"
created: 2026-05-23
updated: 2026-09-04
---

# Web-Based Practicum System with AI-Assisted Validation and Compliance Monitoring for STI Marikina

[←  Back to Documentation Hub](../README.md) | [Refactoring Guidelines](REFACTORING_GUIDELINES.md) | [System Architecture](../architecture/ARCHITECTURE.md)

**A Capstone Project Proposal**
Presented to the Faculty of the Information and Communications Technology Program
STI College Marikina

In Partial Fulfillment of the Requirements for the Degree of **Bachelor of Science in Information Technology**

**Proponents:**
- Kerin Gabriel del Rosario
- John Dwayne Guaniso
- Jiro Salvan

**Date:** May 23, 2026

---

## Endorsement Form for Proposal Defense

- **Title of Research**: Web-Based Practicum System with AI-Assisted Validation and Compliance Monitoring for STI Marikina
- **Proponents**: Kerin Gabriel del Rosario, John Dwayne Guaniso, Jiro Salvan
- **Degree**: Bachelor of Science in Information Technology
- **Status**: Examined and recommended for Proposal Defense

**Endorsed by:**
- Dave Lord Rubaya — *Capstone Project Adviser*

**Approved for Proposal Defense:**
- Dr. Frederic D. Yulo — *Capstone Project Coordinator*

**Noted by:**
- Mr. Dave Lord Rubaya — *Program Head*

---

## Approval Sheet

This capstone project proposal titled *Web-Based Practicum System with AI-Assisted Validation and Compliance Monitoring for STI Marikina*, prepared and submitted by Kerin Gabriel B. del Rosario, John Dwayne Guaniso, and Jiro Salvan in partial fulfillment of the requirements for the degree of Bachelor of Science in Information Technology, has been examined and is recommended for acceptance and approval.

**Adviser:**
- Dave Lord Rubaya — *Capstone Project Adviser*

**Capstone Project Review Panel:**
- Mr. Mark Saledio — *Lead Panelist*
- Dr. Frederic D. Yulo — *Panel Member / Capstone Project Coordinator*
- Mr. Warren Marklou Rosqueta — *Panel Member*

**Noted:**
- Mr. Dave Lord Rubaya — *Program Head*

---

## Table of Contents

| Section | Page |
| :--- | :--- |
| Title Page | i |
| Endorsement Form for Proposal Defense | ii |
| Approval Sheet | iii |
| Table of Contents | iv |
| Introduction | 1 |
| Project Context | 4 |
| Purpose and Description | 4 |
| Objectives | 6 |
| Scope and Limitations | 6 |
| Review of Related Literature/Studies/Systems | 7 |
| Technical Background | 18 |
| Requirements Analysis & Documentation | 20 |
| Design of Software, System, Product, and/or Processes | 24 |
| References & Appendices | 30 |

---

## Related Documentation & Cross-References

- [Refactoring & Development Guidelines](REFACTORING_GUIDELINES.md) — Technical standards and engineering conventions
- [System Architecture Specification](../architecture/ARCHITECTURE.md) — Full-stack system architecture and component models
- [Master Documentation Hub](../README.md) — Central index of all project features and technical guides
WEB‑BASED PRACTICUM SYSTEM WITH AI‑ASSISTED VALIDATION AND COMPLIANCE MONITORING

FOR STI MARIKINA

A Capstone Project Proposal

Presented to the Faculty of the

Information and Communications Technology Program

STI College Marikina

In Partial Fulfilment

of the Requirements for the Degree

Bachelor of Science in Information Technology

Kerin Gabriel del Rosario

John Dwayne Guaniso

Jiro Salvan

May 23, 2026

ENDORSEMENT FORM FOR PROPOSAL DEFENSE

TITLE OF RESEARCH:     Web‑Based Practicum System with AI‑Assisted Validation and Compliance Monitoring for STI Marikina

NAME OF PROPONENTS:            Kerin Gabriel del Rosario

John Dwayne Guaniso

Jiro Salvan   

In Partial Fulfilment of the Requirements

for the degree Bachelor of Science in Information Technology

has been examined and is recommended for Proposal Defense.

ENDORSED BY:

Dave Lord Rubaya

Capstone Project Adviser

APPROVED FOR PROPOSAL DEFENSE:

Dr. Frederic D. Yulo

Capstone Project Coordinator

NOTED BY:

Mr. Dave Lord Rubaya

Program Head

# MAY 23, 2026

# APPROVAL SHEET

This capstone project proposal titled Web‑Based Practicum System with AI‑Assisted Validation and Compliance Monitoring for STI Marikina, prepared and submitted by Kerin Gabriel B. del Rosario, John Dwayne Guaniso, and Jiro Salvan in partial fulfillment of the requirements for the degree of Bachelor of Science in Information Technology, has been examined and is recommended for acceptance and approval.

Dave Lord Rubaya

Capstone Project Adviser

Accepted and approved by the Capstone Project Review Panel

in partial fulfillment of the requirements for the degree of

Bachelor of Science in Information Technology

|   |   |
|---|---|
|Dr. Frederic D. Yulo|Mr. Warren Marklou Rosqueta|
|Panel Member|Panel Member|

Mr. Mark Saledio

Lead Panelist

Noted:

|   |   |
|---|---|
|Dr Frederic D. Yulo|Mr. Dave Lord Rubaya|
|Capstone Project Coordinator|Program Head|

May 23, 2026  

# Table of Contents

|   |   |   |
|---|---|---|
||   |Page|
|Title Page|   |i|
|Endorsement form for Proposal Defense|   |ii|
|Approval Sheet|   |iii|
|Table of Contents|   |iv|
|Introduction|   |1|
||Project Context|4|
||Purpose and Description|4|
||Objectives|6|
||Scope and Limitations<br><br>Review of Related Literature/Studies/Systems|7|
|Methodology|   ||
||Technical Background|18|
||Requirements Analysis||
||Requirements Documentation||
||Design of Software, System, Product, and/or Processes||
|References|   ||
|Appendices|   ||
||Resource Persons||
||Personal Technical Vitae||
||   ||

# Introduction

The practicum program is one of the most essential components of the academic curriculum at STI College Marikina, serving as a bridge between classroom learning and real‑world professional experience. Through practicum deployment, students are given the opportunity to apply their technical, interpersonal, and problem‑solving skills within actual workplace settings. Despite its importance and the gradual digital transformation happening across various educational processes, the current system used to manage and monitor practicum requirements at STI Marikina remains predominantly face‑to‑face, manual, and heavily dependent on printed documents.

At present, students must physically prepare, print, and submit a range of documents—such as their resume, application letter, Memorandum of Agreement (MOA), and endorsement letter—directly to their practicum advisers or the OJT/practicum coordinator. Once deployed, they also submit requirements such as Daily Time Records (DTR), Weekly Accomplishment Reports, Midterm and Final Evaluation Forms, and various supervisor‑signed certifications. These documents are usually compiled in folders or envelopes and handed over in person for review. As a result, advisers must regularly process large volumes of hard‑copy submissions, manually check for completeness, and store them in physical file cabinets or personal binders. This manual practice creates an environment where documents are prone to misplacement, physical damage, or inconsistent record‑keeping.

Moreover, reliance on physical submissions requires students to frequently visit the campus—even if they are assigned to companies located far from school or if their work schedules limit their availability. Students often experience delays because they need to reprint documents, return for corrections, or wait for advisers to be available for face‑to‑face consultation. The process becomes even more challenging during peak submission periods, such as at the start of the practicum cycle or during final clearance, when multiple students attempt to submit documents at the same time. This often leads to long queues, disorganized piles of paperwork, and longer turnaround times before feedback is provided.

For practicum advisers, coordinating and tracking each student's status becomes increasingly difficult as class sizes grow. Without a centralized digital monitoring system, they often rely on handwritten checklists, email threads, or personal notes to keep track of whether students have submitted the correct forms, complied with necessary revisions, or completed their required practicum hours. Sorting through stacks of documents to find a specific file or resolve discrepancies consumes valuable time that could instead be used for more meaningful academic supervision. Additionally, communication gaps may arise, as advisers often need to manually inform students of missing documents, incorrect formatting, or inconsistencies—a process that is tedious and vulnerable to human error.

The preparation of key institutional requirements, such as MOAs and endorsement letters, also adds complexity to the manual process. Students frequently need guidance on which version of the MOA to use, how many copies to prepare, and where to obtain the correct templates. They may need to visit several offices within the campus—such as the registrar, dean’s office, or program chair—just to route their documents for signatures. Meanwhile, advisers need to ensure that every student is using the updated, approved templates and following the correct procedures. Even small errors, such as incorrect names, incomplete fields, or formatting inconsistencies, can delay the approval process and cause students to repeat printing and resubmission. Over time, these repetitive manual tasks contribute to inefficiency and unnecessary stress for both the students and the practicum team.

The absence of a centralized, automated monitoring platform also makes it challenging for administrators to generate reports, track compliance rates, and observe trends in student performance. Since data is scattered across paper files, USB drives, email attachments, and printed forms, creating consolidated reports often requires time‑consuming manual encoding. This lack of digital consolidation not only delays decision‑making but also increases the risk of inaccurate records or lost data—issues that are highly problematic when preparing accreditation documents or institutional assessments.

Given these challenges, it is evident that the current face‑to‑face and paper‑based system, while functional in traditional settings, is no longer efficient or scalable for modern academic environments. The increasing volume of students, the growing number of partner companies, and the greater expectations for timely and accurate monitoring highlight the need for a more streamlined and technology‑driven approach.

To address these long‑standing issues, the Web‑Based Practicum System with AI for STI Marikina is proposed. This system aims to transform the practicum documentation process by enabling students to submit all required documents online through a centralized platform. AI‑assisted features can enhance the workflow by automatically detecting incomplete fields, mismatched information, or formatting errors in uploaded files—reducing the burden on advisers and minimizing repetitive manual checking. The system can also generate endorsement letters, track the status of MOA routing, and provide automated reminders to students regarding missing or late submissions.

For practicum advisers and coordinators, the system provides real‑time visibility into each student’s progress, reducing reliance on physical files and manual checklists. It enables easier retrieval, storage, and organization of documents, while also supporting better communication through built‑in notifications, status dashboards, and automated summary reports. Ultimately, the proposed system aims to enhance accuracy, improve efficiency, reduce unnecessary delays, and create a more transparent practicum management experience for all stakeholders.

## Project Context

The practicum program at STI College Marikina plays a crucial role in preparing students for professional practice by requiring them to complete various academic and industry‑related requirements. However, the current practicum management process is still largely dependent on face‑to‑face transactions and printed hard‑copy documents. Students are required to physically submit documents such as resumes, Memorandums of Agreement (MOA), endorsement letters, Daily Time Records, and progress reports to practicum advisers for review and approval. Advisers, in turn, manually check, sign, store, and monitor these documents, often relying on physical folders and in‑person follow‑ups to track compliance.

While this traditional approach has long been practiced, it presents several operational challenges that affect both students and advisers. The reliance on physical submission results in repetitive campus visits, long processing times, and delays in approval, especially when documents require revisions or multiple signatures. Printed documents are also prone to loss, damage, and misfiling, making record management difficult and inefficient. In addition, advisers face challenges in monitoring student compliance due to the absence of a centralized tracking system, leading to difficulty in identifying missing requirements, inconsistent communication, and increased workload caused by manual checking and follow‑ups. These issues highlight the limitations of the current face‑to‑face and paper‑based practicum process and emphasize the need for a more efficient, organized, and technology‑driven solution.

## Purpose and Description

This study aims to develop a Web‑Based Practicum System with AI‑Assisted Validation and Compliance Monitoring for STI Marikina that improves the management and monitoring of practicum-related documents and student requirements. The proposed system is designed to address the challenges of the current manual and paper-based process by providing a centralized online platform where students can submit and manage their practicum documents, such as resumes, application letters, Memorandum of Agreement (MOA), endorsement letters, weekly accomplishment reports, and evaluation forms.

Through the system, students will be able to upload and track their required documents online, reducing the need for repeated campus visits and physical submissions. This digital approach minimizes the risk of lost or damaged documents and allows students to easily monitor the status of their submissions and required revisions.

The system also incorporates AI-assisted features that help detect incomplete information, missing fields, or formatting inconsistencies in uploaded documents. This allows students to correct errors before final submission and helps reduce the workload of practicum advisers who manually review large volumes of documents.

For practicum advisers and coordinators, the platform provides a centralized dashboard where student submissions can be reviewed, organized, and monitored efficiently. This enables easier tracking of student compliance, faster document verification, and improved organization of practicum records. By digitizing the practicum documentation process, the proposed system aims to reduce paperwork, prevent record misplacement, and create a more efficient, accurate, and transparent practicum management system for STI College Marikina.

**Statement of the Problem**

The practicum program of STI College Marikina plays a vital role in preparing students for real‑world experience; however, the current process remains largely manual, face‑to‑face, and paper‑based, resulting in inefficiencies in document submission, monitoring, and administrative management. Students encounter difficulties in submitting and tracking their practicum requirements, while practicum advisers and administrators face challenges in monitoring student compliance, managing large volumes of documents, and ensuring accuracy of submissions. In addition, delays are often caused by incomplete or incorrect documents and the lack of an automated system for communication, validation, and tracking. Furthermore, the absence of a centralized and intelligent system limits efficiency, visibility, and overall practicum management. Therefore, there is a need to design, develop, and implement a web‑based practicum system with AI‑assisted document validation to improve submission, monitoring, communication, and administrative processes while maintaining human oversight.

Specifically, this study seeks to answer the following questions:

1.     How to design, develop and implement a centralized web‑based platform that allows students to submit practicum requirements without relying on face‑to‑face transactions and printed documents?

2.     How to design, develop and implement a system that enables practicum advisers to effectively monitor and track student compliance and practicum progress in real time?

3.     How to design, develop and implement an administrative module that allows centralized management of practicum records, document templates, academic terms, and adviser assignments?

4.     How to design, develop and implement an AI‑assisted validation mechanism that reduces document review delays caused by incomplete, incorrect, or inconsistent submissions while maintaining human decision‑making authority?

5.     How to design, develop and implement an automated notification system that improves communication between students and practicum advisers regarding missing, returned, or approved requirements?

6.     How to design, develop and implement a secure and reliable practicum system that ensures proper data storage, monitoring, and reporting while complying with institutional policies and data privacy standards?

## Objectives

The primary objective of this study is to develop a Web‑Based Practicum System with AI‑Assisted Validation and Compliance Monitoring for STI Marikina that enhances the efficiency, accuracy, and transparency of internship application and monitoring processes.

Specifically, this study aims to:

·       To design, develop, and implement Student Submission Module - provide a centralized digital platform for the remote submission of practicum requirements and recording of daily activities to eliminate physical travel constraints and document damage risks.

·       To design, develop, and implement Adviser Monitoring Dashboard - facilitate real-time tracking of student compliance and progress through a centralized interface, addressing the inefficiency of manual monitoring for large class sizes.

·       To design, develop, and implement Admin Management Module - centralize the administration of practicum templates, account configurations, and system-wide data management to ensure organizational consistency.

·       To design, develop, and implement AI-Assisted Validation Module - automate the review of accomplishment reports and time-logs to reduce administrative delays and enhance student accountability through intelligent consistency checking.

·       To design, develop, and implement Automated Notification System - streamline communication between advisers and students regarding missing submissions and compliance deadlines to prevent delays in the practicum workflow.

·       To design, develop, and implement a centralized document repository system that enables administrators to securely store, organize, and manage practicum related records for efficient retrieval and monitoring.

## Scope and Limitations

## Scope of the Study

This study covers the development of a Web-Based Practicum System with Artificial Intelligence for STI Marikina that focuses on digitizing and streamlining the submission, review, and monitoring of practicum requirements. The system is designed to replace the existing face-to-face and paper-based practicum process by providing a centralized online platform where students can submit required documents, practicum advisers can monitor compliance and progress, and administrators can manage practicum records efficiently. The system implements role-based access with dedicated modules for the administrator, practicum advisers, and students, ensuring secure, organized, and controlled management of practicum activities. Artificial Intelligence (AI) is incorporated as an assistive feature using rule-based and local validation techniques to support document completeness checking and error detection prior to adviser review, while maintaining full human oversight. The proposed system is designed to operate using open-source and free-tier or institution-hosted technologies, ensuring zero recurring operational cost and long-term sustainability. Optional browser-based features may be used to enhance accessibility without affecting core system functionality.

**1.**     **Administrative Management and Control Module**

This module provides administrators with full control over system operations.

**1.1.****User Account Management**

Create, update, activate, and deactivate accounts for students, advisers, and supervisors.

**1.2.****Role**‑**Based Access Control**

Assign permissions based on user roles.

**1.3.** **Practicum Batch and Academic Term Management**

Organize students by term and batch.

**1.4.****Adviser Assignment Management**

Assign advisers to students or sections.

**1.5.****Document Template Management**

Upload and manage official templates (MOA, letters, forms).

**1.6.****System Activity Monitoring**

Track logs, submissions, and user activities.

**1.7.****Report Generation**

Generate reports on compliance, submissions, and system usage.

**1.8.****Database Backup and Recovery Management**

Performs system data backups and restoration when needed.

**2.**     **Practicum Adviser Monitoring and Evaluation Module**

This module supports advisers in reviewing, monitoring, and managing student requirements

**2.1.****Student Assignment and Overview**

Displays assigned students and their practicum status.

**2.2.****Document Review and Evaluation**

Enables access and review of student submissions.

**2.3.****Document Approval and Feedback Management**

Allows approval, rejection, or return of documents with remarks.

**2.4.****Endorsement Letter Generation**

Generates endorsement letters using approved templates.

**2.5.****MOA Review and Preliminary Verification**

Allows advisers to verify submitted MOA details before admin processing.

**2.6.****DTR and Weekly Report Monitoring**

Enables checking of student‑submitted attendance and reports.

**2.7.****Requirement Status Dashboard**

Displays compliance as missing, pending, returned, or completed.

**2.8.****AI**‑**Assisted Submission Alerts**

Highlights incomplete or inconsistent submissions.

**2.9.****Student Communication and Notifications**

Enables sending of system‑generated messages to students.

**3.**     **Student Submission and Requirement Management Module**

This module enables students to manage their practicum requirements efficiently through an online platform.

**3.1.****Student Practicum Profile Management**

Allows students to create and update personal, academic, and practicum information.

**3.2.****Pre**‑**Deployment Requirement Submission**

Enables upload of documents such as resumes, application letters, medical certificates, and requirements before deployment.

**3.3.****MOA Information Submission**

Allows students to submit required data for MOA preparation and processing.

**3.4.****During**‑**Practicum Requirement Upload**

Enables submission of:

·       Daily Time Records (DTR)

·       Weekly accomplishment reports

·       Practicum journals

**3.5.****Submission Status Tracking**

Displays real‑time status of documents (pending, approved, returned).

**3.6.****Adviser Feedback Viewing**

Allows students to view comments and revision instructions.

**3.7.****Automated Reminders and Alerts**

Notifies students of missing, incomplete, or returned requirements.

**3.8.****Practicum Compliance Tracking**

Allows students to monitor their overall completion status.

**4.**     **Supervisor Validation Module**

This module integrates external validation from company supervisors.

**4.1.****DTR Validation and Approval**

Allows supervisors to confirm student attendance records.

**4.2.****Journal and Report Validation**

Enables verification of student practicum tasks and activities.

**4.3.****Validation Confirmation System**

Confirms authenticity of submitted reports.

**4.4.****Supervisor Access Control**

Grants limited access only to assigned students.

**5.**     **AI**‑**Assisted Document Validation Module**

This module provides assistive validation to reduce document errors.

**5.1.****Required Field Checking**

Identifies missing required information.

**5.2.****Format and Structure Validation**

Detects incorrect formats or incomplete sections.

**5.3.****Consistency Checking**

Flags mismatched or inconsistent entries.

**5.4.****Submission Flagging System**

Highlights documents requiring attention.

**6.**     **Notification and Communication Module**

This module ensures efficient communication between system users.

**6.1.****Automated Submission Notifications**

Alerts users when documents are submitted or updated.

**6.2.****Reminder System**

Notifies students about pending or missing requirements.

**6.3.****Adviser Feedback Notifications**

Sends alerts when documents are returned or approved.

**6.4.****Admin Alerts**

Provides system updates to administrators.

**7.**     **Centralized File Storage and Repository Module**

This module provides a secure and organized document storage system.

**7.1.****Centralized Document Storage**

Stores all practicum‑related files in a single system.

**7.2.****Organized File Classification**

Categorizes documents by:

·       student

·       practicum batch

·       document type

**7.3.****Document Retrieval System**

Allows authorized users to easily locate files.

**7.4.****Secure Access Control**

Restricts document access based on user roles.

**7.5.****Long**‑**Term Record Management**

Maintains historical records for reference and reporting.

**8.**     **MOA Monitoring and Deadline Alert Module**

This module improves the efficiency of MOA processing.

**8.1.****MOA Tracking System**

Monitors status of MOA documents (pending, approved, returned).

**8.2.****Deadline Monitoring**

Tracks submission timelines.

**8.3.****Automated Deadline Alerts**

Notifies administrators of approaching deadlines.

Limitations of the Study

The proposed Web‑Based Practicum System with AI for STI Marikina is designed to improve the documentation and monitoring of practicum requirements; however, the study is subject to the following limitations:

·       The system does not record actual time-in and time-out of students. The Daily Time Record (DTR) feature relies on student-submitted entries validated by company supervisors and does not include biometric, GPS-based, or automated attendance tracking.

·       AI functionality is assistive and non-autonomous. The AI-assisted validation feature only flags potential document issues and does not make approval decisions. Final authority remains with practicum advisers and administrators.

·       The system does not integrate with external company or government systems. Integration with company attendance systems, payroll platforms, biometric devices, or government databases is outside the scope of this study.

  

## Review of Related Literature/Studies/Systems

## I. Local Literature (Philippines)

A cloud‑based practicum monitoring and performance evaluation system developed in a Philippine tertiary institution demonstrated that digitizing practicum requirements significantly reduced paper usage and improved accessibility for both students and advisers. The system allowed centralized submission and monitoring of practicum documents, making progress tracking more systematic. However, despite improvements in organization, the study revealed that document checking and approval still depended on manual verification, leading to repeated revisions and continued processing delays. This indicates the need for assistive automation to further reduce adviser workload and improve turnaround time, which the proposed system addresses through AI‑assisted validation (Sobrevega, Sanchez, & Bolo, 2022).

An internship program management information system utilizing lean management principles showed that web‑based platforms effectively reduced processing time and administrative costs in managing student internships. The system improved coordination between students, supervisors, and coordinators by centralizing records and reports. Nevertheless, the study noted that advisers still had to manually inspect submitted documents for errors and completeness, limiting the extent of efficiency gains. This finding supports the integration of intelligent validation tools to complement workflow optimization (Del Rosario & Dela Cruz, 2022).

A Philippine study on records digitization for state universities and colleges found that web‑based document systems enhanced data security, reduced the risk of document loss, and improved accessibility for authorized users. While effective for long‑term record keeping and accreditation purposes, the system did not support dynamic practicum workflows such as frequent submissions, iterative revisions, or real‑time compliance monitoring. This gap highlights the need for a practicum‑specific platform that integrates document processing with intelligent assistance (Pardiñan, Bondad, & Mangubat, 2025).

An RFID‑based student attendance monitoring system implemented in a Philippine higher education institution demonstrated the advantages of automation in reducing manual administrative tasks. The system improved monitoring accuracy and reduced time spent recording attendance. However, the study focused solely on attendance and did not address document‑intensive academic processes such as practicum compliance, indicating the need for systems that extend automation beyond attendance verification (Nueva et al., 2024).

A web‑based student portal developed in a private Philippine college improved efficiency in handling student records and academic transactions. The study emphasized improved accessibility and centralized storage but noted that document validation remained entirely manual. These findings suggest that while web‑based systems improve organization, intelligent document checking is necessary to significantly alleviate adviser workload and reduce submission errors (Espadilla et al., 2024).

## II. Local Studies / Systems (Philippines)

Local literature discussing practicum implementation in Philippine higher education describes persistent challenges associated with paper‑based document submission and face‑to‑face processing. These include frequent student consultations, delayed feedback, and difficulty tracking compliance across multiple requirements. Authors consistently argue that these inefficiencies negatively affect both students and advisers, underscoring the demand for more structured and technology‑enabled practicum systems (Manicio & Baetiong, 2023).

Policy literature issued by the Commission on Higher Education promotes the adoption of digital systems to improve transparency, efficiency, and accountability in academic administration. While these policies encourage digital transformation, they do not prescribe specific implementations, leaving institutions responsible for developing systems that align with their operational needs such as practicum documentation workflows (Commission on Higher Education, 2021–2024).

Studies on educational digitization in Philippine universities emphasize that many institutions implement basic repository‑style systems without reengineering processes. Such approaches often fail to reduce administrative workload because document checking, approval, and follow‑ups remain manual. This supports the argument that digitization must be combined with intelligent workflow support to achieve meaningful improvements (Pardiñan et al., 2024).

Research on cloud‑based academic systems in the Philippine context highlights their scalability, accessibility, and suitability for document‑heavy processes. However, authors stress that cloud platforms alone do not address submission errors or repetitive revisions unless integrated with automated validation and feedback mechanisms, reinforcing the relevance of AI‑assisted systems (Sobrevega et al., 2022).

Literature examining the use of QR and RFID technologies in Philippine academic institutions shows that automation effectively reduces manual workload and improves system reliability. Despite these benefits, the studies acknowledge that these technologies are typically limited to attendance monitoring and do not support complex document compliance processes such as those required in practicum administration (Agripa & Astillero, 2022).

## III. Foreign Literature

An external case study from Indonesia examined a web‑based student internship monitoring information system developed to replace manual coordination through messaging platforms and paper‑based journals. The literature emphasized that shifting internship documentation, attendance logs, and activity reports to an online platform significantly enhanced data organization and supervisor oversight. However, the discussion revealed that supervisors were still required to manually review submissions, indicating that while web‑based systems improve accessibility and monitoring, the absence of intelligent validation limits administrative efficiency. This finding supports the relevance of integrating AI assistance into practicum management systems to reduce repetitive manual checking (Dewi & Hanifah, 2024).

A journal article focusing on the development of a web‑based internship information system highlighted how digital platforms can support end‑to‑end internship workflows, including application, documentation, and monitoring. The study stressed that online systems improve transparency and traceability of internship records compared to traditional methods. Nevertheless, the literature noted that document verification and approval processes remained dependent on human intervention, reinforcing the growing need for AI‑assisted features to enhance accuracy and reduce processing time in document‑heavy academic systems (Banisar & Rachmadi, 2022).

An international study on digital transformation in internship supervision and evaluation explored how a centralized web‑based information system could address the inefficiencies of manual practicum record‑keeping in higher education. The literature identified key problems in traditional systems, including frequent campus visits, scattered documents, and lack of a common communication platform. The proposed digital solution demonstrated improved efficiency and coordination but emphasized that document checking remained a labor‑intensive task for supervisors, underscoring the potential value of AI‑assisted document management in such systems (Assalaarachchi et al., 2025).

A recent IEEE‑published article discussed the design of a web‑based internship management platform aimed at improving coordination between academic institutions, students, and industry partners. The literature highlighted that web‑based systems can significantly reduce administrative delays by centralizing submissions, evaluations, and monitoring. However, it also noted that many existing platforms focus on workflow automation without addressing the quality and correctness of submitted documents. This gap validates the importance of integrating intelligent document analysis into internship systems to enhance reliability and reduce errors (IEEE, 2023).

A peer‑reviewed article on an online practicum evaluation management system emphasized the increasing demand for secure and organized digital platforms as practicum student populations grow. The literature demonstrated that web‑based evaluation systems improve the speed and consistency of assessment processes compared to paper‑based methods. Despite these advantages, the study acknowledged that validation of submitted materials still relied on manual review, reinforcing the view that combining web‑based systems with AI‑assisted support offers a more advanced solution for practicum documentation and monitoring (Osman et al., 2023).

## IV. Foreign Studies / Systems

A systematic review of artificial intelligence in education found that AI applications are most effective when used to support administrative efficiency and reduce repetitive human tasks. The review emphasized that AI‑assisted validation improves processing speed and consistency without replacing human judgment, aligning with the objectives of the proposed system (Garzón, Patiño, & Marulanda, 2025).

A meta‑synthesis of AI‑in‑education literature revealed that recent AI adoption in higher education focuses largely on administrative support rather than instructional functions. The study highlighted document processing and compliance monitoring as underutilized but promising application areas for AI, reinforcing the relevance of AI‑assisted practicum systems (Mustafa et al., 2024).

UNESCO’s guidance on AI in education emphasizes responsible and transparent integration of AI technologies to support institutional processes. The framework recommends AI as an assistive tool that enhances efficiency while maintaining human oversight, directly supporting the proposed system’s design approach (UNESCO, 2021).

A systematic literature review on artificial intelligence in education identified document analysis and administrative automation as emerging application areas. The authors concluded that AI‑supported systems reduce staff workload and error rates when implemented ethically and incrementally (Boussouf et al., 2024).

A policy‑oriented analysis on AI and digital transformation in education argued that AI‑enabled platforms strengthen institutional workflows by improving efficiency and resilience. The report emphasized administrative automation as a key driver of educational digital transformation, validating the direction of the proposed practicum system (Arias‑Ortiz et al., 2025).

# METHODologY

Figure 1: Prototyping Software Development Life Cycle (SDLC)

The Prototyping Software Development Life Cycle (SDLC) model will be used in the development of the Web‑Based Practicum System with AI‑Assisted Validation and Compliance Monitoring for STI Marikina Through prototyping, system requirements are clarified, user expectations are validated, and functional improvements are incorporated early in the development process. This approach is particularly suitable for practicum systems, where workflows and user interactions require continuous evaluation and adjustment.

Phases of Prototyping

1. Requirements Gathering and Analysis

This phase involves collecting detailed information about the current practicum process and identifying system requirements.

Activities:

Conduct interviews and questionnaires with:

·       Practicum advisers

·       Practicum administrator (e.g., MOA approver)

Identify:

·       Document submission workflows

·       MOA processing steps

·       Common errors and delays

Analyze:

·       Student population (tertiary and SHS)

·       Volume of documents

2. Initial Prototype Development

A basic version of the system is developed to demonstrate key features and workflows.

Activities:

Design initial user interfaces:

·       Student dashboard

·       Adviser dashboard

·       Admin panel

Develop core features:

·       Document upload

·       Status tracking

·       Basic validation rules

Create workflow models:

Submission → Review → Approval

3. Prototype Evaluation (User Feedback)

The prototype is presented to stakeholders for evaluation and feedback.

Activities:

Show prototype to:

·       Practicum advisers

·       Administrator

Collect feedback on:

·       Usability

·       Clarity of workflow

·       Missing features

Identify issues such as:

·       confusing interfaces

·       missing validation rules

4. Prototype Refinement

The system is improved based on stakeholder feedback.

Activities:

Revise UI design for clarity

Improve:

·       document validation logic

·       MOA tracking features

·       notification system

Add:

·       AI‑assisted validation rules

·       MOA deadline alerts

5. Final System Development and Implementation

The refined prototype is converted into the final working system.

Activities:

Complete all modules:

·       Student

·       Adviser

·       Admin

Implement:

·       database integration

·       authentication

·       document storage

Test system functionality:

·       uploads

·       approvals

·       Notifications

6. System Testing and Evaluation

The completed system is tested to ensure performance and usability.

Activities:

Conduct:

·       functionality testing

·       usability testing

Evaluate based on:

·       efficiency

·       accuracy

·       user satisfaction

## Technical Background

Technologies to be Used

This section presents the technologies utilized in the development and implementation of the Web‑Based Practicum System with AI for STI Marikina. The selected technologies reflect current industry standards and best practices in web development, database management, and artificial intelligence. These tools were chosen to ensure system scalability, performance, security, and ease of maintenance while effectively addressing the challenges of the existing face‑to‑face and paper‑based practicum process.

**Frontend Development**

The frontend of the system is responsible for providing an intuitive, responsive, and user‑friendly interface for students, practicum advisers, and administrators.

HTML5, CSS3, JavaScript, and TypeScript v5.4.5

HTML5 and CSS3 are used to structure and style the web pages of the system, while JavaScript and TypeScript are used to implement dynamic behaviors and client‑side logic. TypeScript, a statically typed superset of JavaScript, enhances code reliability and maintainability by enabling type checking and early error detection during development. The use of TypeScript helps reduce runtime errors and improves long‑term scalability of the frontend codebase.

React.js v18.3.1 via Next.js v15.1.0

React.js, implemented through the Next.js framework, is used to build dynamic and component‑based user interfaces. This approach allows for efficient rendering of system pages, improved performance, and better code organization. Next.js provides both frontend rendering and backend capabilities, reducing overall system complexity and improving development efficiency.

Tailwind CSS v3.4.4

Tailwind CSS is used as the utility‑first CSS framework for styling the system. It enables rapid UI development using predefined classes, ensures consistent design throughout the application, and improves responsiveness across different screen sizes. This contributes to better usability and a cleaner interface for end users.

**Backend Development**

Backend technologies manage the system’s logic, database communication, authentication, and processing of practicum data.

Next.js API Routes v15.1.0

Next.js API Routes are used to implement server‑side logic such as handling form submissions, document requests, authentication workflows, and communication between the frontend and the database. This unified full‑stack approach simplifies system architecture and improves maintainability.

Node.js v20.14.0 LTS

Node.js is used as the server‑side runtime environment to handle asynchronous requests efficiently. Its non‑blocking architecture allows the system to manage multiple users simultaneously, supporting high concurrency during periods of heavy document submission and review.

Supabase v2.43.4(PostgreSQL v15.6)

Supabase is used as the backend‑as‑a‑service platform, with PostgreSQL as the relational database management system. PostgreSQL provides reliable, structured data storage for user accounts, practicum requirements, document records, and system logs. Supabase also offers built‑in authentication, role‑based access, and object storage, which are essential for securing practicum documents and managing user permissions.

**Artificial Intelligence and APIs**

Artificial Intelligence technologies are integrated to assist in document validation and system automation while maintaining human oversight.

Groq API

The Groq API is used to support AI‑assisted document analysis, such as detecting missing information, checking consistency, and evaluating the completeness of uploaded practicum requirements. This assists advisers by reducing repetitive manual checking tasks and improving process efficiency.

Groq Whisper API

The Groq Whisper API is utilized for speech‑to‑text functionality, which can support features such as transcribing recorded adviser feedback or student explanations when applicable. This enhances accessibility and supports future system extensibility.

**Developer Tools**

Developer tools are used to support efficient coding, collaboration, testing, and system debugging.

Visual Studio Code v1.93+

Visual Studio Code serves as the primary integrated development environment (IDE) due to its support for JavaScript, TypeScript, and modern web frameworks. It provides debugging tools, extensions, and syntax highlighting that improve development productivity.

Git v2.45.2 and GitHub

Git is used for version control, while GitHub is used for repository hosting and collaboration. These tools ensure proper source code management, version tracking, and teamwork throughout the system development lifecycle.

Postman v11.x

Postman is used to test API endpoints, validate backend logic, and debug system requests. This ensures that data exchange between frontend, backend, and external APIs functions correctly.

**Deployment and Hosting**

Deployment technologies ensure that the system is accessible, scalable, and reliable.

Vercel CLI v37+

Vercel is used for deploying the Next.js application. It provides continuous deployment, serverless infrastructure, and optimized performance for web applications, enabling fast loading times and easy updates.

Supabase Hosting

Supabase also provides database hosting, authentication services, and secure storage for uploaded documents. Its cloud‑based infrastructure supports scalability and ensures system availability.

**Calendar of Activities**

This section presents the detailed timeline and sequence of activities involved in completing the proposed system. Each activity includes its purpose, the persons involved, and the projected schedule arranged in chronological order. The calendar serves as a structured guide to ensure the systematic progress of the capstone project from conceptualization to deployment and documentation

Table 1: Gantt chart of activities

**Flowcharts**

**Figure 2: FlowChart: Role-Based Access & Routing Flow**

 **Figure 3: FlowChart: Adviser Module Final Report & Data Export Flow Chart**

**Figure 4: FlowChart: Admin Module Final Report & Data Export Flow Chart**

**Figure 5: FlowChart: Student Module Document Submission & AI Validation Flow Chart**

**Figure 6: FlowChart: Adviser Module**

**Figure 7: FlowChart: Student Module**

**Figure 8: Flow Chart: Admin Module**

**Figure 9: Flow Chart: Supervisor Module**

**Figure 10: Flow Chart: File Storage Module**

**Figure 11: Web-based Practicum System Use Case Diagram**

**Figure 12: Web-based Practicum System Current Context Diagram**

**Figure 13: Web-based Practicum System Proposed Context Diagram**

**Figure 14: Dataflow Diagram Level 1**

**Figure 15: Web-based Practicum System ERD Diagram**

**Figure 16: Web-based Practicum System HIPO Diagram & Web-based Practicum System Hierarchical Input and Output**  

**Resources**

Hardware Resources

The following hardware resources are necessary to support system development and testing:

·       Personal Computer or Laptop

·       Processor: Intel Core i5 (8th generation or higher) or AMD Ryzen 5 (or equivalent)

·       Memory (RAM): Minimum of 8 GB RAM to support concurrent execution of development tools, browsers, and local servers

·       Storage: At least 256 GB SSD for faster boot times, efficient code compilation, and file management

·       Operating System: Windows 10 or later.

·       Graphics: Integrated graphics (dedicated GPU not required)

·       Display: Minimum resolution of 1366 × 768 for effective code editing and interface testing

·       Internet Connection

A stable internet connection is required for accessing online repositories, APIs, cloud services, databases, documentation, and deployment platforms.

·       Peripheral Devices

Basic peripherals such as a keyboard, mouse, and monitor are needed to support efficient system development and documentation. Optional devices such as microphones may be used for testing speech‑to‑text functionality through AI APIs.

Software Resources

The following software resources are required for system development, testing, and deployment:

Frontend and Backend Development Tools

·       Web Browser (Google Chrome, Mozilla Firefox, or equivalent)

Used for system testing, debugging, and validation of user interfaces.

·       Node.js Runtime Environment

Required to execute backend services, API routes, and server‑side logic. STI College            Marikina

·       Next.js Framework

Used to develop both the frontend and backend components of the system.

·       React.js

Utilized for building dynamic, component‑based user interfaces.

·       Tailwind CSS

Used for responsive and consistent UI styling.

Database and Backend Services

·       Supabase Platform (PostgreSQL)

Provides database hosting, authentication, and object storage for managing user                 accounts, practicum records, and uploaded documents.

Artificial Intelligence and API Services

·       Groq API

Used for AI‑assisted document validation and content analysis.

·       Groq Whisper API

Used for speech‑to‑text processing where applicable

Development and Collaboration Tools

·       Visual Studio Code

Serves as the primary integrated development environment (IDE) for writing and                  managing source code.

·       Git Version Control System

Used to manage source code versions and track changes throughout development.

·       GitHub Repository

Used for code storage, collaboration, and project management.

·       Postman

Used to test and validate API endpoints and backend services.

Deployment and Hosting

·       Vercel

Used for deploying and hosting the Next.js web application. 

·       Supabase Hosting Services

Used for database hosting and secure storage of files and records.

Documentation Tools

·       Microsoft Word

Used for writing project documentation, reports, and manuals.

·       Draw.io

Used to create system diagrams and design models.

## Requirements Analysis

The proposed Web‑Based Practicum System with AI for STI Marikina is designed to address the limitations of the current face‑to‑face and paper‑based practicum process by providing a centralized, role‑based, and intelligent digital solution. The system requirements are derived from the needs of identified stakeholders, operational workflows, and system constraints.

Who:

·       Students – submit, track, and revise practicum requirements

·       Practicum Advisers – oversee batches and compliance status

·       System Administrators – manage users, templates, and system settings

What

·       Submission of practicum documents (resume, MOA, endorsement letter, DTR, reports)

·       Review, approval, and feedback on submitted documents

·       Monitoring of student compliance and practicum progress

·       Storage and retrieval of practicum records

·       Generation of practicum‑related reports

Where

·       Web‑based platform accessible via computers and mobile devices

·       Used on‑campus, off‑campus, and at partner companies

·       Requires internet connection for system access

When

·       Pre‑deployment submission and approval

·       During‑deployment monitoring and reporting

·       Deadline‑driven review and feedback cycles

·       Post‑deployment clearance and documentation

How

·       Current: Manual submission of printed documents, in‑person validation, handwritten tracking

·       Proposed: Online submission, AI‑assisted document checking, digital status tracking, and centralized monitoring

## Requirements Documentation

Functional Requirements

Student Functional Requirements

·       The system shall allow students to create and manage a practicum profile.

·       The system shall allow students to upload practicum documents in digital format.

·       The system shall display the submission status of each practicum requirement.

·       The system shall notify students of missing, returned, or approved documents.

·       The system shall allow students to submit revisions of returned requirements.

·       The system shall allow students to submit during‑practicum documents such as DTRs and weekly reports.

            Practicum Adviser Functional Requirements

·       The system shall allow advisers to view assigned students and their compliance status.

·       The system shall allow advisers to review submitted documents.

·       The system shall allow advisers to approve, reject, or return documents with remarks.

·       The system shall allow advisers to generate endorsement letters using predefined templates.

·       The system shall allow advisers to monitor student progress throughout the practicum period.

·       The system shall display AI‑generated alerts for potential document issues.

            Administrator Functional Requirements

·       The system shall allow administrators to manage user accounts and roles.

·       The system shall allow administrators to upload and manage official document templates.

·       The system shall allow administrators to create practicum terms and assign advisers.

·       The system shall allow the administrator to configure MOA processing deadlines.

·       The system shall generate automated notifications for approaching MOA deadlines.

·       The system shall generate consolidated reports for practicum compliance.

·       The system shall maintain an audit trail of user actions.

            AI‑Assisted Functional Requirements

·       The system shall automatically check uploaded documents for required fields.

·       The system shall flag formatting inconsistencies and missing information.

·       The system shall classify submitted documents based on type.

·       The system shall assist advisers by highlighting documents that require attention.

Non‑Functional Requirements

Usability Requirements

·       The system shall have an intuitive and user‑friendly interface.

·       The system shall require minimal training for users.

·       The system shall clearly display instructions and submission guidelines.

            Performance Requirements

·       The system shall process document uploads within acceptable response time.

·       The system shall support concurrent access by multiple users.

·       The system shall display real‑time submission status updates.

            Security Requirements

·       The system shall require user authentication for access.

·       The system shall enforce role‑based access control.

·       The system shall protect stored documents from unauthorized access.

·       The system shall retain submission history for accountability.

            Reliability Requirements

·       The system shall ensure data integrity during uploads and updates.

·       The system shall store practicum records securely for future retrieval.

·       The system shall minimize system downtime during operation.

            Scalability Requirements

·       The system shall support increasing numbers of student users.

·       The system shall allow system enhancements without major rework.

            Constraints and Limitations

·       The system shall not capture real‑time biometric or GPS‑based attendance.

·       The system shall rely on student‑submitted DTR entries validated by supervisors.

·       The system shall operate only within the policies of STI Marikina.

## Design of Software, System, Product, and/or Processes

In this part, the proponents shall describe in detail how they will design the proposed system in accordance with standards.

Story Board

Figure 15. Landing Page StoryBoard

Figure 16. Story Board for Student Login Page

& Verify Code

Figure 17.Story Board for Reset Password Request

Figure 18.Story  Board for Student Resume

Figure 19. Story  Board for Student AI Assistance

Figure 20. Story Board for Adviser Dashboard

Figure 21. Story Board for Student Class Progress

Figure 22.Story  Board for Advisers Review

Figure 23. Story  Board for Advisers Document Review

Figure 24.Story  Board for Admin Dashboard

Figure 25.Story  Board for Admin Accounts

Figure 26.Story  Board for Admin Templates

Figure 27.Story Board for Admin Documents

Figure 28. Story Board for Admin Announcements

Figure 29. Story Board for Admin Report

# References

Arias-Ortiz, E., Castro, N., Forero, T., Gambi, G., Giambruno, C., Pérez-Alfaro, M., & Rodríguez-Segura, D. (2025). _AI and education: Building the future through digital transformation_. Inter-American Development Bank. https://publications.iadb.org/publications/english/document/AI-and-Education-Building-the-Future-Through-Digital-Transformation.pdf

Commission on Higher Education. (2021–2024). _CHED memorandum orders_. https://www.ched.gov.ph/2021-ched-memorandum-orders/

Del Rosario, M. N., & Dela Cruz, R. A. (2022). Internship program management information system with lean management. _International Journal of Information and Education Technology, 12_(1), 7–14. https://www.ijiet.org/show-165-1953-1.html

Espadilla, J. B., Evangelista, J. M. R., Pangilinan, T. P. I., Tolentino, P. J. N., & Nunag, A. A. (2024). _A web-based RFID system for contactless student portal_. City College of Angeles. https://www.cca.edu.ph/assets/images/1-rfid%20system.pdf

Garzón, J., Patiño, E., & Marulanda, C. (2025). Systematic review of artificial intelligence in education: Trends, benefits, and challenges. _Multimodal Technologies and Interaction, 9_(8), 84. https://doi.org/10.3390/mti9080084

Liew, S. H., & Yusof, S. M. (2022). Design and development of UUM internship monitoring system: A web-based application for monitoring practicum students. _International Journal of Undergraduate Research, 3_(1), 43–48. https://ijurjournal.weebly.com/uploads/2/6/8/1/26810285/31072022-ijur-43-48.pdf

Mustafa, M. Y., Tlili, A., Lampropoulos, G., Huang, R., & Kinshuk. (2024). A systematic review of literature reviews on artificial intelligence in education. _Smart Learning Environments, 11_, 59. https://doi.org/10.1186/s40561-024-00350-5

Nueva, C. H., Tapic, F. M. J., Pineda, I. T., Melendrez, J. K. T., Jimena, P. C., & Alquiza, R. J. (2024). RFID-based student attendance monitoring system with SMS notification using Arduino. _Ascendens Asia Singapore – Bestlink College of the Philippines Journal of Multidisciplinary Research, 3_(1A). https://ojs.aaresearchindex.com/index.php/aasgbcpjmra/article/view/12810

Pardiñan, E. G., Bondad, R. M., & Mangubat, J. C. (2025). Records digitization in Philippine state universities and colleges. _Education and Information Technologies, 30_, 11127–11150. https://doi.org/10.1007/s10639-024-13256-z

UNESCO. (2021). _AI and education: Guidance for policy-makers_. https://unesdoc.unesco.org/ark:/48223/pf0000376709

Assalaarachchi, L., Rambukwella, T., Ranasinghe, G., Silva, K., & Hewagamage, C. (2025). Streamlining the internship supervision and evaluation through digital transformation. _Education and Information Technologies, 30_, 1073–1088. https://doi.org/10.1007/s10639-024-13158-0

Banisar, B., & Rachmadi, P. (2022). Development of a web-based internship information system. _International Journal of Applied Engineering and Management, 4_(1), 1–10. https://ijaem.net/issue_dcp/Develop%20of%20Web%20Based%20Internship%20Information%20System.pdf

Dewi, F. K., & Hanifah, R. N. (2024). Web-based student internship monitoring information system (case study: SMK Ma’arif NU 2 Boyolali). _IC-ITECHS Journal, 5_(1). https://doi.org/10.32664/ic-itechs.v5i1.1705

Institute of Electrical and Electronics Engineers. (2023). Revolutionizing higher education internship: A development of a web-based internship management system. _IEEE Xplore_. https://ieeexplore.ieee.org/document/10589220

Osman, B., Uddin, M. R., Chit, S. C., Rahmat, A. R., & Abuzaraida, M. A. (2023). Developing an online practicum evaluation management system. _Journal of Digital System Development, 1_, 24–37. https://doi.org/10.32890/jdsd2023.1.3

  

Appendices

  

Appendix A. resource PERSONS  

APPENDIX B. PERSONAL TECHNICAL VITAE        

                                              APPENDIX C. LETTERS    

This image shows a formal letter addressed to Mr. Dave Lord M. Rubaya requested him to become our Project Adviser.

                                            APPENDIX D. JOURNAL     

                          APPENDIX E. INTERVIEW QUESTIONNAIRE

Web‑Based Practicum System with AI‑Assisted Validation and Compliance Monitoring for STI Marikina

A. Document Volume & Workflow Load (Quantitative)

1. Approximately how many practicum students do you handle per semester?

2. On average, how many documents does each student submit before deployment?

3. How many documents does each student submit during deployment (weekly, monthly, and

final)?

4. In a typical semester, how many total practicum documents do you process?

5. How many hours per week do you spend reviewing or checking student documents?

6. How many hours per week are spent on face‑to‑face document-related consultations with

students?

7. How often do you receive incorrect or incomplete documents from students (per student or

per week)?

8. On average, how many revisions does a single student document undergo before approval?

9. How many MOAs do you process per semester?

10. How many days does it usually take to complete one MOA routing cycle?

B. Time Delays & Inefficiencies (Quantifiable Pain Points)

1. How long does it take you, on average, to check and give feedback on one submission?

(minutes or hours)

2. How long does it take students to receive corrections through the current system?

(hours/days)

3. How many times per week do you need to remind students about missing requirements?

4. What percentage of students fail to submit a requirement on time due to confusion or

unclear instructions?

5. How many instances have you encountered where documents were lost or misplaced

within a semester?

C. Manual vs Digital Processing (Quantifiable Digital Capability)

1. What percentage of your practicum workflow is currently done manually (paper,

face‑to‑face)?

2. What percentage is already digital (emails, forms, LMS, shared drive)?

3. How often do you use digital tools for practicum work (daily, weekly, monthly)?

4. How many platforms or apps do you use to manage practicum communication and

documents?

5. How many times do you need to physically route documents to other offices each

semester?

D. Advisers’ Readiness & System Feasibility Indicators

1. What percentage of students you handle struggle with formatting or using the correct

templates?

2. How many hours per semester would you estimate are wasted due to repeat submissions?

3. How many late submissions are related to students being unable to visit campus?

4. What percentage reduction in workload would you expect if submission was fully online?

5. What percentage of document errors do you believe could be prevented with AI-assisted

Validation?

E. Need for Automation (Priorities, Quantifiable)

1. If automated, how much time do you think you could save per student document?

2. Rank the difficulty of processing documents manually on a scale of 1–10.

3. What are the top three tasks you wish to automate (ranked by impact or frequency)?

4. What percentage of students have difficulty understanding practicum requirements without

a centralized guide?

5. Overall, how necessary is a Web-Based Practicum System with AI for reducing your

workload? (1–10 scale

APPENDIX F.

Transcript of Questionnaires for Adviser – Ms. Emilou Magnaye

  

  

  

  

APPENDIX F.

Transcript of Questionnaires for Adviser – Ms. Regina Kate Dominguez

  

  

  

  

  

APPENDIX F.

Transcript of Questionnaires for Adviser – Mr. Michael Sayson

APPENDIX G.

Student Survey

_Submitting practicum documents in hard copy is inconvenient and time-consuming._

_I often need to visit the campus personally just to submit or correct practicum requirements._

_Printing, photocopying, and reprinting documents for practicum creates additional expenses for me._

_The current manual process causes delays in my practicum approval._

_It is difficult to track my submitted documents because everything is paper-based._

_It is difficult to track my submitted documents because everything is paper-based._

_Receiving feedback from practicum advisers often takes time due to the manual process._

_I sometimes get confused about which documents I still need to submit or revise._

_Communication about practicum requirements is not always clear or consistent._

_Managing practicum documents across different platforms (Messenger, email, hard copies) is difficult._

_I sometimes receive document corrections related to formatting, missing signatures, or incorrect details._

_It is difficult to keep track of my hours, reports, and required practicum activities._

_I worry that my documents may get lost, misplaced, or mixed up._

_The current system does not allow me to easily monitor my progress or remaining requirements._

_I prefer submitting practicum requirements online instead of printing them._

_AI-assisted checking can help identify missing details in my documents before submission._

_AI tools would reduce the need for multiple document revisions._

                                                     Curriculum Vitae of

<GIVEN NAME MI. FAMILY NAME>

<complete address>

<email address>

contact number either cellular phone or landline or both

EDUCATIONAL BACKGROUND

|   |   |   |
|---|---|---|
|Level|Inclusive Dates|Name of school/ Institution|
|Tertiary|month year||
|Vocational/Technical|month year||
|High School|month year||
|Elementary|month year||

PROFESSIONAL OR VOLUNTEER EXPERIENCE

|   |   |   |
|---|---|---|
|Inclusive Dates|Nature of Experience/<br><br>Job Title|Name and Address of Company or Organization|
|month year|||
|month year|||
|month year|||
|month year|||

Listed in reverse chronological order (most recent first).

AFFILIATIONS

|   |   |   |
|---|---|---|
|Inclusive Dates|Name of Organization|Position|
|month year|||
|month year|||
|month year|||
|month year|||

Listed in reverse chronological order (most recent first).

  
SKILLS

|   |   |   |
|---|---|---|
|SKILLS|Level of Competency|Date Acquired|
|||month year|
|||month year|
|||month year|

TRAININGS, SEMINARS, OR WORKSHOPS ATTENDED

|   |   |
|---|---|
|Inclusive Dates|Title of Training, Seminar, or Workshop|
|month year||
|month year||
|month year||
|month year||

Listed in reverse chronological order (most recent first).