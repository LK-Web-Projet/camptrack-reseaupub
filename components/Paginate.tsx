"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

interface PaginateProps {
  pages: number;
  currentPage: number;
  path?: string; // Opt - kept for backward compatibility but unused
}

export function Paginate({ pages, currentPage }: PaginateProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const paginationRange = useMemo(() => {
    const totalPageCount = pages;
    const siblingCount = 1; // Number of pages to show around current page

    // Pages count is determined as siblingCount + firstPage + lastPage + currentPage + 2*Dots
    const totalPageNumbers = siblingCount + 5;

    /*
      Case 1: If the number of pages is less than the page numbers we want to show in our
      paginationComponent, we return the range [1..totalPageCount]
    */
    if (totalPageCount <= totalPageNumbers) {
      return  Array.from({ length: totalPageCount }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPageCount);

    /*
      We do not show dots just when there is just one page number to be inserted between the extremes of sibling and the page limits i.e 1 and totalPageCount. Hence we are using leftSiblingIndex > 2 and rightSiblingIndex < totalPageCount - 2
    */
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPageCount;

    /*
      Case 2: No left dots to show, but rights dots to be shown
    */
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange =  Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "DOTS", totalPageCount];
    }

    /*
      Case 3: No right dots to show, but left dots to be shown
    */
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPageCount - rightItemCount + i + 1);
      return [firstPageIndex, "DOTS", ...rightRange];
    }

    /*
      Case 4: Both left and right dots to be shown
    */
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
      return [firstPageIndex, "DOTS", ...middleRange, "DOTS", lastPageIndex];
    }
    
    return [];

  }, [pages, currentPage]);

  if (pages <= 1) return null;

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          {currentPage <= 1 ? (
             <PaginationPrevious href="#" onClick={(e) => e.preventDefault()} className="opacity-50 cursor-not-allowed" />
          ) : (
            <PaginationPrevious href={createPageURL(currentPage - 1)} />
          )}
        </PaginationItem>

        {paginationRange.map((pageNumber, index) => {
          if (pageNumber === "DOTS") {
            return (
              <PaginationItem key={`dots-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          
          const pNum = Number(pageNumber);

          return (
            <PaginationItem key={pNum}>
              <PaginationLink
                href={createPageURL(pNum)}
                isActive={currentPage === pNum}
              >
                {pNum}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          {currentPage >= pages ? (
             <PaginationNext href="#" onClick={(e) => e.preventDefault()} className="opacity-50 cursor-not-allowed" />
          ) : (
            <PaginationNext href={createPageURL(currentPage + 1)} />
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
