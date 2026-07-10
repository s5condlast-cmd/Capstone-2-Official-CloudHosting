import React from 'react';
import { FillableField } from '@/src/components/compose/FillableField';

interface JournalPreviewProps {
  fieldValues?: Record<string, string>;
  onFieldClick?: (fieldLabel: string) => void;
  activeField?: string;
}

export const JournalPreview: React.FC<JournalPreviewProps> = ({
  fieldValues = {},
  onFieldClick = () => {},
  activeField
}) => {
  const val = (key: string) => fieldValues[key] || '';
  const isActive = (label: string) => activeField === label;

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold uppercase tracking-widest">Practicum Journal</h1>
      </div>

      <div className="space-y-6">
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="w-1/3 py-1 font-bold">Student Name:</td>
              <td className="border-b border-zinc-400 dark:border-zinc-600">
                <FillableField label="Student Name" value={val('Student Name')} onClick={onFieldClick} isActive={isActive('Student Name')} />
              </td>
            </tr>
            <tr>
              <td className="py-1 font-bold">Course & Section:</td>
              <td className="border-b border-zinc-400 dark:border-zinc-600">
                <FillableField label="Course & Section" value={val('Course & Section')} onClick={onFieldClick} isActive={isActive('Course & Section')} />
              </td>
            </tr>
            <tr>
              <td className="py-1 font-bold">Company:</td>
              <td className="border-b border-zinc-400 dark:border-zinc-600">
                <FillableField label="Company" value={val('Company')} onClick={onFieldClick} isActive={isActive('Company')} />
              </td>
            </tr>
            <tr>
              <td className="py-1 font-bold">Supervisor:</td>
              <td className="border-b border-zinc-400 dark:border-zinc-600">
                <FillableField label="Supervisor" value={val('Supervisor')} onClick={onFieldClick} isActive={isActive('Supervisor')} />
              </td>
            </tr>
            <tr>
              <td className="py-1 font-bold">Term Period:</td>
              <td className="py-1">
                <span className="mr-4">☐ Prelim</span>
                <span className="mr-4">☐ Midterm</span>
                <span className="mr-4">☐ Pre-finals</span>
                <span>☐ Finals</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-8">
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-4">Weekly Journal Entry</h2>
          <div className="flex gap-4 text-sm mb-6">
            <div>Week No.: <FillableField label="Week No" value={val('Week No')} onClick={onFieldClick} isActive={isActive('Week No')} inline /></div>
            <div className="flex-1 text-right">Date Range: <FillableField label="Start Date" value={val('Start Date')} onClick={onFieldClick} isActive={isActive('Start Date')} inline /> to <FillableField label="End Date" value={val('End Date')} onClick={onFieldClick} isActive={isActive('End Date')} inline /></div>
          </div>

          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-bold mb-1">A. Objectives for the Week</h3>
              <p className="text-xs text-zinc-500 italic mb-2">(What did you plan to accomplish this week?)</p>
              <FillableField label="Objectives" value={val('Objectives')} onClick={onFieldClick} isActive={isActive('Objectives')} />
            </section>

            <section>
              <h3 className="font-bold mb-1">B. Activities & Tasks Performed</h3>
              <p className="text-xs text-zinc-500 italic mb-2">(Describe the tasks you worked on, technologies used, and your role)</p>
              <FillableField label="Activities" value={val('Activities')} onClick={onFieldClick} isActive={isActive('Activities')} />
            </section>

            <section>
              <h3 className="font-bold mb-1">C. Challenges & Problems Encountered</h3>
              <p className="text-xs text-zinc-500 italic mb-2">(What difficulties did you face? How did you address them?)</p>
              <FillableField label="Challenges" value={val('Challenges')} onClick={onFieldClick} isActive={isActive('Challenges')} />
            </section>

            <section>
              <h3 className="font-bold mb-1">D. Learnings & Reflections</h3>
              <p className="text-xs text-zinc-500 italic mb-2">(What new knowledge or skills did you gain? How does this relate to your course?)</p>
              <FillableField label="Learnings" value={val('Learnings')} onClick={onFieldClick} isActive={isActive('Learnings')} />
            </section>

            <section>
              <h3 className="font-bold mb-1">E. Plan for Next Week</h3>
              <FillableField label="Plan for Next Week" value={val('Plan for Next Week')} onClick={onFieldClick} isActive={isActive('Plan for Next Week')} />
            </section>
          </div>
        </div>

        <div className="flex justify-between pt-16">
          <div className="text-center w-5/12">
            <div className="border-t border-zinc-800 dark:border-zinc-200 pt-1 text-sm">Student Signature</div>
          </div>
          <div className="text-center w-5/12">
            <div className="border-t border-zinc-800 dark:border-zinc-200 pt-1 text-sm">Company Supervisor</div>
          </div>
        </div>
        
        <p className="text-center text-xs text-zinc-500 italic mt-8">Note: Duplicate this page for each week of the term period.</p>
      </div>
    </>
  );
};
