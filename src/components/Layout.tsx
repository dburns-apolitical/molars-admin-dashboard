import {
  RedirectToSignIn,
  SignedIn,
  UserButton,
} from '@neondatabase/neon-js/auth/react/ui';
import { MenuIcon, HomeIcon, PenSquareIcon, ListIcon } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

function MobileNav() {
  const location = useLocation();
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

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
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 py-6">
          <SheetClose asChild>
            <Link
              to="/"
              className={`flex items-center gap-4 rounded-xl px-4 py-5 text-base font-medium transition-colors ${isActive('/')
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50'
                }`}
            >
              <HomeIcon className="size-5" />
              Dashboard
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/post"
              className={`flex items-center gap-4 rounded-xl px-4 py-5 text-base font-medium transition-colors ${isActive('/post')
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50'
                }`}
            >
              <PenSquareIcon className="size-5" />
              Post
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/content"
              className={`flex items-center gap-4 rounded-xl px-4 py-5 text-base font-medium transition-colors ${isActive('/content')
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50'
                }`}
            >
              <ListIcon className="size-5" />
              Content
            </Link>
          </SheetClose>
        </nav>
        <div className="mt-auto border-t py-6 flex justify-center user-button-dark">
          <UserButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function Layout() {
  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <h1 className="text-xl font-bold tracking-tight">Molars Dashboard</h1>
              <MobileNav />
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            <Outlet />
          </main>
        </div>
      </SignedIn>
      <RedirectToSignIn />
    </>
  );
}
