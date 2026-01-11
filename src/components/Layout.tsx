import { Outlet } from "react-router-dom";
import { Github } from "lucide-react";

export function Layout() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col min-h-screen">
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
    </div>
  );
}
