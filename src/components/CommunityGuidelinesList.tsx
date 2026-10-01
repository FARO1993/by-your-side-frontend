import { COMMUNITY_GUIDELINES } from '../lib/communityGuidelines';

export function CommunityGuidelinesList({ className }: { className?: string }) {
  return (
    <ol className={className ?? 'space-y-3'}>
      {COMMUNITY_GUIDELINES.map((guideline, index) => (
        <li key={guideline.title} className="flex gap-3">
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-listening-soft text-xs font-semibold text-listening-strong"
          >
            {index + 1}
          </span>
          <div>
            <p className="font-medium text-foreground">{guideline.title}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{guideline.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
