import React from 'react';
import { FillableField } from '@/src/components/compose/FillableField';

interface DTRPreviewProps {
  fieldValues?: Record<string, string>;
  onFieldClick?: (fieldLabel: string) => void;
  activeField?: string;
}

export const DTRPreview: React.FC<DTRPreviewProps> = ({
  fieldValues = {},
  onFieldClick = () => {},
  activeField
}) => {
  const val = (key: string) => fieldValues[key] || '';
  const isActive = (label: string) => activeField === label;

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold uppercase tracking-widest">Daily Time Record (DTR)</h1>
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
              <td className="py-1 font-bold">Month/Year:</td>
              <td className="border-b border-zinc-400 dark:border-zinc-600">
                <FillableField label="Month/Year" value={val('Month/Year')} onClick={onFieldClick} isActive={isActive('Month/Year')} />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="overflow-x-auto mt-6">
          <table className="w-full text-xs border-collapse border border-zinc-400 dark:border-zinc-600">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-400 dark:border-zinc-600">
                <th className="border-r border-zinc-400 dark:border-zinc-600 p-1 w-8">Day</th>
                <th className="border-r border-zinc-400 dark:border-zinc-600 p-1 w-20">Date</th>
                <th className="border-r border-zinc-400 dark:border-zinc-600 p-1" colSpan={2}>AM</th>
                <th className="border-r border-zinc-400 dark:border-zinc-600 p-1" colSpan={2}>PM</th>
                <th className="border-r border-zinc-400 dark:border-zinc-600 p-1 w-16">Total Hrs</th>
                <th className="p-1">Remarks</th>
              </tr>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-400 dark:border-zinc-600">
                <th className="border-r border-zinc-400 dark:border-zinc-600 p-1"></th>
                <th className="border-r border-zinc-400 dark:border-zinc-600 p-1"></th>
                <th className="border-r border-zinc-400 dark:border-zinc-600 p-1 w-16">Time In</th>
                <th className="border-r border-zinc-400 dark:border-zinc-600 p-1 w-16">Time Out</th>
                <th className="border-r border-zinc-400 dark:border-zinc-600 p-1 w-16">Time In</th>
                <th className="border-r border-zinc-400 dark:border-zinc-600 p-1 w-16">Time Out</th>
                <th className="border-r border-zinc-400 dark:border-zinc-600 p-1"></th>
                <th className="p-1"></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 20 }, (_, i) => (
                <tr key={i} className="border-b border-zinc-300 dark:border-zinc-700 h-6">
                  <td className="border-r border-zinc-300 dark:border-zinc-700 p-1 text-center">{i + 1}</td>
                  <td className="border-r border-zinc-300 dark:border-zinc-700 p-0">
                    <FillableField label={`Day ${i+1} Date`} value={val(`Day ${i+1} Date`)} onClick={onFieldClick} isActive={isActive(`Day ${i+1} Date`)} />
                  </td>
                  <td className="border-r border-zinc-300 dark:border-zinc-700 p-0">
                    <FillableField label={`Day ${i+1} AM In`} value={val(`Day ${i+1} AM In`)} onClick={onFieldClick} isActive={isActive(`Day ${i+1} AM In`)} />
                  </td>
                  <td className="border-r border-zinc-300 dark:border-zinc-700 p-0">
                    <FillableField label={`Day ${i+1} AM Out`} value={val(`Day ${i+1} AM Out`)} onClick={onFieldClick} isActive={isActive(`Day ${i+1} AM Out`)} />
                  </td>
                  <td className="border-r border-zinc-300 dark:border-zinc-700 p-0">
                    <FillableField label={`Day ${i+1} PM In`} value={val(`Day ${i+1} PM In`)} onClick={onFieldClick} isActive={isActive(`Day ${i+1} PM In`)} />
                  </td>
                  <td className="border-r border-zinc-300 dark:border-zinc-700 p-0">
                    <FillableField label={`Day ${i+1} PM Out`} value={val(`Day ${i+1} PM Out`)} onClick={onFieldClick} isActive={isActive(`Day ${i+1} PM Out`)} />
                  </td>
                  <td className="border-r border-zinc-300 dark:border-zinc-700 p-0">
                    <FillableField label={`Day ${i+1} Total`} value={val(`Day ${i+1} Total`)} onClick={onFieldClick} isActive={isActive(`Day ${i+1} Total`)} />
                  </td>
                  <td className="p-0">
                    <FillableField label={`Day ${i+1} Remarks`} value={val(`Day ${i+1} Remarks`)} onClick={onFieldClick} isActive={isActive(`Day ${i+1} Remarks`)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between text-sm pt-4">
          <div><strong>Total Hours This Month:</strong> <FillableField label="Total Hours" value={val('Total Hours')} onClick={onFieldClick} isActive={isActive('Total Hours')} inline /></div>
          <div><strong>Cumulative Hours:</strong> <FillableField label="Cumulative Hours" value={val('Cumulative Hours')} onClick={onFieldClick} isActive={isActive('Cumulative Hours')} inline /> / 122</div>
        </div>

        <p className="text-xs italic mt-6">I certify that the above is a true and correct record of the hours rendered during the period stated.</p>

        <div className="flex justify-between pt-12">
          <div className="text-center w-1/4">
            <div className="border-t border-zinc-800 dark:border-zinc-200 pt-1 text-sm">Student Signature</div>
          </div>
          <div className="text-center w-1/4">
            <div className="border-t border-zinc-800 dark:border-zinc-200 pt-1 text-sm">Company Supervisor</div>
          </div>
          <div className="text-center w-1/4">
            <div className="border-t border-zinc-800 dark:border-zinc-200 pt-1 text-sm">Practicum Adviser</div>
          </div>
        </div>
      </div>
    </>
  );
};
