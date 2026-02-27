import { useSearchParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useEvaluations } from '@/hooks/useEvaluations';
import { prepareMarkdown } from '@/lib/utils';

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function Evaluations() {
  const [searchParams] = useSearchParams();
  const openLatest = searchParams.get('open') === 'latest';
  const { data, isLoading, error, refetch } = useEvaluations();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">Error loading evaluations: {error.message}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Evaluations</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Evaluations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 border-b last:border-b-0 pb-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <Accordion
              type="single"
              collapsible
              defaultValue={openLatest ? `eval-${data[0].id}` : undefined}
            >
              {data.map((evaluation) => (
                <AccordionItem key={evaluation.id} value={`eval-${evaluation.id}`}>
                  <AccordionTrigger>
                    <div className="flex flex-wrap items-center gap-2 pr-4">
                      <span className="font-medium">{formatDate(evaluation.created_at)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {evaluation.model}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {evaluation.triggered_by}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Markdown>{prepareMarkdown(evaluation.response)}</Markdown>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No evaluations available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
