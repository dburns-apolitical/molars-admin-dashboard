import { AuthView } from '@neondatabase/neon-js/auth/react/ui';
import { useParams } from 'react-router-dom';

export function Auth() {
    const { pathname } = useParams();
    return (
        <div className="min-h-screen grid place-items-center p-6">
            <div className="w-full max-w-[420px] bg-card border border-border p-7 font-mono">
                <div className="mb-5">
                    <div className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
                        <span className="brand-dot" aria-hidden />
                        <span className="text-[var(--term-text-faint)]">[</span>
                        molars
                        <span className="text-[var(--term-text-faint)]">]</span>
                    </div>
                    <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--term-text-faint)] mt-3">
                        $ molars auth --login
                    </div>
                    <h1 className="text-xl font-semibold lowercase mt-2">
                        sign in<span className="cursor" aria-hidden />
                    </h1>
                </div>
                <AuthView pathname={pathname} />
            </div>
        </div>
    );
}