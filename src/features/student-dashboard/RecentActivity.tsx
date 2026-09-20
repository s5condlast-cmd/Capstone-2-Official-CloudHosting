/**
 * RecentActivity.tsx
 * Bottom-Right Bento Card matching the reference design's "Comments" card:
 * - Live feed of adviser feedback remarks and document reviews
 * - Circular avatar bubbles, author attribution, and formatted notes
 * - Full-width "Open Review Center" pill button
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { AdviserFeedbackItem } from './studentDashboard.types';

interface RecentActivityProps {
  feedbackList: AdviserFeedbackItem[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ feedbackList }) => {
  return (
    <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
              Adviser Remarks
            </h2>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Feedback from faculty & mentor reviews
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            {feedbackList.length} Notes
          </span>
        </div>

        {/* Feedback / Comments Feed (Matching Reference "Comments") */}
        <div className="space-y-3.5 pt-1">
          {feedbackList.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
              <MessageSquare size={24} className="mx-auto text-muted-foreground/50" />
              <p>No remarks yet. Upload your Before OJT clearance documents to receive feedback.</p>
            </div>
          ) : (
            feedbackList.slice(0, 3).map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 hover:bg-muted/40 transition-colors space-y-2 text-xs"
              >
                {/* Author row with circular avatar (Matching reference comment header) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                      {item.authorInitials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-foreground truncate text-xs">{item.authorName}</span>
                        <span className="text-muted-foreground text-[10px]">on</span>
                        <span className="font-semibold text-foreground text-xs truncate max-w-[140px]">{item.documentTitle}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                    {item.formattedDate}
                  </span>
                </div>

                {/* Feedback remark text */}
                <p className="text-xs text-muted-foreground leading-relaxed pl-10.5">
                  "{item.feedback}"
                </p>

                {/* Status tag */}
                <div className="pl-10.5 flex items-center justify-between pt-0.5">
                  <span
                    className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                      item.status === 'Approved' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                      item.status.includes('Revision') && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                      item.status.includes('Review') && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    )}
                  >
                    {item.status}
                  </span>

                  <Link
                    to={item.link}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    View details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pt-2">
        <Link to="/student/reviews" className="block w-full">
          <button
            type="button"
            className="w-full py-2.5 px-4 rounded-full border border-border/80 hover:bg-muted/50 text-foreground font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs active:scale-[0.99]"
          >
            <span>Open Document Review Center</span>
            <ArrowRight size={13} />
          </button>
        </Link>
      </div>
    </div>
  );
};
