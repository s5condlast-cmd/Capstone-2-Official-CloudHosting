// Template Generator Utility
// Generates downloadable DOCX-style HTML documents for STI College Marikina Practicum

const STI_HEADER = `
  <div style="text-align:center;border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:24px;">
    <h2 style="margin:0;font-size:16px;letter-spacing:3px;text-transform:uppercase;">STI College Marikina</h2>
    <p style="margin:4px 0 0;font-size:11px;color:#666;">Sumulong Highway, Sto. Niño, Marikina City</p>
    <p style="margin:2px 0 0;font-size:11px;color:#666;">Tel: (02) 8682-1234 | practicum@stimarikina.edu.ph</p>
  </div>
`;

const PAGE_STYLE = `
  <style>
    @page { margin: 1in; size: A4; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6; color: #111; margin: 0; padding: 40px; }
    h1 { font-size: 16pt; text-align: center; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 24px; }
    h2 { font-size: 14pt; margin: 20px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    h3 { font-size: 12pt; margin: 16px 0 6px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #333; padding: 6px 10px; text-align: left; font-size: 11pt; }
    th { background: #f5f5f5; font-weight: bold; }
    .field { border-bottom: 1px solid #333; min-width: 200px; display: inline-block; margin: 0 4px; }
    .field-long { border-bottom: 1px solid #333; width: 100%; display: block; margin: 4px 0; min-height: 20px; }
    .sig-line { border-top: 1px solid #333; width: 250px; margin-top: 40px; padding-top: 4px; text-align: center; }
    .section { margin: 20px 0; }
    .note { font-size: 10pt; color: #666; font-style: italic; margin: 8px 0; }
    ul { margin: 4px 0 12px 20px; }
    li { margin: 2px 0; }
  </style>
`;

function downloadTemplate(content: string, filename: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title>${PAGE_STYLE}</head><body>${content}</body></html>`;
  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadResumeTemplate() {
  const content = `
    ${STI_HEADER}
    <h1>Practicum Resume</h1>

    <h2>I. Personal Information</h2>
    <table>
      <tr><td style="width:35%"><strong>Full Name:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Address:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Contact Number:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Email Address:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Date of Birth:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Civil Status:</strong></td><td><span class="field">&nbsp;</span></td></tr>
    </table>

    <h2>II. Educational Background</h2>
    <table>
      <tr><th>Level</th><th>School Name</th><th>Year Graduated</th></tr>
      <tr><td>College</td><td>STI College Marikina</td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td>Senior High</td><td><span class="field">&nbsp;</span></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td>Junior High</td><td><span class="field">&nbsp;</span></td><td><span class="field">&nbsp;</span></td></tr>
    </table>

    <h2>III. Course & Section</h2>
    <p>Program: <span class="field">&nbsp;</span> &nbsp; Section: <span class="field">&nbsp;</span> &nbsp; School Year: <span class="field">&nbsp;</span></p>

    <h2>IV. Technical Skills</h2>
    <p class="note">(List programming languages, tools, frameworks, and software you are proficient in)</p>
    <div class="field-long" style="min-height:60px;">&nbsp;</div>

    <h2>V. Certifications & Seminars</h2>
    <table>
      <tr><th>Title</th><th>Issuing Organization</th><th>Date</th></tr>
      <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    </table>

    <h2>VI. Work / OJT Experience</h2>
    <table>
      <tr><th>Company</th><th>Position</th><th>Duration</th></tr>
      <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    </table>

    <h2>VII. Character References</h2>
    <table>
      <tr><th>Name</th><th>Position / Relationship</th><th>Contact</th></tr>
      <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    </table>

    <br/><p class="note">I certify that the above information is true and correct to the best of my knowledge.</p>
    <br/>
    <div class="sig-line">Signature over Printed Name</div>
  `;
  downloadTemplate(content, 'STI_Resume_Template');
}

export function downloadConsentTemplate() {
  const content = `
    ${STI_HEADER}
    <h1>Letter of Consent</h1>
    <h3 style="text-align:center;font-weight:normal;margin-top:-16px;">(Parental / Guardian Consent for On-the-Job Training)</h3>

    <br/>
    <p>Date: <span class="field">&nbsp;</span></p>
    <br/>
    <p><strong>The Practicum Coordinator</strong><br/>STI College Marikina<br/>Sumulong Highway, Sto. Niño, Marikina City</p>
    <br/>
    <p>Dear Sir/Madam,</p>
    <br/>
    <p>I, <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, of legal age, and the parent/guardian of <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, a student of STI College Marikina currently enrolled in <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> (Course/Section), do hereby give my full consent for my son/daughter to undergo the On-the-Job Training (OJT) / Practicum program as required by the school.</p>

    <br/>
    <p>I understand that my son/daughter will be deployed to:</p>
    <table>
      <tr><td style="width:35%"><strong>Company Name:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Company Address:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>OJT Duration:</strong></td><td><span class="field">&nbsp;</span> (122 hours per semester)</td></tr>
    </table>

    <br/>
    <p>I am fully aware of the nature, scope, and risks involved in the training and I agree to assume full responsibility for any eventualities that may arise during the entire duration of the practicum.</p>

    <br/>
    <p>I also certify that my son/daughter is in good health and is physically fit to undertake the training program.</p>

    <br/><br/>
    <p>Respectfully,</p>
    <br/><br/>
    <div class="sig-line">Parent / Guardian Signature</div>
    <p style="margin-top:8px;">Printed Name: <span class="field">&nbsp;</span></p>
    <p>Contact Number: <span class="field">&nbsp;</span></p>
    <p>Relationship to Student: <span class="field">&nbsp;</span></p>

    <br/>
    <h3>Student's Conforme:</h3>
    <div class="sig-line">Student Signature over Printed Name</div>
  `;
  downloadTemplate(content, 'STI_Letter_of_Consent_Template');
}

export function downloadMOATemplate() {
  const content = `
    ${STI_HEADER}
    <h1>Memorandum of Agreement</h1>
    <h3 style="text-align:center;font-weight:normal;margin-top:-16px;">(On-the-Job Training / Practicum Partnership)</h3>
    <br/>

    <p><strong>KNOW ALL MEN BY THESE PRESENTS:</strong></p>
    <br/>
    <p>This Memorandum of Agreement (MOA) is entered into by and between:</p>
    <br/>
    <p><strong>STI College Marikina</strong>, represented by its School Administrator, hereinafter referred to as the <strong>"SCHOOL"</strong>;</p>
    <p style="text-align:center;margin:12px 0;">— and —</p>
    <p><span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, represented by <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, hereinafter referred to as the <strong>"COMPANY"</strong>.</p>

    <br/>
    <h2>Article I — Purpose</h2>
    <p>This agreement establishes the partnership between the SCHOOL and the COMPANY for the deployment of students for On-the-Job Training (OJT) / Practicum, as part of the academic requirement of their respective programs.</p>

    <h2>Article II — Responsibilities of the School</h2>
    <ul>
      <li>Assign a Practicum Adviser to oversee and monitor the student's progress.</li>
      <li>Ensure that the student has completed all pre-deployment requirements.</li>
      <li>Provide the COMPANY with the official endorsement letter and student information.</li>
      <li>Coordinate with the COMPANY regarding the student's training schedule.</li>
    </ul>

    <h2>Article III — Responsibilities of the Company</h2>
    <ul>
      <li>Provide a safe and conducive working environment for the student trainee.</li>
      <li>Assign a Company Supervisor to guide and evaluate the student.</li>
      <li>Allow the student to complete the required 122 hours per semester of training.</li>
      <li>Issue a Certificate of Completion and Evaluation upon fulfillment of the training.</li>
    </ul>

    <h2>Article IV — Responsibilities of the Student</h2>
    <ul>
      <li>Comply with the rules, regulations, and policies of the COMPANY.</li>
      <li>Maintain professionalism and uphold the name of the SCHOOL.</li>
      <li>Submit all required documents and reports within the prescribed deadlines.</li>
      <li>Complete the required training hours as stipulated in the program requirements.</li>
    </ul>

    <h2>Article V — Duration</h2>
    <p>This agreement shall be effective from <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> to <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, unless terminated earlier by mutual consent.</p>

    <h2>Article VI — General Provisions</h2>
    <ul>
      <li>No employer-employee relationship shall exist between the COMPANY and the student.</li>
      <li>This agreement may be amended upon mutual consent of both parties in writing.</li>
    </ul>

    <br/>
    <p><strong>IN WITNESS WHEREOF</strong>, the parties have hereunto affixed their signatures this <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> day of <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, 20<span class="field">&nbsp;&nbsp;&nbsp;</span>.</p>

    <br/><br/>
    <table style="border:none;width:100%;">
      <tr style="border:none;">
        <td style="border:none;width:50%;text-align:center;padding-top:40px;">
          <div class="sig-line" style="margin:0 auto;">School Administrator</div>
          <p style="font-size:10pt;color:#666;">STI College Marikina</p>
        </td>
        <td style="border:none;width:50%;text-align:center;padding-top:40px;">
          <div class="sig-line" style="margin:0 auto;">Company Representative</div>
          <p style="font-size:10pt;color:#666;">Company Name</p>
        </td>
      </tr>
    </table>
  `;
  downloadTemplate(content, 'STI_MOA_Template');
}

export function downloadJournalTemplate() {
  const content = `
    ${STI_HEADER}
    <h1>Practicum Journal</h1>
    <br/>
    <table>
      <tr><td style="width:35%"><strong>Student Name:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Course & Section:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Company:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Supervisor:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Term Period:</strong></td><td>☐ Prelim &nbsp; ☐ Midterm &nbsp; ☐ Pre-finals &nbsp; ☐ Finals</td></tr>
    </table>

    <br/>
    <h2>Weekly Journal Entry</h2>
    <p>Week No.: <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> &nbsp; Date Range: <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> to <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></p>

    <h3>A. Objectives for the Week</h3>
    <p class="note">(What did you plan to accomplish this week?)</p>
    <div class="field-long" style="min-height:60px;">&nbsp;</div>

    <h3>B. Activities & Tasks Performed</h3>
    <p class="note">(Describe the tasks you worked on, technologies used, and your role)</p>
    <div class="field-long" style="min-height:80px;">&nbsp;</div>

    <h3>C. Challenges & Problems Encountered</h3>
    <p class="note">(What difficulties did you face? How did you address them?)</p>
    <div class="field-long" style="min-height:60px;">&nbsp;</div>

    <h3>D. Learnings & Reflections</h3>
    <p class="note">(What new knowledge or skills did you gain? How does this relate to your course?)</p>
    <div class="field-long" style="min-height:60px;">&nbsp;</div>

    <h3>E. Plan for Next Week</h3>
    <div class="field-long" style="min-height:40px;">&nbsp;</div>

    <br/>
    <table style="border:none;width:100%;">
      <tr style="border:none;">
        <td style="border:none;width:50%;text-align:center;padding-top:30px;">
          <div class="sig-line" style="margin:0 auto;">Student Signature</div>
        </td>
        <td style="border:none;width:50%;text-align:center;padding-top:30px;">
          <div class="sig-line" style="margin:0 auto;">Company Supervisor</div>
        </td>
      </tr>
    </table>
    <p class="note" style="text-align:center;margin-top:16px;">Note: Duplicate this page for each week of the term period.</p>
  `;
  downloadTemplate(content, 'STI_Journal_Template');
}

export function downloadDTRTemplate() {
  const content = `
    ${STI_HEADER}
    <h1>Daily Time Record (DTR)</h1>
    <br/>
    <table>
      <tr><td style="width:35%"><strong>Student Name:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Course & Section:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Company:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Month/Year:</strong></td><td><span class="field">&nbsp;</span></td></tr>
    </table>
    <br/>

    <table>
      <tr>
        <th style="width:8%">Day</th>
        <th style="width:14%">Date</th>
        <th style="width:12%">Time In</th>
        <th style="width:12%">Time Out</th>
        <th style="width:12%">Time In</th>
        <th style="width:12%">Time Out</th>
        <th style="width:10%">Total Hrs</th>
        <th style="width:20%">Remarks</th>
      </tr>
      <tr><td colspan="2"></td><td colspan="2" style="text-align:center;font-size:9pt;color:#666;">AM</td><td colspan="2" style="text-align:center;font-size:9pt;color:#666;">PM</td><td></td><td></td></tr>
      ${Array.from({ length: 26 }, (_, i) => `<tr><td>${i + 1}</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`).join('')}
    </table>

    <br/>
    <table style="border:none;width:100%;">
      <tr style="border:none;">
        <td style="border:none;width:50%;"><strong>Total Hours This Month:</strong> <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></td>
        <td style="border:none;width:50%;"><strong>Cumulative Hours:</strong> <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> / 122</td>
      </tr>
    </table>

    <br/>
    <p class="note">I certify that the above is a true and correct record of the hours rendered during the period stated.</p>
    <br/>
    <table style="border:none;width:100%;">
      <tr style="border:none;">
        <td style="border:none;width:33%;text-align:center;padding-top:30px;">
          <div class="sig-line" style="margin:0 auto;">Student Signature</div>
        </td>
        <td style="border:none;width:33%;text-align:center;padding-top:30px;">
          <div class="sig-line" style="margin:0 auto;">Company Supervisor</div>
        </td>
        <td style="border:none;width:33%;text-align:center;padding-top:30px;">
          <div class="sig-line" style="margin:0 auto;">Practicum Adviser</div>
        </td>
      </tr>
    </table>
  `;
  downloadTemplate(content, 'STI_DTR_Template');
}

export function downloadTrainingPlanTemplate() {
  const content = `
    ${STI_HEADER}
    <h1>Training Plan</h1>
    <h3 style="text-align:center;font-weight:normal;margin-top:-16px;">(On-the-Job Training / Practicum)</h3>
    <br/>
    <table>
      <tr><td style="width:35%"><strong>Student Name:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Course & Section:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Company:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Company Supervisor:</strong></td><td><span class="field">&nbsp;</span></td></tr>
      <tr><td><strong>Training Duration:</strong></td><td><span class="field">&nbsp;</span> to <span class="field">&nbsp;</span> (122 hours per semester)</td></tr>
    </table>

    <br/>
    <h2>I. Training Objectives</h2>
    <p class="note">(Outline the general objectives of the training aligned with the student's program)</p>
    <div class="field-long" style="min-height:60px;">&nbsp;</div>

    <h2>II. Scope of Work</h2>
    <p class="note">(Describe the department, team, or project the student will be assigned to)</p>
    <div class="field-long" style="min-height:40px;">&nbsp;</div>

    <h2>III. Weekly Training Schedule</h2>
    <table>
      <tr><th style="width:15%">Week</th><th>Planned Activities / Tasks</th><th style="width:20%">Expected Output</th></tr>
      ${Array.from({ length: 12 }, (_, i) => `<tr><td>Week ${i + 1}</td><td>&nbsp;</td><td>&nbsp;</td></tr>`).join('')}
    </table>

    <h2>IV. Skills to be Developed</h2>
    <table>
      <tr><th>Technical Skills</th><th>Soft Skills</th></tr>
      <tr><td style="min-height:60px;">&nbsp;</td><td>&nbsp;</td></tr>
    </table>

    <h2>V. Evaluation Criteria</h2>
    <table>
      <tr><th>Criteria</th><th style="width:15%">Weight (%)</th></tr>
      <tr><td>Attendance & Punctuality</td><td>&nbsp;</td></tr>
      <tr><td>Quality of Work</td><td>&nbsp;</td></tr>
      <tr><td>Initiative & Resourcefulness</td><td>&nbsp;</td></tr>
      <tr><td>Interpersonal Relations</td><td>&nbsp;</td></tr>
      <tr><td>Overall Performance</td><td>&nbsp;</td></tr>
    </table>

    <br/>
    <p><strong>Agreed and Approved:</strong></p>
    <br/>
    <table style="border:none;width:100%;">
      <tr style="border:none;">
        <td style="border:none;width:33%;text-align:center;padding-top:30px;">
          <div class="sig-line" style="margin:0 auto;">Student</div>
        </td>
        <td style="border:none;width:33%;text-align:center;padding-top:30px;">
          <div class="sig-line" style="margin:0 auto;">Company Supervisor</div>
        </td>
        <td style="border:none;width:33%;text-align:center;padding-top:30px;">
          <div class="sig-line" style="margin:0 auto;">Practicum Adviser</div>
        </td>
      </tr>
    </table>
  `;
  downloadTemplate(content, 'STI_Training_Plan_Template');
}

export function downloadEndorsementTemplate() {
  const content = `
    ${STI_HEADER}
    <h1>Endorsement Letter</h1>
    <h3 style="text-align:center;font-weight:normal;margin-top:-16px;">(Student Endorsement for On-the-Job Training)</h3>

    <br/>
    <p style="text-align:right;">Date: <span class="field">&nbsp;</span></p>
    <br/>

    <p><span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></p>
    <p><span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></p>
    <p><span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></p>

    <br/>
    <p>Dear Sir/Madam,</p>
    <br/>
    <p>Greetings of peace!</p>
    <br/>
    <p>We are pleased to endorse <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, a student of STI College Marikina currently enrolled in <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> (Course/Section), to undergo On-the-Job Training (OJT) / Practicum at <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>.</p>

    <br/>
    <p>The student is required to complete a minimum of <span class="field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> hours of industry immersion as part of the academic requirement for the program.</p>

    <br/>
    <p>We humbly request your kind consideration in accepting the student and providing a meaningful learning experience. The student has completed all pre-deployment academic requirements and is ready for deployment.</p>

    <br/>
    <p>For any concerns or coordination, please do not hesitate to contact us at (02) 8682-1234 or email practicum@stimarikina.edu.ph.</p>

    <br/>
    <p>Thank you for your continued support to our academic programs.</p>

    <br/><br/>
    <p>Respectfully,</p>
    <br/><br/>

    <table style="border:none;width:100%;">
      <tr style="border:none;">
        <td style="border:none;width:50%;text-align:center;padding-top:40px;">
          <div class="sig-line" style="margin:0 auto;">Practicum Coordinator</div>
          <p style="font-size:10pt;color:#666;">STI College Marikina</p>
        </td>
        <td style="border:none;width:50%;text-align:center;padding-top:40px;">
          <div class="sig-line" style="margin:0 auto;">School Administrator</div>
          <p style="font-size:10pt;color:#666;">STI College Marikina</p>
        </td>
      </tr>
    </table>
  `;
  downloadTemplate(content, 'STI_Endorsement_Template');
}
