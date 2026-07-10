import React from 'react';
import { FillableField } from '@/src/components/compose/FillableField';

interface EndorsementPreviewProps {
  fieldValues?: Record<string, string>;
  onFieldClick?: (fieldLabel: string) => void;
  activeField?: string;
}

export const EndorsementPreview: React.FC<EndorsementPreviewProps> = ({
  fieldValues = {},
  onFieldClick = () => { },
  activeField
}) => {
  const val = (key: string) => fieldValues[key] || '';
  const isActive = (label: string) => activeField === label;

  const today = new Date();
  const dateStr = val('Date') || today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold uppercase tracking-widest">Endorsement Letter</h1>
        <h3 className="text-sm font-normal">(Student Endorsement for On-the-Job Training)</h3>
      </div>

      <div className="space-y-6 text-sm text-justify leading-relaxed">
        <div>
          <FillableField label="Date" value={val('Date')} onClick={onFieldClick} isActive={isActive('Date')} inline />
        </div>

        <div className="space-y-0.5">
          <p className="font-semibold text-black dark:text-white">
            <FillableField label="Industry Representative Name" value={val('Industry Representative Name')} onClick={onFieldClick} isActive={isActive('Industry Representative Name')} inline />
          </p>
          <p><FillableField label="Company Name" value={val('Company Name')} onClick={onFieldClick} isActive={isActive('Company Name')} inline /></p>
          <p><FillableField label="Company Address" value={val('Company Address')} onClick={onFieldClick} isActive={isActive('Company Address')} inline /></p>
        </div>

        <p>Dear <FillableField label="Industry Representative Name" value={val('Industry Representative Name')} onClick={onFieldClick} isActive={isActive('Industry Representative Name')} inline />,</p>

        <p>Greetings of peace!</p>

        <p>
          We are pleased to endorse <FillableField label="Student Name (Full)" value={val('Student Name (Full)')} onClick={onFieldClick} isActive={isActive('Student Name (Full)')} inline />,
          a bona fide student of our institution currently enrolled
          in <FillableField label="Degree / Program Name" value={val('Degree / Program Name')} onClick={onFieldClick} isActive={isActive('Degree / Program Name')} inline />,
          for On-the-Job Training (OJT)
          at <FillableField label="Company Name" value={val('Company Name')} onClick={onFieldClick} isActive={isActive('Company Name')} inline />.
        </p>

        <p>
          The student is required to complete a minimum of <FillableField label="Required OJT Hours" value={val('Required OJT Hours')} onClick={onFieldClick} isActive={isActive('Required OJT Hours')} inline /> hours
          of practical training relevant to their field of study.
        </p>

        <p>
          We humbly request your kind consideration in accepting the student and providing a meaningful learning experience.
          The student has completed all pre-deployment academic requirements and is ready for deployment.
        </p>

        <p>
          For any concerns or coordination, please do not hesitate to contact us
          at <FillableField label="Contact Number" value={val('Contact Number')} onClick={onFieldClick} isActive={isActive('Contact Number')} inline /> or
          email <FillableField label="School Email" value={val('School Email')} onClick={onFieldClick} isActive={isActive('School Email')} inline />.
        </p>

        <p>Thank you for your continued support to our academic programs.</p>

        <p className="pt-4">Respectfully,</p>

        <div className="pt-12 flex justify-between">
          <div className="text-center w-5/12">
            <div className="border-t border-zinc-800 dark:border-zinc-200 pt-1 font-bold">
              <FillableField label="OJT Coordinator Name" value={val('OJT Coordinator Name')} onClick={onFieldClick} isActive={isActive('OJT Coordinator Name')} />
            </div>
            <div className="text-xs text-zinc-500 mt-1">Practicum Coordinator</div>
            <div className="text-xs text-zinc-500">[SCHOOL NAME] - DEMO</div>
          </div>
          <div className="text-center w-5/12">
            <div className="border-t border-zinc-800 dark:border-zinc-200 pt-1 font-bold">Noted By</div>
            <div className="text-xs text-zinc-500 mt-1">School Administrator</div>
            <div className="text-xs text-zinc-500">[SCHOOL NAME] - DEMO</div>
          </div>
        </div>
      </div>
    </>
  );
};
