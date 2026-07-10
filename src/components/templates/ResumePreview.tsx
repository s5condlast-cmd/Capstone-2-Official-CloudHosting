import React from 'react';
import { FillableField } from '@/src/components/compose/FillableField';

interface ResumePreviewProps {
  fieldValues?: Record<string, string>;
  onFieldClick?: (fieldLabel: string) => void;
  activeField?: string;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  fieldValues = {},
  onFieldClick = () => {},
  activeField
}) => {
  const val = (key: string) => fieldValues[key] || '';
  const isActive = (label: string) => activeField === label;

  return (
    <>
      <h1 className="text-xl font-bold text-center uppercase tracking-widest mb-8">Practicum Resume</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-4">I. Personal Information</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="w-1/3 py-1 font-bold">Full Name:</td>
                <td className="border-b border-zinc-400 dark:border-zinc-600">
                  <FillableField label="Full Name" value={val('Full Name')} onClick={onFieldClick} isActive={isActive('Full Name')} />
                </td>
              </tr>
              <tr>
                <td className="py-1 font-bold">Address:</td>
                <td className="border-b border-zinc-400 dark:border-zinc-600">
                  <FillableField label="Address" value={val('Address')} onClick={onFieldClick} isActive={isActive('Address')} />
                </td>
              </tr>
              <tr>
                <td className="py-1 font-bold">Contact Number:</td>
                <td className="border-b border-zinc-400 dark:border-zinc-600">
                  <FillableField label="Contact Number" value={val('Contact Number')} onClick={onFieldClick} isActive={isActive('Contact Number')} />
                </td>
              </tr>
              <tr>
                <td className="py-1 font-bold">Email Address:</td>
                <td className="border-b border-zinc-400 dark:border-zinc-600">
                  <FillableField label="Email Address" value={val('Email Address')} onClick={onFieldClick} isActive={isActive('Email Address')} />
                </td>
              </tr>
              <tr>
                <td className="py-1 font-bold">Date of Birth:</td>
                <td className="border-b border-zinc-400 dark:border-zinc-600">
                  <FillableField label="Date of Birth" value={val('Date of Birth')} onClick={onFieldClick} isActive={isActive('Date of Birth')} />
                </td>
              </tr>
              <tr>
                <td className="py-1 font-bold">Civil Status:</td>
                <td className="border-b border-zinc-400 dark:border-zinc-600">
                  <FillableField label="Civil Status" value={val('Civil Status')} onClick={onFieldClick} isActive={isActive('Civil Status')} />
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-4">II. Educational Background</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700">
                <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left">Level</th>
                <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left">School Name</th>
                <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left">Year Graduated</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-zinc-300 dark:border-zinc-700 p-2">College</td>
                <td className="border border-zinc-300 dark:border-zinc-700 p-2">
                  <FillableField label="College School" value={val('College School')} onClick={onFieldClick} isActive={isActive('College School')} />
                </td>
                <td className="border border-zinc-300 dark:border-zinc-700 p-2">
                  <FillableField label="College Year" value={val('College Year')} onClick={onFieldClick} isActive={isActive('College Year')} />
                </td>
              </tr>
              <tr>
                <td className="border border-zinc-300 dark:border-zinc-700 p-2">Senior High</td>
                <td className="border border-zinc-300 dark:border-zinc-700 p-2">
                  <FillableField label="SHS School" value={val('SHS School')} onClick={onFieldClick} isActive={isActive('SHS School')} />
                </td>
                <td className="border border-zinc-300 dark:border-zinc-700 p-2">
                  <FillableField label="SHS Year" value={val('SHS Year')} onClick={onFieldClick} isActive={isActive('SHS Year')} />
                </td>
              </tr>
              <tr>
                <td className="border border-zinc-300 dark:border-zinc-700 p-2">Junior High</td>
                <td className="border border-zinc-300 dark:border-zinc-700 p-2">
                  <FillableField label="JHS School" value={val('JHS School')} onClick={onFieldClick} isActive={isActive('JHS School')} />
                </td>
                <td className="border border-zinc-300 dark:border-zinc-700 p-2">
                  <FillableField label="JHS Year" value={val('JHS Year')} onClick={onFieldClick} isActive={isActive('JHS Year')} />
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-4">III. Course & Section</h2>
          <div className="flex gap-4">
            <div className="flex-1">Program: <FillableField label="Program" value={val('Program')} onClick={onFieldClick} isActive={isActive('Program')} inline /></div>
            <div className="flex-1">Section: <FillableField label="Section" value={val('Section')} onClick={onFieldClick} isActive={isActive('Section')} inline /></div>
            <div className="flex-1">School Year: <FillableField label="School Year" value={val('School Year')} onClick={onFieldClick} isActive={isActive('School Year')} inline /></div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-4">IV. Technical Skills</h2>
          <p className="text-xs text-zinc-500 italic mb-2">(List programming languages, tools, frameworks, and software you are proficient in)</p>
          <FillableField label="Technical Skills" value={val('Technical Skills')} onClick={onFieldClick} isActive={isActive('Technical Skills')} />
        </section>

        <section>
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-4">V. Certifications & Seminars</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700">
                <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left">Title</th>
                <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left">Issuing Organization</th>
                <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map(i => (
                <tr key={i}>
                  <td className="border border-zinc-300 dark:border-zinc-700 p-2">
                    <FillableField label={`Cert ${i} Title`} value={val(`Cert ${i} Title`)} onClick={onFieldClick} isActive={isActive(`Cert ${i} Title`)} />
                  </td>
                  <td className="border border-zinc-300 dark:border-zinc-700 p-2">
                    <FillableField label={`Cert ${i} Org`} value={val(`Cert ${i} Org`)} onClick={onFieldClick} isActive={isActive(`Cert ${i} Org`)} />
                  </td>
                  <td className="border border-zinc-300 dark:border-zinc-700 p-2">
                    <FillableField label={`Cert ${i} Date`} value={val(`Cert ${i} Date`)} onClick={onFieldClick} isActive={isActive(`Cert ${i} Date`)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-4">VI. Work / OJT Experience</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700">
                <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left">Company</th>
                <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left">Position</th>
                <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left">Duration</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2].map(i => (
                <tr key={i}>
                  <td className="border border-zinc-300 dark:border-zinc-700 p-2">
                    <FillableField label={`Work ${i} Company`} value={val(`Work ${i} Company`)} onClick={onFieldClick} isActive={isActive(`Work ${i} Company`)} />
                  </td>
                  <td className="border border-zinc-300 dark:border-zinc-700 p-2">
                    <FillableField label={`Work ${i} Position`} value={val(`Work ${i} Position`)} onClick={onFieldClick} isActive={isActive(`Work ${i} Position`)} />
                  </td>
                  <td className="border border-zinc-300 dark:border-zinc-700 p-2">
                    <FillableField label={`Work ${i} Duration`} value={val(`Work ${i} Duration`)} onClick={onFieldClick} isActive={isActive(`Work ${i} Duration`)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-4">VII. Character References</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700">
                <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left">Name</th>
                <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left">Position / Relationship</th>
                <th className="border border-zinc-300 dark:border-zinc-700 p-2 text-left">Contact</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2].map(i => (
                <tr key={i}>
                  <td className="border border-zinc-300 dark:border-zinc-700 p-2">
                    <FillableField label={`Ref ${i} Name`} value={val(`Ref ${i} Name`)} onClick={onFieldClick} isActive={isActive(`Ref ${i} Name`)} />
                  </td>
                  <td className="border border-zinc-300 dark:border-zinc-700 p-2">
                    <FillableField label={`Ref ${i} Position`} value={val(`Ref ${i} Position`)} onClick={onFieldClick} isActive={isActive(`Ref ${i} Position`)} />
                  </td>
                  <td className="border border-zinc-300 dark:border-zinc-700 p-2">
                    <FillableField label={`Ref ${i} Contact`} value={val(`Ref ${i} Contact`)} onClick={onFieldClick} isActive={isActive(`Ref ${i} Contact`)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="pt-8">
          <p className="text-xs italic mb-12">I certify that the above information is true and correct to the best of my knowledge.</p>
          <div className="w-64 border-t border-zinc-800 dark:border-zinc-200 text-center text-sm pt-1">
            Signature over Printed Name
          </div>
        </div>
      </div>
    </>
  );
};
