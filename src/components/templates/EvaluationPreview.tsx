import React from 'react';
import { FillableField } from '@/src/components/compose/FillableField';

interface EvaluationPreviewProps {
  fieldValues?: Record<string, string>;
  onFieldClick?: (fieldLabel: string) => void;
  activeField?: string;
}

export const EvaluationPreview: React.FC<EvaluationPreviewProps> = ({
  fieldValues = {},
  onFieldClick = () => {},
  activeField
}) => {
  const val = (key: string) => fieldValues[key] || '';
  const isActive = (label: string) => activeField === label;

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold uppercase tracking-widest">Student Performance Evaluation</h1>
        <h3 className="text-sm font-normal">(Final Practicum / OJT Appraisal)</h3>
      </div>

      <div className="space-y-6">
        <table className="w-full text-sm">
          <tbody>
            <tr><td className="w-1/3 py-1 font-bold">Student Name:</td><td className="border-b border-zinc-400 dark:border-zinc-600"><FillableField label="Student Name" value={val('Student Name')} onClick={onFieldClick} isActive={isActive('Student Name')} /></td></tr>
            <tr><td className="py-1 font-bold">Company Name:</td><td className="border-b border-zinc-400 dark:border-zinc-600"><FillableField label="Company Name" value={val('Company Name')} onClick={onFieldClick} isActive={isActive('Company Name')} /></td></tr>
            <tr><td className="py-1 font-bold">Department:</td><td className="border-b border-zinc-400 dark:border-zinc-600"><FillableField label="Department" value={val('Department')} onClick={onFieldClick} isActive={isActive('Department')} /></td></tr>
            <tr><td className="py-1 font-bold">Training Period:</td><td className="border-b border-zinc-400 dark:border-zinc-600"><FillableField label="Training Period" value={val('Training Period')} onClick={onFieldClick} isActive={isActive('Training Period')} /></td></tr>
          </tbody>
        </table>

        <div className="mt-8">
          <table className="w-full text-xs border-collapse border border-zinc-400 dark:border-zinc-600">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-400 dark:border-zinc-600">
                <th className="border-r border-zinc-400 dark:border-zinc-600 p-2 text-left">Evaluation Criteria</th>
                <th className="p-2 text-center w-24">Rating (1-5)</th>
              </tr>
            </thead>
            <tbody>
              {[
                'Quality of Work',
                'Job Knowledge & Skills',
                'Dependability & Reliability',
                'Initiative & Creativity',
                'Communication Skills',
                'Interpersonal Relations',
                'Professionalism & Ethics',
                'Attendance & Punctuality'
              ].map(item => (
                <tr key={item} className="border-b border-zinc-300 dark:border-zinc-700">
                  <td className="border-r border-zinc-300 dark:border-zinc-700 p-2">{item}</td>
                  <td className="p-0 h-8"><FillableField label={`${item} Rating`} value={val(`${item} Rating`)} onClick={onFieldClick} isActive={isActive(`${item} Rating`)} /></td>
                </tr>
              ))}
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 font-bold">
                <td className="border-r border-zinc-400 dark:border-zinc-600 p-2 text-right uppercase tracking-wider">Final Average Rating</td>
                <td className="p-0 h-8"><FillableField label="Final Average Rating" value={val('Final Average Rating')} onClick={onFieldClick} isActive={isActive('Final Average Rating')} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase mb-2">Descriptive Rating / Comments:</h2>
          <div className="border border-zinc-300 dark:border-zinc-700 p-0 text-xs text-zinc-800 dark:text-zinc-200 min-h-[6rem]">
            <FillableField label="Comments" value={val('Comments')} onClick={onFieldClick} isActive={isActive('Comments')} />
          </div>
        </section>

        <div className="pt-16">
          <div className="flex justify-between">
            <div className="text-center w-5/12">
              <div className="border-t border-zinc-800 dark:border-zinc-200 pt-1 text-sm font-bold"><FillableField label="Company Supervisor" value={val('Company Supervisor')} onClick={onFieldClick} isActive={isActive('Company Supervisor')} /></div>
              <div className="text-xs text-zinc-500">(Signature over Printed Name)</div>
            </div>
            <div className="text-center w-5/12">
              <div className="border-t border-zinc-800 dark:border-zinc-200 pt-1 text-sm"><FillableField label="Date Signed" value={val('Date Signed')} onClick={onFieldClick} isActive={isActive('Date Signed')} /></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
