import {
  RedirectToSignIn,
  SignedIn,
  UserButton,
} from '@neondatabase/neon-js/auth/react/ui';
import {
  MenuIcon,
  HomeIcon,
  PenSquareIcon,
  ListIcon,
  FilmIcon,
  UsersIcon,
  SparklesIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AccountsProvider } from '@/contexts/AccountsContext';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'dashboard', icon: HomeIcon, end: true },
  { to: '/post', label: 'post', icon: PenSquareIcon },
  { to: '/content', label: 'content', icon: ListIcon },
  { to: '/media', label: 'media', icon: FilmIcon },
  { to: '/accounts', label: 'accounts', icon: UsersIcon },
  { to: '/evaluations', label: 'evals', icon: SparklesIcon },
];

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function MobileNav() {
  const location = useLocation();
  const isActive = (path: string, end?: boolean) =>
    end ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <MenuIcon className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="font-mono tracking-tight lowercase">
            // menu
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 py-6 font-mono">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => {
            const active = isActive(to, end);
            return (
              <SheetClose asChild key={to}>
                <Link
                  to={to}
                  className={`flex items-center gap-4 px-4 py-4 text-sm lowercase tracking-wide border transition-colors ${
                    active
                      ? 'border-border text-[var(--term-accent)] bg-[var(--term-accent-fade)] before:content-["»_"] before:text-[var(--term-accent)]'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>
        <div className="mt-auto border-t py-6 flex justify-center user-button-dark">
          <UserButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TopBar() {
  const now = useClock();
  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <header className="term-topbar">
      <div className="term-topbar-inner">
        <Link to="/" className="term-brand">
          <span className="brand-dot" aria-hidden />
          <span className="term-brand-bracket">[</span>
          molars
          <span className="term-brand-bracket">]</span>
        </Link>

        <nav className="term-nav hidden md:flex">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `term-nav-link${isActive ? ' active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="term-topbar-meta ml-auto">
          <span className="clock tnum" aria-label="clock">
            {time}
          </span>
          <span className="sep">│</span>
          <span className="user-button-dark hidden md:inline-flex">
            <UserButton />
          </span>
          <span className="md:hidden">
            <MobileNav />
          </span>
        </div>
      </div>
    </header>
  );
}

function StatusBar() {
  const now = useClock();
  const stamp = now.toLocaleString('en-US', { hour12: false });
  return (
    <div className="term-statusbar">
      <span>
        <span className="ok">●</span> SYS_OK
      </span>
      <span className="sep">│</span>
      <span>
        queue: <span className="acc tnum">2</span> pending
      </span>
      <span className="sep">│</span>
      <span>
        api: <span className="ok">200</span> ·{' '}
        <span className="tnum">128ms</span>
      </span>
      <span className="sep">│</span>
      <span>
        build: <span className="acc">v0.42.1-rc</span>
      </span>
      <span className="tnum" style={{ marginLeft: 'auto' }}>
        {stamp}
      </span>
    </div>
  );
}

export function Layout() {
  return (
    <>
      <SignedIn>
        <AccountsProvider>
          <div className="min-h-screen bg-background flex flex-col">
            <TopBar />
            <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-7 pb-24">
              <Outlet />
            </main>
            <StatusBar />
          </div>
        </AccountsProvider>
      </SignedIn>
      <RedirectToSignIn />
    </>
  );
}
