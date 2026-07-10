import React from 'react';
import { FillableField } from '@/src/components/compose/FillableField';

interface TrainingPlanPreviewProps {
  fieldValues?: Record<string, string>;
  onFieldClick?: (fieldLabel: string) => void;
  activeField?: string;
}

export const TrainingPlanPreview: React.FC<TrainingPlanPreviewProps> = ({
  fieldValues = {},
  onFieldClick = () => {},
  activeField
}) => {
  const val = (key: string) => fieldValues[key] || '';
  const isActive = (label: string) => activeField === label;

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold uppercase tracking-widest">Training Plan</h1>
        <h3 className="text-sm font-normal">(On-the-Job Training / Practicum)</h3>
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
              <td className="py-1 font-bold">Company Supervisor:</td>
              <td className="border-b border-zinc-400 dark:border-zinc-600">
                <FillableField label="Company Supervisor" value={val('Company Supervisor')} onClick={onFieldClick} isActive={isActive('Company Supervisor')} />
              </td>
            </tr>
            <tr>
              <td className="py-1 font-bold">Training Duration:</td>
              <td className="py-1">
                <FillableField label="Start Date" value={val('Start Date')} onClick={onFieldClick} isActive={isActive('Start Date')} inline /> to <FillableField label="End Date" value={val('End Date')} onClick={onFieldClick} isActive={isActive('End Date')} inline />
                <span className="text-xs text-zinc-500 ml-2">(122 hours per semester)</span>
              </td>
            </tr>
          </tbody>
        </table>

        <section className="mt-8">
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-2">I. Training Objectives</h2>
          <p className="text-xs text-zinc-500 italic mb-2">(Outline the general objectives of the training aligned with the student's program)</p>
          <FillableField label="Training Objectives" value={val('Training Objectives')} onClick={onFieldClick} isActive={isActive('Training Objectives')} />
        </section>

        <section>
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-2">II. Scope of Work</h2>
          <p className="text-xs text-zinc-500 italic mb-2">(Describe the department, team, or project the student will be assigned to)</p>
          <FillableField label="Scope of Work" value={val('Scope of Work')} onClick={onFieldClick} isActive={isActive('Scope of Work')} />
        </section>

        <section>
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-4">III. Weekly Training Schedule</h2>
          <table className="w-full text-sm border-collapse border border-zinc-400 dark:border-zinc-600">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-400 dark:border-zinc-600">
                <th className="border-r border-zinc-400 dark:border-zinc-600 p-2 text-left w-24">Week</th>
                <th className="border-r border-zinc-400 dark:border-zinc-600 p-2 text-left">Planned Activities / Tasks</th>
                <th className="p-2 text-left w-48">Expected Output</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <tr key={i} className="border-b border-zinc-300 dark:border-zinc-700">
                  <td className="border-r border-zinc-300 dark:border-zinc-700 p-2">Week {i}</td>
                  <td className="border-r border-zinc-300 dark:border-zinc-700 p-1">
                    <FillableField label={`Week ${i} Activities`} value={val(`Week ${i} Activities`)} onClick={onFieldClick} isActive={isActive(`Week ${i} Activities`)} />
                  </td>
                  <td className="p-1">
                    <FillableField label={`Week ${i} Output`} value={val(`Week ${i} Output`)} onClick={onFieldClick} isActive={isActive(`Week ${i} Output`)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-4">IV. Skills to be Developed</h2>
          <div className="flex gap-4">
            <div className="flex-1 border border-zinc-400 dark:border-zinc-600 p-3">
              <h3 className="font-bold text-sm mb-2 text-center">Technical Skills</h3>
              <FillableField label="Technical Skills" value={val('Technical Skills')} onClick={onFieldClick} isActive={isActive('Technical Skills')} />
            </div>
            <div className="flex-1 border border-zinc-400 dark:border-zinc-600 p-3">
              <h3 className="font-bold text-sm mb-2 text-center">Soft Skills</h3>
              <FillableField label="Soft Skills" value={val('Soft Skills')} onClick={onFieldClick} isActive={isActive('Soft Skills')} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-4">V. Evaluation Criteria</h2>
          <table className="w-2/3 text-sm border-collapse border border-zinc-400 dark:border-zinc-600 mx-auto">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-400 dark:border-zinc-600">
                <th className="border-r border-zinc-400 dark:border-zinc-600 p-2 text-left">Criteria</th>
                <th className="p-2 text-center w-24">Weight (%)</th>
              </tr>
            </thead>
            <tbody>
              {['Attendance & Punctuality', 'Quality of Work', 'Initiative & Resourcefulness', 'Interpersonal Relations', 'Overall Performance'].map(item => (
                <tr key={item} className="border-b border-zinc-300 dark:border-zinc-700">
                  <td className="border-r border-zinc-300 dark:border-zinc-700 p-2">{item}</td>
                  <td className="p-1">
                    <FillableField label={`${item} Weight`} value={val(`${item} Weight`)} onClick={onFieldClick} isActive={isActive(`${item} Weight`)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="pt-8">
          <p className="font-bold text-sm mb-12">Agreed and Approved:</p>
          <div className="flex justify-between">
            <div className="text-center w-1/4">
              <div className="border-t border-zinc-800 dark:border-zinc-200 pt-1 text-sm">Student</div>
            </div>
            <div className="text-center w-1/4">
              <div className="border-t border-zinc-800 dark:border-zinc-200 pt-1 text-sm">Company Supervisor</div>
            </div>
            <div className="text-center w-1/4">
              <div className="border-t border-zinc-800 dark:border-zinc-200 pt-1 text-sm">Practicum Adviser</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
