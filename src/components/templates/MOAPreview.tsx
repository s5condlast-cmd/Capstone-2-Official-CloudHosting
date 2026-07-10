import React from 'react';
import { FillableField } from '@/src/components/compose/FillableField';

interface MOAPreviewProps {
  fieldValues?: Record<string, string>;
  onFieldClick?: (fieldLabel: string) => void;
  activeField?: string;
}

export const MOAPreview: React.FC<MOAPreviewProps> = ({
  fieldValues = {},
  onFieldClick = () => {},
  activeField
}) => {
  const val = (key: string) => fieldValues[key] || '';
  const isActive = (label: string) => activeField === label;

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold uppercase tracking-widest">Memorandum of Agreement</h1>
        <h3 className="text-sm font-normal">(On-the-Job Training / Practicum Partnership)</h3>
      </div>

      <div className="space-y-6 text-sm text-justify leading-relaxed">
        <p className="font-bold uppercase">KNOW ALL MEN BY THESE PRESENTS:</p>
        
        <p>This Memorandum of Agreement (MOA) is entered into by and between:</p>
        
        <p>
          <strong>[SCHOOL NAME] - DEMO</strong>, an educational institution duly organized and existing under the laws of the Philippines, 
          with principal address at 289 L. de Guzman Street, Concepcion I, Marikina City, 1807 Metro Manila, represented by its School Administrator, 
          hereinafter referred to as the <strong>"SCHOOL"</strong>;
        </p>
        
        <p className="text-center italic">— and —</p>
        
        <p>
          <FillableField label="Company / HTE Name" value={val('Company / HTE Name')} onClick={onFieldClick} isActive={isActive('Company / HTE Name')} inline />, 
          a company duly organized and existing under the laws of the Philippines, with principal address at 
          <FillableField label="Company Address" value={val('Company Address')} onClick={onFieldClick} isActive={isActive('Company Address')} inline />, 
          represented by <FillableField label="HTE Representative Name" value={val('HTE Representative Name')} onClick={onFieldClick} isActive={isActive('HTE Representative Name')} inline />, 
          hereinafter referred to as the <strong>"COMPANY"</strong>.
        </p>

        <section className="mt-8">
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-2">Article I — Purpose</h2>
          <p>
            This agreement establishes the partnership between the SCHOOL and the COMPANY for the deployment of students for 
            On-the-Job Training (OJT) / Practicum, as part of the academic requirement of their respective programs.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-2">Article II — Responsibilities of the School</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Assign a Practicum Adviser to oversee and monitor the student's progress.</li>
            <li>Ensure that the student has completed all pre-deployment requirements.</li>
            <li>Provide the COMPANY with the official endorsement letter and student information.</li>
            <li>Coordinate with the COMPANY regarding the student's training schedule and performance evaluation.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-2">Article III — Responsibilities of the Company</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide a safe and conducive working environment for the student trainee.</li>
            <li>Assign a Company Supervisor to guide, mentor, and evaluate the student.</li>
            <li>Allow the student to complete the required 122 hours per semester of training.</li>
            <li>Issue a Certificate of Completion and Final Evaluation upon fulfillment of the training.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-2">Article IV — Responsibilities of the Student</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Comply with the rules, regulations, and policies of the COMPANY, especially concerning confidentiality and safety.</li>
            <li>Maintain professionalism and uphold the good name of the SCHOOL.</li>
            <li>Submit all required documents and reports to the Practicum Adviser within the prescribed deadlines.</li>
            <li>Complete the required training hours as stipulated in the program requirements.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-2">Article V — Duration</h2>
          <p>
            This agreement shall be effective from <FillableField label="Start Date" value={val('Start Date')} onClick={onFieldClick} isActive={isActive('Start Date')} inline /> 
            to <FillableField label="End Date" value={val('End Date')} onClick={onFieldClick} isActive={isActive('End Date')} inline />, unless terminated earlier by mutual consent.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-2">Article VI — General Provisions</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>No employer-employee relationship shall exist between the COMPANY and the student.</li>
            <li>This agreement may be amended or modified only upon mutual consent of both parties in writing.</li>
          </ul>
        </section>

        <p className="mt-8">
          <strong>IN WITNESS WHEREOF</strong>, the parties have hereunto affixed their signatures this 
          <FillableField label="Day" value={val('Day')} onClick={onFieldClick} isActive={isActive('Day')} inline /> day of 
          <FillableField label="Month" value={val('Month')} onClick={onFieldClick} isActive={isActive('Month')} inline />, 20
          <FillableField label="Year" value={val('Year')} onClick={onFieldClick} isActive={isActive('Year')} inline />.
        </p>

        <div className="flex justify-between pt-16 pb-8">
          <div className="text-center w-5/12">
            <div className="border-t border-zinc-800 dark:border-zinc-200 pt-1 font-bold">School Administrator</div>
            <div className="text-xs text-zinc-500">[SCHOOL NAME] - DEMO</div>
          </div>
          <div className="text-center w-5/12">
            <div className="border-t border-zinc-800 dark:border-zinc-200 pt-1 font-bold">Company Representative</div>
            <div className="text-xs text-zinc-500">Company Name</div>
          </div>
        </div>
      </div>
    </>
  );
};
