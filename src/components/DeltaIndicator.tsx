export function DeltaIndicator({ delta }: { delta: number | null }) {
    if (delta === null) return <span className="text-muted-foreground text-sm">N/A</span>;

    const isPositive = delta >= 0;
    return (
        <span className={`text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
        </span>
    );
}
