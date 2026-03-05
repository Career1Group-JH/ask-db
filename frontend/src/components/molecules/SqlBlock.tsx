import { useState, useCallback } from "react";
import { ChevronDown, Code, Brain, Copy, Check } from "lucide-react";
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
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!sql) return;
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [sql]);

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
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Code className="h-3 w-3" />
                SQL
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-muted-foreground/10 transition-colors"
                title="SQL kopieren"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
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
