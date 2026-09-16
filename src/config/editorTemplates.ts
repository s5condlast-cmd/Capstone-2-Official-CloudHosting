/**
 * Institutional template registry for the Plate.js document editor.
 * Each template has a stable ID, phase, description, Plate schema version,
 * and a seed content array in Plate JSON format.
 *
 * DTR is not editable in the Plate editor — it links to the existing DTR workflow.
 */

export type TemplatePhase = 'before_ojt' | 'in_ojt' | 'final' | 'general';

export interface EditorTemplate {
  /** Stable identifier — never change after creation */
  id: string;
  phase: TemplatePhase;
  name: string;
  description: string;
  /** Plate schema version this seed content was authored for */
  plateVersion: number;
  /** Whether this template opens in the Plate editor */
  editable: boolean;
  /** If not editable, the route to redirect to */
  redirectTo?: string;
  /** Initial Plate content nodes for a new draft */
  seedContent: object[];
}

/** A minimal Plate paragraph node */
const p = (text: string) => ({
  type: 'p',
  children: [{ text }],
});

/** A centered paragraph */
const pCenter = (text: string) => ({
  type: 'p',
  align: 'center',
  children: [{ text }],
});

/** Bold text */
const bold = (text: string) => ({ text, bold: true });

/** Underlined fill-in span */
const fill = (placeholder: string) => ({ text: placeholder, underline: true });

export const EDITOR_TEMPLATES: EditorTemplate[] = [
  // ─── Before OJT ─────────────────────────────────────────────────────────
  {
    id: 'student-application-letter',
    phase: 'before_ojt',
    name: 'Student Application Letter',
    description: 'Formal letter requesting approval to begin your OJT practicum.',
    plateVersion: 53,
    editable: true,
    seedContent: [
      pCenter('STI MARIKINA'),
      pCenter('Office of the Practicum Coordinator'),
      p(''),
      p('Date: '),
      p(''),
      p('To:'),
      { type: 'p', children: [bold('The Practicum Coordinator')] },
      { type: 'p', children: [bold('STI Marikina')] },
      p(''),
      { type: 'p', children: [{ text: 'Subject: ' }, bold('APPLICATION FOR ON-THE-JOB TRAINING')] },
      p(''),
      p('Dear Sir/Ma\u2019am,'),
      p(''),
      { type: 'p', children: [{ text: 'I, ' }, fill('Your Full Name'), { text: ', a ' }, fill('Year Level'), { text: ' student of ' }, fill('Program/Course'), { text: ', am writing to formally apply for On-the-Job Training at ' }, fill('Company Name'), { text: ', located at ' }, fill('Company Address'), { text: '.' }] },
      p(''),
      p('I believe that the practical exposure I will gain from this training will significantly contribute to my professional development and complement my academic preparation.'),
      p(''),
      p('I am committed to complying with all requirements and guidelines set by the institution and the company. I humbly request your approval and support for this endeavor.'),
      p(''),
      p('Respectfully yours,'),
      p(''),
      p(''),
      { type: 'p', children: [fill('Your Full Name')] },
      { type: 'p', children: [fill('Student ID Number')] },
      { type: 'p', children: [fill('Section / Program')] },
    ],
  },
  {
    id: 'parent-consent-with-fee',
    phase: 'before_ojt',
    name: 'Parent Consent Form (With Fee)',
    description: 'Parent or guardian consent for OJT with practicum fee.',
    plateVersion: 53,
    editable: true,
    seedContent: [
      pCenter('PARENT / GUARDIAN CONSENT FORM'),
      pCenter('(With Practicum Fee)'),
      p(''),
      p('I, '),
      { type: 'p', children: [fill('Parent/Guardian Full Name'), { text: ', parent/guardian of ' }, fill('Student Full Name'), { text: ', hereby give my consent for my child/ward to undergo On-the-Job Training (OJT) at ' }, fill('Company Name'), { text: '.' }] },
      p(''),
      p('I understand that this training is a requirement for the completion of the practicum program and that there is a corresponding practicum fee to be paid to the institution.'),
      p(''),
      p('I acknowledge that my child/ward will be responsible for their conduct and safety during the training period.'),
      p(''),
      p('Signature: ________________________'),
      p('Date: ________________________'),
    ],
  },
  {
    id: 'parent-consent-without-fee',
    phase: 'before_ojt',
    name: 'Parent Consent Form (Without Fee)',
    description: 'Parent or guardian consent for OJT without practicum fee.',
    plateVersion: 53,
    editable: true,
    seedContent: [
      pCenter('PARENT / GUARDIAN CONSENT FORM'),
      pCenter('(Without Practicum Fee)'),
      p(''),
      { type: 'p', children: [fill('Parent/Guardian Full Name'), { text: ', parent/guardian of ' }, fill('Student Full Name'), { text: ', hereby give my consent for my child/ward to undergo On-the-Job Training (OJT) at ' }, fill('Company Name'), { text: '.' }] },
      p(''),
      p('I understand that this training is a requirement for the completion of the practicum program.'),
      p(''),
      p('Signature: ________________________'),
      p('Date: ________________________'),
    ],
  },
  {
    id: 'student-consent-with-fee',
    phase: 'before_ojt',
    name: 'Student Consent Form (With Fee)',
    description: 'Student consent for OJT with practicum fee.',
    plateVersion: 53,
    editable: true,
    seedContent: [
      pCenter('STUDENT CONSENT FORM'),
      pCenter('(With Practicum Fee)'),
      p(''),
      { type: 'p', children: [{ text: 'I, ' }, fill('Student Full Name'), { text: ', hereby give my consent to undergo On-the-Job Training (OJT) at ' }, fill('Company Name'), { text: ', and acknowledge the practicum fee required by the institution.' }] },
      p(''),
      p('Signature: ________________________'),
      p('Date: ________________________'),
    ],
  },
  {
    id: 'student-consent-without-fee',
    phase: 'before_ojt',
    name: 'Student Consent Form (Without Fee)',
    description: 'Student consent for OJT without practicum fee.',
    plateVersion: 53,
    editable: true,
    seedContent: [
      pCenter('STUDENT CONSENT FORM'),
      pCenter('(Without Practicum Fee)'),
      p(''),
      { type: 'p', children: [{ text: 'I, ' }, fill('Student Full Name'), { text: ', hereby consent to undergo On-the-Job Training (OJT) at ' }, fill('Company Name'), { text: '.' }] },
      p(''),
      p('Signature: ________________________'),
      p('Date: ________________________'),
    ],
  },
  {
    id: 'moa-template',
    phase: 'before_ojt',
    name: 'MOA Template',
    description: 'Memorandum of Agreement between the institution and the company.',
    plateVersion: 53,
    editable: true,
    seedContent: [
      pCenter('MEMORANDUM OF AGREEMENT'),
      p(''),
      { type: 'p', children: [{ text: 'This Memorandum of Agreement is entered into by and between ' }, bold('STI Marikina'), { text: ', represented by its School Director, and ' }, fill('Company Name'), { text: ', represented by ' }, fill('Company Representative Name'), { text: ', on this ' }, fill('Day'), { text: ' day of ' }, fill('Month'), { text: ', ' }, fill('Year'), { text: '.' }] },
      p(''),
      { type: 'h2', children: [{ text: 'I. PURPOSE' }] },
      p('The purpose of this agreement is to establish a partnership for On-the-Job Training of STI Marikina students.'),
      p(''),
      { type: 'h2', children: [{ text: 'II. RESPONSIBILITIES' }] },
      { type: 'h3', children: [{ text: 'A. STI Marikina shall:' }] },
      { type: 'ul', children: [
        { type: 'li', children: [{ type: 'lic', children: [{ text: 'Endorse qualified students for training.' }] }] },
        { type: 'li', children: [{ type: 'lic', children: [{ text: 'Monitor student progress and performance.' }] }] },
      ]},
      { type: 'h3', children: [{ text: 'B. The Company shall:' }] },
      { type: 'ul', children: [
        { type: 'li', children: [{ type: 'lic', children: [{ text: 'Provide meaningful training tasks aligned with student competencies.' }] }] },
        { type: 'li', children: [{ type: 'lic', children: [{ text: 'Assign a supervisor to guide and evaluate the student intern.' }] }] },
      ]},
      p(''),
      { type: 'h2', children: [{ text: 'III. EFFECTIVITY' }] },
      p('This agreement shall be effective for one (1) academic year from the date of signing.'),
      p(''),
      p('IN WITNESS WHEREOF, the parties have signed this agreement.'),
      p(''),
      { type: 'p', children: [bold('STI MARIKINA'), { text: '                    ' }, bold(fill('COMPANY NAME').text)] },
    ],
  },
  {
    id: 'endorsement-letter',
    phase: 'before_ojt',
    name: 'Endorsement Letter',
    description: 'Official endorsement letter from the institution to the company.',
    plateVersion: 53,
    editable: true,
    seedContent: [
      p('Date: '),
      p(''),
      { type: 'p', children: [{ text: 'To: ' }, fill('Company Name / HR Manager')] },
      { type: 'p', children: [fill('Company Address')] },
      p(''),
      p('Dear Sir/Ma\u2019am,'),
      p(''),
      { type: 'p', children: [{ text: 'This is to endorse ' }, fill('Student Full Name'), { text: ', a ' }, fill('Year Level'), { text: ' student of ' }, fill('Program/Course'), { text: ' at STI Marikina, to undergo On-the-Job Training in your esteemed company.' }] },
      p(''),
      p('We assure you that the student is well-prepared and committed to fulfilling the requirements of the training. We look forward to a fruitful partnership.'),
      p(''),
      p('Respectfully yours,'),
      p(''),
      p(''),
      p('PRACTICUM COORDINATOR'),
      p('STI Marikina'),
    ],
  },
  {
    id: 'proposal-letter',
    phase: 'before_ojt',
    name: 'Proposal Letter',
    description: 'Letter proposing OJT training to a company.',
    plateVersion: 53,
    editable: true,
    seedContent: [
      p('Date: '),
      p(''),
      { type: 'p', children: [{ text: 'To: ' }, fill('HR Manager / Hiring Officer')] },
      { type: 'p', children: [fill('Company Name')] },
      { type: 'p', children: [fill('Company Address')] },
      p(''),
      p('Dear Sir/Ma\u2019am,'),
      p(''),
      { type: 'p', children: [{ text: 'On behalf of STI Marikina, I am writing to propose a training partnership for our ' }, fill('Program/Course'), { text: ' students who are seeking On-the-Job Training opportunities.' }] },
      p(''),
      p('We believe that the expertise and environment your organization provides would be highly beneficial to our students\u2019 professional development. In return, we offer dedicated, well-trained interns ready to contribute meaningfully to your operations.'),
      p(''),
      p('We look forward to your favorable consideration of this proposal.'),
      p(''),
      p('Respectfully yours,'),
      p(''),
      p(''),
      p('PRACTICUM COORDINATOR'),
      p('STI Marikina'),
    ],
  },

  // ─── In OJT ─────────────────────────────────────────────────────────────
  {
    id: 'weekly-journal',
    phase: 'in_ojt',
    name: 'Journal Template',
    description: 'Weekly journal for recording OJT activities and reflections.',
    plateVersion: 53,
    editable: true,
    seedContent: [
      { type: 'h1', children: [{ text: 'Weekly OJT Journal' }] },
      { type: 'p', children: [{ text: 'Week No.: ' }, fill('Week Number')] },
      { type: 'p', children: [{ text: 'Date: ' }, fill('From Date'), { text: ' to ' }, fill('To Date')] },
      { type: 'p', children: [{ text: 'Company: ' }, fill('Company Name')] },
      { type: 'p', children: [{ text: 'Department: ' }, fill('Department')] },
      p(''),
      { type: 'h2', children: [{ text: 'Activities Performed' }] },
      p('Describe the tasks and activities you performed this week.'),
      p(''),
      { type: 'h2', children: [{ text: 'Insights and Learnings' }] },
      p('Reflect on what you learned and how it relates to your course.'),
      p(''),
      { type: 'h2', children: [{ text: 'Challenges Encountered' }] },
      p('Describe any challenges and how you addressed them.'),
      p(''),
      { type: 'h2', children: [{ text: 'Hours Rendered' }] },
      { type: 'p', children: [{ text: 'Total hours this week: ' }, fill('Total Hours')] },
      { type: 'p', children: [{ text: 'Cumulative hours: ' }, fill('Cumulative Hours')] },
    ],
  },
  {
    id: 'dtr-form',
    phase: 'in_ojt',
    name: 'DTR Form',
    description: 'Daily Time Record — accessible via the Document Repository.',
    plateVersion: 53,
    editable: false,
    redirectTo: '/student/documents',
    seedContent: [],
  },
  {
    id: 'training-plan-form',
    phase: 'in_ojt',
    name: 'Training Plan Form',
    description: 'OJT training plan outlining learning objectives and activities.',
    plateVersion: 53,
    editable: true,
    seedContent: [
      { type: 'h1', children: [{ text: 'OJT Training Plan' }] },
      { type: 'p', children: [{ text: 'Student Name: ' }, fill('Student Full Name')] },
      { type: 'p', children: [{ text: 'Company: ' }, fill('Company Name')] },
      { type: 'p', children: [{ text: 'Training Period: ' }, fill('Start Date'), { text: ' to ' }, fill('End Date')] },
      { type: 'p', children: [{ text: 'Total Required Hours: ' }, fill('Required Hours')] },
      p(''),
      { type: 'h2', children: [{ text: 'Training Objectives' }] },
      { type: 'ol', children: [
        { type: 'li', children: [{ type: 'lic', children: [{ text: 'Develop practical skills in ' }, fill('Field/Domain'), { text: '.' }] }] },
        { type: 'li', children: [{ type: 'lic', children: [{ text: 'Apply theoretical knowledge from academic coursework.' }] }] },
        { type: 'li', children: [{ type: 'lic', children: [{ text: 'Build professional communication and workplace skills.' }] }] },
      ]},
      p(''),
      { type: 'h2', children: [{ text: 'Weekly Schedule of Activities' }] },
      { type: 'table', children: [
        { type: 'tr', children: [
          { type: 'td', children: [{ type: 'p', children: [bold('Week')] }] },
          { type: 'td', children: [{ type: 'p', children: [bold('Planned Activities')] }] },
          { type: 'td', children: [{ type: 'p', children: [bold('Expected Output')] }] },
        ]},
        { type: 'tr', children: [
          { type: 'td', children: [{ type: 'p', children: [{ text: '1' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: 'Orientation and department familiarization' }] }] },
          { type: 'td', children: [{ type: 'p', children: [{ text: 'Company overview report' }] }] },
        ]},
      ]},
    ],
  },

  // ─── Final ──────────────────────────────────────────────────────────────
  {
    id: 'integration-paper',
    phase: 'final',
    name: 'Integration Paper Template',
    description: 'Final integration paper synthesizing OJT experience with academic learning.',
    plateVersion: 53,
    editable: true,
    seedContent: [
      { type: 'h1', align: 'center', children: [{ text: 'INTEGRATION PAPER' }] },
      { type: 'h2', align: 'center', children: [{ text: 'On-the-Job Training Synthesis Report' }] },
      p(''),
      { type: 'p', children: [{ text: 'Submitted by: ' }, fill('Student Full Name')] },
      { type: 'p', children: [{ text: 'Course: ' }, fill('Program/Course')] },
      { type: 'p', children: [{ text: 'Company: ' }, fill('Company Name')] },
      { type: 'p', children: [{ text: 'Training Period: ' }, fill('Start Date'), { text: ' to ' }, fill('End Date')] },
      { type: 'p', children: [{ text: 'Total Hours: ' }, fill('Total Hours')] },
      p(''),
      { type: 'h2', children: [{ text: 'I. INTRODUCTION' }] },
      p('Provide a brief background about the company and your role as an intern.'),
      p(''),
      { type: 'h2', children: [{ text: 'II. LEARNING EXPERIENCES' }] },
      p('Describe the significant experiences and skills you gained during the training.'),
      p(''),
      { type: 'h2', children: [{ text: 'III. INTEGRATION WITH ACADEMIC LEARNING' }] },
      p('Discuss how your OJT experience relates to and applies the theories and concepts from your course.'),
      p(''),
      { type: 'h2', children: [{ text: 'IV. CHALLENGES AND SOLUTIONS' }] },
      p('Describe the major challenges you faced and how you resolved them.'),
      p(''),
      { type: 'h2', children: [{ text: 'V. CONCLUSIONS AND RECOMMENDATIONS' }] },
      p('Summarize your key takeaways and provide recommendations for future students and the company.'),
      p(''),
      { type: 'h2', children: [{ text: 'REFERENCES' }] },
      p('List any references cited in this paper.'),
    ],
  },
  {
    id: 'performance-appraisal',
    phase: 'final',
    name: 'Performance Appraisal Template',
    description: 'Final performance appraisal to be completed by the company supervisor.',
    plateVersion: 53,
    editable: true,
    seedContent: [
      pCenter('PERFORMANCE APPRAISAL FORM'),
      pCenter('On-the-Job Training'),
      p(''),
      { type: 'p', children: [{ text: 'Student Name: ' }, fill('Student Full Name')] },
      { type: 'p', children: [{ text: 'Company: ' }, fill('Company Name')] },
      { type: 'p', children: [{ text: 'Department: ' }, fill('Department')] },
      { type: 'p', children: [{ text: 'Supervisor: ' }, fill('Supervisor Name')] },
      { type: 'p', children: [{ text: 'Evaluation Period: ' }, fill('Start Date'), { text: ' to ' }, fill('End Date')] },
      p(''),
      { type: 'h2', children: [{ text: 'Performance Ratings' }] },
      p('Rate the intern on each criterion: 5 - Outstanding, 4 - Very Satisfactory, 3 - Satisfactory, 2 - Fair, 1 - Poor'),
      { type: 'table', children: [
        { type: 'tr', children: [
          { type: 'td', children: [{ type: 'p', children: [bold('Criteria')] }] },
          { type: 'td', children: [{ type: 'p', children: [bold('Rating (1\u20135)')] }] },
          { type: 'td', children: [{ type: 'p', children: [bold('Comments')] }] },
        ]},
        ...['Quality of Work', 'Punctuality and Attendance', 'Initiative and Creativity', 'Communication Skills', 'Teamwork and Cooperation', 'Professional Conduct'].map(c => ({
          type: 'tr',
          children: [
            { type: 'td', children: [{ type: 'p', children: [{ text: c }] }] },
            { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
            { type: 'td', children: [{ type: 'p', children: [{ text: '' }] }] },
          ],
        })),
      ]},
      p(''),
      { type: 'p', children: [{ text: 'Overall Rating: ' }, fill('Rating'), { text: ' / 5.0' }] },
      p(''),
      { type: 'h2', children: [{ text: 'Supervisor\u2019s Remarks' }] },
      p(''),
      p(''),
      p('________________________'),
      { type: 'p', children: [fill('Supervisor Name')] },
      p('Company Supervisor'),
      { type: 'p', children: [{ text: 'Date: ' }, fill('Date')] },
    ],
  },
];

/** Look up a template by its stable ID */
export function getEditorTemplate(id: string): EditorTemplate | undefined {
  return EDITOR_TEMPLATES.find(t => t.id === id);
}

/** Get all editable templates for a given phase */
export function getTemplatesForPhase(phase: TemplatePhase): EditorTemplate[] {
  return EDITOR_TEMPLATES.filter(t => t.phase === phase && t.editable);
}

