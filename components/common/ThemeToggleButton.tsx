"use client";

import { Button } from "@/components/ui/button"; 
import { useTheme } from "@/app/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
     <Button
      onClick={toggleTheme}
      className="flex items-center justify-center w-10 h-10 rounded-full cursor-pointer p-0"
      variant="outline"
    >
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  );
}
