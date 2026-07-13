import { AiFindings } from '../../src/types';

const SYSTEM_PROMPT = `You are the "AI Review Assistant", an intelligent practicum document analyzer.
Your task is to review the text extracted from a student's uploaded document and compare it against the student's database metadata to verify correctness, completeness, and consistency.

Analyze the document for:
1. Grammar & spelling errors (give a count).
2. Missing information (e.g. signature fields, dates, contact info, empty templates).
3. Inconsistent details (e.g. check if the student's name, course, company, or document type in the text matches the metadata provided).
4. Formatting issues that affect readability.

IMPORTANT: You MUST return a valid JSON object matching this schema:
{
  "overallAssessment": "Good" | "Needs Attention" | "Critical Issues",
  "grammarIssues": number,
  "missingInformation": string[],
  "consistencyIssues": string[],
  "recommendations": string[],
  "confidence": "High" | "Medium" | "Low"
}`;

export async function analyzeDocumentText(
  docText: string,
  metadata: { name: string; course: string; docType: string; company: string }
): Promise<AiFindings> {
  // Truncate text to avoid token bloat
  const maxInputLength = 25000;
  const truncatedText = docText.length > maxInputLength
    ? docText.substring(0, maxInputLength) + "\n\n[Content truncated by AI Review Assistant to conserve tokens]"
    : docText;

  const userPrompt = `Student Metadata:
- Name: ${metadata.name}
- Course/Program: ${metadata.course}
- Document Type: ${metadata.docType}
- Target Company: ${metadata.company}

Extracted Document Content:
${truncatedText}`;

  const groqKey = process.env.VITE_GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  let findings: AiFindings | null = null;

  // 1. Try Groq First
  if (groqKey && groqKey !== 'your_groq_api_key_here') {
    try {
      console.log('[AI Assistant Service] Calling Groq API...');
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API returned status ${response.status}`);
      }

      const data = await response.json();
      const contentStr = data.choices?.[0]?.message?.content;
      if (contentStr) {
        findings = JSON.parse(contentStr);
        console.log('[AI Assistant Service] Groq analysis completed.');
      }
    } catch (err) {
      console.warn('[AI Assistant Service] Groq failed, falling back to Gemini...', err);
    }
  }

  // 2. Fallback to Gemini
  if (!findings && geminiKey && geminiKey !== 'MY_GEMINI_API_KEY') {
    try {
      console.log('[AI Assistant Service] Calling Gemini API...');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: SYSTEM_PROMPT + '\n\n' + userPrompt }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
              maxOutputTokens: 1024
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const data = await response.json();
      const contentStr = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (contentStr) {
        findings = JSON.parse(contentStr);
        console.log('[AI Assistant Service] Gemini analysis completed.');
      }
    } catch (err) {
      console.error('[AI Assistant Service] Gemini failed:', err);
    }
  }

  if (!findings) {
    throw new Error('All AI models failed or API keys are unconfigured.');
  }

  return findings;
}
