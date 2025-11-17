import {
  Pagination,
  PaginationContent,
//   PaginationEllipsis,
  PaginationItem,
//   PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface PaginateProps {
  pages: number;    
    currentPage: number;
    path?: string; // Base path for pagination links
    param?: string; // Query parameter for page number
}

export function Paginate({ pages, currentPage, path }: PaginateProps) {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
         <PaginationPrevious
            href={currentPage > 1 ? path + '?page=' + (currentPage - 1) : '#'}
            isActive={currentPage > 1}
          /> 
          {/* <Button> Précédent </Button> */}
        </PaginationItem>
                <PaginationItem>
          {currentPage < pages ? (
            <PaginationNext href={path+'?page='+(currentPage+1)} isActive={true} />
          ) : (
            <PaginationNext href="#" isActive={false} />
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
