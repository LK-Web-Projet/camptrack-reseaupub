"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function GlobalLinkLoader() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const loadingLinkRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        // Reset loading state when the URL changes (navigation complete)
        if (loadingLinkRef.current) {
            loadingLinkRef.current.removeAttribute("data-loading");
            loadingLinkRef.current = null;
        }
    }, [pathname, searchParams]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest("a");
            // Only proceed if it's an anchor tag with an href
            if (!target || !target.href) return;

            // Ignore new tab links, download links, or mailto/tel
            if (
                target.target === "_blank" ||
                target.hasAttribute("download") ||
                target.href.startsWith("mailto:") ||
                target.href.startsWith("tel:")
            ) {
                return;
            }

            // Check if it's an internal link
            const url = new URL(target.href);
            if (url.origin !== window.location.origin) return;

            // Ignore if clicking the same link
            if (url.pathname === window.location.pathname && url.search === window.location.search) return;

            // Set loading state
            target.setAttribute("data-loading", "true");
            loadingLinkRef.current = target;
        };

        document.addEventListener("click", handleClick);
        return () => {
            document.removeEventListener("click", handleClick);
        };
    }, []);

    return null;
}
