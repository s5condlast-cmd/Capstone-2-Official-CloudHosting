import React from 'react';
import { FillableField } from '@/src/components/compose/FillableField';

interface IntegrationPaperPreviewProps {
  fieldValues?: Record<string, string>;
  onFieldClick?: (fieldLabel: string) => void;
  activeField?: string;
}

export const IntegrationPaperPreview: React.FC<IntegrationPaperPreviewProps> = ({
  fieldValues = {},
  onFieldClick = () => { },
  activeField
}) => {
  const val = (key: string) => fieldValues[key] || '';
  const isActive = (label: string) => activeField === label;

  return (
    <article className="font-serif text-[12pt] leading-relaxed max-w-[8in] mx-auto text-zinc-900 dark:text-zinc-100 flex flex-col items-center text-center py-12">
      <div className="space-y-2 mb-24 w-full">
        <h1 className="font-bold text-2xl tracking-wide">ON-THE-JOB TRAINING</h1>
        <p className="text-xl">at</p>
        <div className="pt-2 text-2xl font-bold">
          <FillableField label="Host Training Establishment" value={val('companyName')} onClick={onFieldClick} isActive={isActive('Host Training Establishment')} inline />
        </div>
      </div>

      <div className="space-y-2 mb-24 w-full">
        <p className="text-xl">In Partial Fulfillment of</p>
        <p className="text-xl">the Requirements for</p>
        <div className="pt-2 text-xl font-bold">
          <FillableField label="Name of Program" value={val('programName')} onClick={onFieldClick} isActive={isActive('Name of Program')} inline />
        </div>
      </div>

      <div className="space-y-2 mb-24 w-full">
        <p className="text-xl">Submitted by:</p>
        <div className="pt-2 text-xl font-bold">
          <FillableField label="Student Trainee" value={val('studentName')} onClick={onFieldClick} isActive={isActive('Student Trainee')} inline />
        </div>
      </div>

      <div className="space-y-2 mb-16 w-full">
        <p className="text-xl">Submitted to:</p>
        <div className="pt-2 text-xl font-bold">
          <FillableField label="OJT Coordinator" value={val('coordinatorName')} onClick={onFieldClick} isActive={isActive('OJT Coordinator')} inline />
        </div>
      </div>

      <div className="w-full text-xl mt-8 flex justify-center">
        <FillableField label="Date Submitted" value={val('date')} onClick={onFieldClick} isActive={isActive('Date Submitted')} inline />
      </div>

      {/* Decorative page break indicator to show it's a multi-page document */}
      <div className="mt-32 border-t border-dashed border-zinc-300 dark:border-zinc-700 w-full pt-8 text-zinc-400 dark:text-zinc-600 text-sm">
        <p>Page 1 of 6 (Title Page)</p>
        <p className="text-xs mt-2">The downloaded DOCX will include the full 6-page outline structure.</p>
      </div>
    </article>
  );
};
