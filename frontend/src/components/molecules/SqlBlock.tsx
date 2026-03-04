import { ChevronDown, Code, Brain } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SqlBlockProps {
  sql: string;
  reasoning: string;
  steps: Record<string, unknown>[];
}

export function SqlBlock({ sql, reasoning, steps }: SqlBlockProps) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
        <Code className="h-3 w-3" />
        <span>SQL &amp; Reasoning</span>
        <ChevronDown className="h-3 w-3 transition-transform [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-2">
        {reasoning && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Brain className="h-3 w-3" />
              Reasoning
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {reasoning}
            </p>
          </div>
        )}

        {sql && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Code className="h-3 w-3" />
              SQL
            </div>
            <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">
              <code>{sql}</code>
            </pre>
          </div>
        )}

        {steps.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">
              Exploration Steps ({steps.length})
            </div>
            {steps.map((step, i) => (
              <pre
                key={i}
                className="rounded-md bg-muted p-2 text-xs overflow-x-auto"
              >
                <code>{JSON.stringify(step, null, 2)}</code>
              </pre>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
