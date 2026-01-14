"use client";

import Image from "next/image";
import { useTheme } from "@/app/context/ThemeContext";

export const Logo = () => {
  const { theme } = useTheme();

  const logoSrc = theme === "dark" ? "/images/logo-black.webp" : "/images/logo-black.webp";

  return <Image src={logoSrc} alt="Logo" width={350} height={200} />;
};
