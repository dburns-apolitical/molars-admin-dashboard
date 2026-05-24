export function DeltaIndicator({ delta }: { delta: number | null }) {
    if (delta === null) return <span className="text-muted-foreground text-sm font-mono">N/A</span>;

    const isPositive = delta >= 0;
    return (
        <span
            className="font-mono text-[11px] tabular-nums"
            style={{ color: isPositive ? 'var(--term-ok)' : 'var(--term-danger)' }}
        >
            {isPositive ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
        </span>
    );
}
