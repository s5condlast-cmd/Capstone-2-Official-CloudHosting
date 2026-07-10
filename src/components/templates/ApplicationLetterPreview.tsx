import React from 'react';
import { FillableField } from '@/src/components/compose/FillableField';

interface ApplicationLetterPreviewProps {
  fieldValues?: Record<string, string>;
  onFieldClick?: (fieldLabel: string) => void;
  activeField?: string;
}

export const ApplicationLetterPreview: React.FC<ApplicationLetterPreviewProps> = ({
  fieldValues = {},
  onFieldClick = () => { },
  activeField
}) => {
  const val = (key: string) => fieldValues[key] || '';
  const isActive = (label: string) => activeField === label;

  const BodyParagraph: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p>{children}</p>
  );

  return (
    <article className="font-serif text-[11pt] leading-relaxed max-w-[8in] mx-auto text-zinc-900 dark:text-zinc-100">
      {/* Date */}
      <div className="mb-8">
        <FillableField label="Date" value={val('date')} onClick={onFieldClick} isActive={isActive('Date')} inline />
      </div>

      {/* Recipient Block */}
      <div className="mb-8 space-y-1">
        <div><FillableField label="Industry Representative Name" value={val('contactPerson')} onClick={onFieldClick} isActive={isActive('Industry Representative Name')} inline /></div>
        <div><FillableField label="Position / Title" value={val('contactTitle')} onClick={onFieldClick} isActive={isActive('Position / Title')} inline /></div>
        <div><FillableField label="Company Name" value={val('companyName')} onClick={onFieldClick} isActive={isActive('Company Name')} inline /></div>
        <div><FillableField label="Company Address" value={val('companyAddress')} onClick={onFieldClick} isActive={isActive('Company Address')} inline /></div>
      </div>

      {/* Salutation */}
      <div className="mb-6">
        <p>Dear Mr./Ms. <FillableField label="Industry Representative Name" value={val('contactPerson')} onClick={onFieldClick} isActive={isActive('Industry Representative Name')} inline />:</p>
      </div>

      {/* Body Paragraphs */}
      <div className="space-y-6 text-justify">
        <BodyParagraph>
          I, a student of STI <FillableField label="Campus Name" value={val('campusName')} onClick={onFieldClick} isActive={isActive('Campus Name')} inline />, am required to undergo <FillableField label="Required OJT Hours" value={val('hoursRequired')} onClick={onFieldClick} isActive={isActive('Required OJT Hours')} inline /> hours of On-the-Job Training (OJT) in partial fulfillment of the requirements for my <FillableField label="Degree / Program Name" value={val('programName')} onClick={onFieldClick} isActive={isActive('Degree / Program Name')} inline /> program.
        </BodyParagraph>

        <BodyParagraph>
          I can acquire valuable knowledge and skills to complement those I have learned from school with your company. In return, I offer my services and determination to be an asset to your company throughout my training period.
        </BodyParagraph>

        <BodyParagraph>
          Enclosed is an endorsement letter from my Program Head and my resume.
        </BodyParagraph>

        <BodyParagraph>
          I am hoping for your kind consideration.
        </BodyParagraph>

        <BodyParagraph>
          Thank you.
        </BodyParagraph>
      </div>

      {/* Sign-off */}
      <div className="mt-12">
        <p className="mb-8">Respectfully yours,</p>
        <div className="inline-block min-w-[200px]">
          <div className="font-bold border-b border-zinc-900 dark:border-zinc-100 text-center pb-1 mb-1 min-h-[1.5rem]">
            <FillableField label="Name of Student Trainee" value={val('studentName')} onClick={onFieldClick} isActive={isActive('Name of Student Trainee')} inline />
          </div>
          <div className="text-center text-sm">OJT Applicant</div>
        </div>
      </div>
    </article>
  );
};
