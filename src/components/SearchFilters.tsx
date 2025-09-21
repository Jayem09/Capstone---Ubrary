import { Search, Filter, Grid, List, SortAsc } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

export function SearchFilters({ 
  searchQuery, 
  onSearchChange, 
  viewMode, 
  onViewModeChange 
}: SearchFiltersProps) {
  const handleFilterClick = () => {
    toast.info("Advanced filters", {
      description: "Additional filter options will be available soon"
    });
  };

  const handleYearChange = (year: string) => {
    toast.success(`Filter applied: ${year === "all" ? "All years" : year}`, {
      description: "Documents filtered by year"
    });
  };

  const handleProgramChange = (program: string) => {
    toast.success("Program filter applied", {
      description: `Showing documents from ${program === "all" ? "all programs" : program}`
    });
  };

  const handleSortChange = (sortBy: string) => {
    toast.success(`Sorted by ${sortBy}`, {
      description: "Document list has been reordered"
    });
  };

  return (
    <div className="mb-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search theses, authors, keywords..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 sm:h-12 border-gray-300 focus:border-[#8B0000] focus:ring-[#8B0000]"
          />
        </div>
        <Button variant="outline" className="h-10 sm:h-12 border-gray-300 w-full sm:w-auto">
          <Filter className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>

      {/* Filters and View Options */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          {/* Year Filter */}
          <Select defaultValue="all" onChange={handleYearChange}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
            </SelectContent>
          </Select>

          {/* Program Filter */}
          <Select defaultValue="all" onChange={handleProgramChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              <SelectItem value="bsit">BS Information Technology</SelectItem>
              <SelectItem value="bscs">BS Computer Science</SelectItem>
              <SelectItem value="bsee">BS Electrical Engineering</SelectItem>
              <SelectItem value="bsba">BS Business Administration</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <SortAsc className="w-4 h-4 mr-2" />
                Sort by
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSortChange("Date Added")}>Date Added</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("Title")}>Title</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("Author")}>Author</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("Downloads")}>Downloads</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center border border-gray-300 rounded-lg w-fit mx-auto lg:mx-0">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className={viewMode === "grid" ? "bg-[#8B0000] hover:bg-red-800" : ""}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("list")}
            className={viewMode === "list" ? "bg-[#8B0000] hover:bg-red-800" : ""}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}