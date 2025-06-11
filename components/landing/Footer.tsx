import { Heart } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function Footer() {
  return (
    <footer className="w-full border-t bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            <span className="font-semibold">健康AI助手</span>
            <span className="text-muted-foreground">- 您的智能健康伙伴</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <p>
              Powered by{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                className="font-bold hover:underline"
                rel="noreferrer"
              >
                Supabase
              </a>
            </p>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
} 