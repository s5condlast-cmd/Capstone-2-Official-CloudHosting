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

  const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
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

export interface AssistEditorOptions {
  action: 'improve' | 'fix_grammar' | 'make_formal' | 'summarize' | 'continue_writing' | 'custom';
  text?: string;
  customPrompt?: string;
  documentContext?: string;
}

export async function assistEditorText({
  action,
  text = '',
  customPrompt = '',
  documentContext = '',
}: AssistEditorOptions): Promise<string> {
  const actionPrompts: Record<string, string> = {
    improve: 'Improve this text for clarity, professional vocabulary, and coherent academic flow while preserving its core intent:',
    fix_grammar: 'Correct any spelling mistakes, punctuation errors, and grammatical inaccuracies in this text without changing its tone or meaning:',
    make_formal: 'Rewrite this text to be formal, polite, and suited for institutional correspondence and On-the-Job Training practicum submissions:',
    summarize: 'Provide a concise, well-structured summary of the following document content:',
    continue_writing: 'Continue writing the next logical paragraph or sections based on the preceding text, maintaining the same formal tone and structure:',
    custom: customPrompt || 'Assist with editing or writing this document:',
  };

  const instruction = actionPrompts[action] || actionPrompts.custom;
  const prompt = `${instruction}

Target Text:
"""
${text || documentContext}
"""

${documentContext && text ? `Document Context:\n"""\n${documentContext.slice(0, 4000)}\n"""` : ''}

Respond ONLY with the enhanced or generated document text. Do not include markdown code block backticks (like \`\`\`), conversational commentary, or prefixes like "Here is your text:". Return plain written content directly.`;

  const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // 1. Try Groq
  if (groqKey && groqKey !== 'your_groq_api_key_here') {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are an expert institutional writing assistant for college students completing internship documents. Return only the revised or generated document text without explanations or markdown code blocks.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const output = data.choices?.[0]?.message?.content?.trim();
        if (output) return output;
      }
    } catch (e) {
      console.warn('[AI Editor] Groq call failed, falling back to Gemini:', e);
    }
  }

  // 2. Try Gemini
  if (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1500,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (output) return output;
      }
    } catch (e) {
      console.warn('[AI Editor] Gemini call failed:', e);
    }
  }

  throw new Error('AI service unavailable. Please ensure GROQ_API_KEY or GEMINI_API_KEY is configured.');
}
