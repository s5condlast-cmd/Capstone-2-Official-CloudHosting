import React from 'react';
import { FillableField } from '@/src/components/compose/FillableField';

interface ConsentPreviewProps {
  fieldValues?: Record<string, string>;
  onFieldClick?: (fieldLabel: string) => void;
  activeField?: string;
}

export const ConsentPreview: React.FC<ConsentPreviewProps> = ({
  fieldValues = {},
  onFieldClick = () => { },
  activeField
}) => {
  const val = (key: string) => fieldValues[key] || '';
  const isActive = (label: string) => activeField === label;

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold uppercase tracking-widest">Letter of Consent</h1>
        <h3 className="text-sm font-normal">(Parental / Guardian Consent for On-the-Job Training)</h3>
      </div>

      <div className="space-y-6">
        <p className="text-sm">Date: <FillableField label="Date" value={val('Date')} onClick={onFieldClick} isActive={isActive('Date')} inline /></p>

        <div className="text-sm">
          <p className="font-bold">The Practicum Coordinator</p>
          <p>[SCHOOL NAME] - DEMO</p>
          <p>289 L. de Guzman Street, Concepcion I, Marikina City, 1807 Metro Manila</p>
        </div>

        <p className="text-sm">Dear Sir/Madam,</p>

        <p className="text-sm text-justify leading-relaxed">
          I, <FillableField label="Parent / Guardian Name" value={val('Parent / Guardian Name')} onClick={onFieldClick} isActive={isActive('Parent / Guardian Name')} inline />, of legal age,
          and the parent/guardian of <FillableField label="Student Name (Full)" value={val('Student Name (Full)')} onClick={onFieldClick} isActive={isActive('Student Name (Full)')} inline />,
          a student of [SCHOOL NAME] - DEMO currently enrolled in <FillableField label="Degree / Program Name" value={val('Degree / Program Name')} onClick={onFieldClick} isActive={isActive('Degree / Program Name')} inline /> (Course/Section),
          do hereby give my full consent for my son/daughter to undergo the On-the-Job Training (OJT) / Practicum program as required by the school.
        </p>

        <p className="text-sm">I understand that my son/daughter will be deployed to:</p>

        <table className="w-full text-sm ml-4 my-4">
          <tbody>
            <tr>
              <td className="w-1/3 py-1 font-bold">Company Name:</td>
              <td className="border-b border-zinc-400 dark:border-zinc-600">
                <FillableField label="Company Name" value={val('Company Name')} onClick={onFieldClick} isActive={isActive('Company Name')} />
              </td>
            </tr>
            <tr>
              <td className="py-1 font-bold">Company Address:</td>
              <td className="border-b border-zinc-400 dark:border-zinc-600">
                <FillableField label="Company Address" value={val('Company Address')} onClick={onFieldClick} isActive={isActive('Company Address')} />
              </td>
            </tr>
            <tr>
              <td className="py-1 font-bold">OJT Duration:</td>
              <td className="border-b border-zinc-400 dark:border-zinc-600">
                <FillableField label="Required OJT Hours" value={val('Required OJT Hours')} onClick={onFieldClick} isActive={isActive('Required OJT Hours')} />
              </td>
            </tr>
          </tbody>
        </table>

        <p className="text-sm text-justify leading-relaxed">
          I am fully aware of the nature, scope, and risks involved in the training and I agree to assume full responsibility for any eventualities that may arise during the entire duration of the practicum.
        </p>

        <p className="text-sm text-justify leading-relaxed">
          I also certify that my son/daughter is in good health and is physically fit to undertake the training program.
        </p>

        <p className="text-sm pt-4">Respectfully,</p>

        <div className="pt-12">
          <div className="w-64 border-t border-zinc-800 dark:border-zinc-200 text-center text-sm pt-1 mb-4">
            Parent / Guardian Signature
          </div>
          <table className="text-sm">
            <tbody>
              <tr>
                <td className="py-1">Printed Name:</td>
                <td className="border-b border-zinc-400 dark:border-zinc-600 w-48 ml-2 block">
                  <FillableField label="Guardian Printed Name" value={val('Guardian Printed Name')} onClick={onFieldClick} isActive={isActive('Guardian Printed Name')} />
                </td>
              </tr>
              <tr>
                <td className="py-1">Contact Number:</td>
                <td className="border-b border-zinc-400 dark:border-zinc-600 w-48 ml-2 block">
                  <FillableField label="Guardian Contact" value={val('Guardian Contact')} onClick={onFieldClick} isActive={isActive('Guardian Contact')} />
                </td>
              </tr>
              <tr>
                <td className="py-1">Relationship to Student:</td>
                <td className="border-b border-zinc-400 dark:border-zinc-600 w-48 ml-2 block">
                  <FillableField label="Relationship" value={val('Relationship')} onClick={onFieldClick} isActive={isActive('Relationship')} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-8">
          <h3 className="font-bold text-sm mb-12">Student's Conforme:</h3>
          <div className="w-64 border-t border-zinc-800 dark:border-zinc-200 text-center text-sm pt-1">
            Student Signature over Printed Name
          </div>
        </div>
      </div>
    </>
  );
};
