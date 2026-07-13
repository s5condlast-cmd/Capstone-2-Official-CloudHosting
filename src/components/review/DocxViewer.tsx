import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';

interface DocxViewerProps {
  buffer: ArrayBuffer;
  className?: string;
  isEditable?: boolean;
}

export const DocxViewer: React.FC<DocxViewerProps> = ({ buffer, className, isEditable }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !buffer) return;

    const renderDocx = async () => {
      try {
        setError(null);
        containerRef.current!.innerHTML = ''; // Clear previous render
        await renderAsync(buffer, containerRef.current!, undefined, {
          className: "docx-document",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          ignoreFonts: false,
        });



        // Remove header elements as they should not be visible in the preview
        const headers = containerRef.current!.querySelectorAll('header');
        headers.forEach(h => h.remove());

        // Post-process to wrap placeholders [ ... ], blanks ___, and highlighted text in editable spans
        const walk = document.createTreeWalker(containerRef.current!, NodeFilter.SHOW_TEXT);
        const nodesToWrap: Node[] = [];
        let node;
        while ((node = walk.nextNode())) {
          if (node.nodeValue && node.nodeValue.match(/(\[.*?\]|_{3,}|<.*?>|^\s*Date\s*:?\s*$)/)) {
            nodesToWrap.push(node);
          }
        }

        let blankIndex = 0;
        let dateIndex = 0;
        nodesToWrap.forEach(node => {
          const text = node.nodeValue || '';
          const regex = /(\[.*?\]|_{3,}|<.*?>|^\s*Date\s*:?\s*$)/g;
          const parts = text.split(regex);
          const fragment = document.createDocumentFragment();

          parts.forEach(part => {
            if (part.match(regex)) {
              const span = document.createElement('span');
              span.className = "editable-placeholder"; // Visual styling removed as requested
              span.textContent = part;
              span.setAttribute("data-original", part);
              span.setAttribute("suppressContentEditableWarning", "true");

              if (part.match(/_{3,}/)) {
                span.setAttribute("data-blank-index", blankIndex.toString());
                blankIndex++;
              } else if (part.match(/^\s*Date\s*:?\s*$/)) {
                span.setAttribute("data-date-index", dateIndex.toString());
                dateIndex++;
              }

              fragment.appendChild(span);
            } else if (part) {
              fragment.appendChild(document.createTextNode(part));
            }
          });
          node.parentNode?.replaceChild(fragment, node);
        });

        // Highlighted elements (e.g. from docx highlight feature)
        const allElements = containerRef.current!.querySelectorAll('span');
        allElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style.backgroundColor && htmlEl.style.backgroundColor !== 'transparent' && htmlEl.style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            htmlEl.classList.add("editable-placeholder");
            htmlEl.setAttribute("suppressContentEditableWarning", "true");
            htmlEl.classList.add("focus:outline-none", "focus:ring-2", "focus:ring-blue-400/50", "rounded-sm", "transition-all");
          }
        });

        // Trigger the effect to set contentEditable
        const event = new Event('docx-rendered');
        containerRef.current?.dispatchEvent(event);
      } catch (err) {
        console.error('docx-preview error:', err);
        setError('Failed to render document preview.');
      }
    };

    renderDocx();
  }, [buffer]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateEditability = () => {
      const placeholders = containerRef.current!.querySelectorAll('.editable-placeholder');
      placeholders.forEach(el => {
        const htmlEl = el as HTMLElement;
        htmlEl.contentEditable = "false"; // Explicitly disabled inline editing as requested
        htmlEl.style.pointerEvents = "none"; // Ensure they are not clickable
      });
    };

    updateEditability();

    // Listen for custom event
    containerRef.current.addEventListener('docx-rendered', updateEditability);
    return () => {
      containerRef.current?.removeEventListener('docx-rendered', updateEditability);
    };
  }, [isEditable, buffer]);

  if (error) {
    return (
      <div className="flex items-center justify-center p-12 text-zinc-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: '1056px' }}
    />
  );
};
