import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Github, Home } from "lucide-react";
import { AccountSwitcher } from "@/components/auth/AccountSwitcher";
import LoginDialog from "@/components/auth/LoginDialog";
import SignupDialog from "@/components/auth/SignupDialog";
import { useLoggedInAccounts } from "@/hooks/useLoggedInAccounts";
import { Button } from "@/components/ui/button";

export function Layout() {
  const currentYear = new Date().getFullYear();
  const { currentUser } = useLoggedInAccounts();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [signupDialogOpen, setSignupDialogOpen] = useState(false);

  const handleLogin = () => {
    setLoginDialogOpen(false);
    setSignupDialogOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <span className="hidden sm:inline-block">Stock Yo Space</span>
          </Link>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <AccountSwitcher onAddAccountClick={() => setLoginDialogOpen(true)} />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLoginDialogOpen(true)}
                className="text-sm font-medium"
              >
                Log in
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-muted/50 py-6 mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Stock Yo Space</span>
            <span>&copy; {currentYear}</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://www.murdawkmedia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              Created by Murdawk Media
            </a>

            <a
              href="https://github.com/murdawkmedia/inventory-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              Source Code
            </a>
          </div>
        </div>
      </footer>

      {/* Global Dialogs */}
      <LoginDialog
        isOpen={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onLogin={handleLogin}
        onSignup={() => setSignupDialogOpen(true)}
      />

      <SignupDialog
        isOpen={signupDialogOpen}
        onClose={() => setSignupDialogOpen(false)}
      />
    </div>
  );
}
