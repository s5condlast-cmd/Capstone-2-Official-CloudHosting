import React from 'react';
import { FillableField } from '@/src/components/compose/FillableField';

interface ProposalPreviewProps {
  fieldValues?: Record<string, string>;
  onFieldClick?: (fieldLabel: string) => void;
  activeField?: string;
}

export const ProposalPreview: React.FC<ProposalPreviewProps> = ({
  fieldValues = {},
  onFieldClick = () => {},
  activeField
}) => {
  const val = (key: string) => fieldValues[key] || '';
  const isActive = (label: string) => activeField === label;

  const today = new Date();
  const dateStr = val('Date') || today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold uppercase tracking-widest">Proposal Letter</h1>
        <h3 className="text-sm font-normal">(Proposal for On-the-Job Training Partnership)</h3>
      </div>

      <div className="space-y-6 text-sm text-justify leading-relaxed">
        <div>
          <FillableField label="Date" value={val('Date')} onClick={onFieldClick} isActive={isActive('Date')} inline />
        </div>

        <div className="space-y-0.5">
          <p className="font-semibold text-black dark:text-white">
            <FillableField label="Industry Representative Name" value={val('Industry Representative Name')} onClick={onFieldClick} isActive={isActive('Industry Representative Name')} inline />
          </p>
          <p><FillableField label="Position / Title" value={val('Position / Title')} onClick={onFieldClick} isActive={isActive('Position / Title')} inline /></p>
          <p><FillableField label="Company Name" value={val('Company Name')} onClick={onFieldClick} isActive={isActive('Company Name')} inline /></p>
          <p><FillableField label="Company Address" value={val('Company Address')} onClick={onFieldClick} isActive={isActive('Company Address')} inline /></p>
        </div>

        <p>Dear <FillableField label="Industry Representative Name" value={val('Industry Representative Name')} onClick={onFieldClick} isActive={isActive('Industry Representative Name')} inline />,</p>

        <p>Greetings of peace!</p>

        <p>
          As part of the curriculum of our <FillableField label="Degree / Program Name" value={val('Degree / Program Name')} onClick={onFieldClick} isActive={isActive('Degree / Program Name')} inline /> program, 
          our students are required to undergo On-the-Job Training (OJT) for a minimum of <FillableField label="Required OJT Hours" value={val('Required OJT Hours')} onClick={onFieldClick} isActive={isActive('Required OJT Hours')} inline /> hours. 
          This training aims to provide students with practical experience and exposure to the real-world industry environment.
        </p>

        <p>
          In this regard, we would like to propose a partnership with <FillableField label="Company Name" value={val('Company Name')} onClick={onFieldClick} isActive={isActive('Company Name')} inline /> to accommodate our students for their OJT. 
          Specifically, we are proposing the deployment of <FillableField label="Student Name (Full)" value={val('Student Name (Full)')} onClick={onFieldClick} isActive={isActive('Student Name (Full)')} inline /> to your esteemed company.
        </p>

        <p>
          We believe that your company's expertise and industry standing will provide our students with the best possible training ground. 
          We are confident that our students will be able to contribute meaningfully to your company while learning from your experienced professionals.
        </p>

        <p>
          We hope for your favorable response to this proposal. We look forward to a mutually beneficial partnership with your company.
        </p>

        <p>Thank you very much.</p>

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
