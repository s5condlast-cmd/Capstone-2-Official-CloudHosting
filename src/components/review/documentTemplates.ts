export const getTemplateMarkdown = (pdfUrl: string, title: string, studentName: string = '[Student Name]') => {
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const templates: Record<string, string> = {
    '/templates/FT-CRD-137-01 Student Application Letter Template.pdf': `
**Date:** ${dateStr}

**[Industry Representative Name]**  
[Position / Title]  
[Company Name]  
[Company Address]  

Dear **[Sir/Madam or Name of Contact]**,

I am writing to express my interest in applying for an On-the-Job Training (OJT) position at **[Company Name]** to fulfill the requirements of my degree program. 

I am **${studentName}**, a student of STI College, currently pursuing a degree in **[Program Name]**. I am required to complete **[Number]** hours of OJT to gain practical experience and apply the concepts I have learned in the classroom to a professional work environment.

I am particularly interested in joining your company because of its excellent reputation in the industry and the valuable learning opportunities it can offer. I am confident that my academic background, combined with my eagerness to learn and contribute, will make me a valuable addition to your team.

Attached to this letter is my resume for your reference. I am available for an interview at your earliest convenience. You may reach me at **[Phone Number]** or via email at **[Email Address]**.

Thank you for considering my application. I look forward to the opportunity to discuss how my skills and background meet your needs.

Respectfully yours,


**${studentName}**  
Student Applicant
`,

    '/templates/FT-CRD-134-01 Proposal Letter to the Industry Template.pdf': `
**Date:** ${dateStr}

**[Industry Representative Name]**  
[Position / Title]  
[Company Name]  
[Company Address]  

Dear **[Sir/Madam or Name of Contact]**,

Greetings!

STI College continuously strives to provide its students with quality education that bridges theoretical knowledge and practical application. As part of our curriculum, our students are required to undergo an On-the-Job Training (OJT) / Practicum program to gain real-world experience in their chosen fields.

In this regard, we would like to propose a partnership with **[Company Name]** for our OJT program. We believe that your esteemed organization can provide an excellent training ground for our students.

We are specifically recommending **${studentName}**, a student taking up **[Program Name]**, who is required to complete **[Number]** hours of practicum.

By accepting our student trainee, your company will have the opportunity to:
1. Discover potential future employees who are trained with STI's standard of excellence.
2. Benefit from the fresh perspectives and skills our students bring.
3. Contribute to the development of the future workforce of the industry.

Attached herewith are the documents pertinent to the OJT program. We are more than willing to discuss this proposal with you in detail.

Thank you and we look forward to a fruitful partnership with you.

Sincerely,


**[Name of OJT Coordinator]**  
OJT Coordinator / Adviser  
STI College
`,

    '/templates/FT-CRD-135-01 STI OJT Endorsement Letter Template.pdf': `
**Date:** ${dateStr}

**[Industry Representative Name]**  
[Position / Title]  
[Company Name]  
[Company Address]  

Dear **[Sir/Madam or Name of Contact]**,

This serves to formally endorse **${studentName}**, a bona fide student of STI College enrolled in the **[Program Name]** program, to undergo On-the-Job Training (OJT) / Practicum in your esteemed company.

The student is required to complete a total of **[Number]** hours of training. During this period, the student is expected to gain practical knowledge, develop professional skills, and observe the best practices in the workplace.

We assure you that the student has been properly briefed about the rules and regulations of the OJT program, including the observance of your company's policies and confidentiality requirements.

We greatly appreciate your support and cooperation in helping us shape the future professionals of the industry. Should you have any questions or require further information, please feel free to contact us at **[Contact Number]**.

Thank you for accommodating our student.

Very truly yours,


**[Name of OJT Coordinator]**  
OJT Coordinator  
STI College
`,

    '/templates/FT-CRD-128-01 Memorandum of Agreement (MOA) Template bet. STI and HTE.pdf': `
# MEMORANDUM OF AGREEMENT

**KNOW ALL MEN BY THESE PRESENTS:**

This Memorandum of Agreement is made and entered into this **[Day]** day of **[Month, Year]**, by and between:

**STI COLLEGE**, an educational institution duly organized and existing under the laws of the Republic of the Philippines, with principal office address at **[STI Campus Address]**, represented herein by its **[Position]**, **[Name of Representative]**, hereinafter referred to as the **"SCHOOL"**;

- and -

**[COMPANY NAME]**, a corporation duly organized and existing under the laws of the Republic of the Philippines, with principal office address at **[Company Address]**, represented herein by its **[Position]**, **[Name of Representative]**, hereinafter referred to as the **"HOST TRAINING ESTABLISHMENT (HTE)"**;

## WITNESSETH:

**WHEREAS**, the SCHOOL requires its students to undergo an On-the-Job Training (OJT) program as part of their curriculum to gain practical experience;

**WHEREAS**, the HTE is willing to provide such training opportunities to the students of the SCHOOL;

**NOW, THEREFORE**, for and in consideration of the foregoing premises, the parties hereby agree as follows:

1. **Obligations of the SCHOOL**
   - Endorse qualified students to the HTE.
   - Monitor the progress and performance of the student trainee.

2. **Obligations of the HTE**
   - Provide a safe and conducive training environment.
   - Assign the student trainee to tasks relevant to their field of study.
   - Evaluate the performance of the student trainee.

3. **Status of the Student Trainee**
   - It is understood that there is no employer-employee relationship between the HTE and the student trainee (**${studentName}**).

**IN WITNESS WHEREOF**, the parties have hereunto affixed their signatures on the date and place first above written.

<br/>
<br/>

**FOR THE SCHOOL:**  
___________________________  
**[Name of Representative]**  
[Position]  

<br/>
<br/>

**FOR THE HTE:**  
___________________________  
**[Name of Representative]**  
[Position]  
`,

    '/templates/FT-CRD-131-00 OJT Parent Consent Form without Training Fee Template.pdf': `
# PARENTAL / GUARDIAN CONSENT FORM

I/We, the undersigned parent(s) / legal guardian(s) of **${studentName}**, a student of STI College enrolled in **[Program Name]**, hereby give my/our full consent for my/our child/ward to participate in the On-the-Job Training (OJT) / Practicum program.

I/We understand that:
1. The OJT program is a requirement for the completion of his/her degree.
2. The training will be held at **[Company Name]** located at **[Company Address]**.
3. The training will require **[Number]** hours of service.
4. There is **NO TRAINING FEE** required for this specific arrangement.

I/We acknowledge that the school and the host training establishment will exercise due diligence and reasonable care to ensure the safety of my/our child/ward during the training period. However, I/we hold STI College, its administrators, and faculty free from any liability arising from unforeseen incidents beyond their control during the course of the OJT.

Conforme:


___________________________________
**Signature over Printed Name of Parent/Guardian**

**Date:** _________________________  
**Contact Number:** _______________
`
  };

  // Add the same consent template for the other variations as fallbacks
  templates['/templates/FT-CRD-130-00 OJT Parent Consent Form with Training Fee Template.pdf'] = templates['/templates/FT-CRD-131-00 OJT Parent Consent Form without Training Fee Template.pdf'].replace('NO TRAINING FEE', 'A TRAINING FEE');
  templates['/templates/FT-CRD-139-01 Student Consent Form without Training Fee Template.pdf'] = templates['/templates/FT-CRD-131-00 OJT Parent Consent Form without Training Fee Template.pdf'].replace('PARENTAL / GUARDIAN', 'STUDENT').replace('parent(s) / legal guardian(s) of', '').replace('my/our child/ward', 'myself');
  templates['/templates/FT-CRD-138-01 Student Consent Form with Training Fee Template.pdf'] = templates['/templates/FT-CRD-139-01 Student Consent Form without Training Fee Template.pdf'].replace('NO TRAINING FEE', 'A TRAINING FEE');

  return templates[pdfUrl] || `
# ${title}

**Student Name:** ${studentName}

**Date:** ${dateStr}

Please fill out the details for your form below:

1. 
2. 
`;
};
