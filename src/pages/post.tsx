import {
  RedirectToSignIn,
  SignedIn,
} from '@neondatabase/neon-js/auth/react/ui';

export function Post() {
  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold tracking-tight">Post</h1>
            <p className="text-muted-foreground mt-2">This page is under construction.</p>
          </div>
        </div>
      </SignedIn>
      <RedirectToSignIn />
    </>
  );
}
