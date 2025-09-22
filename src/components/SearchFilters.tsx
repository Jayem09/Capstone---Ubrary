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
  onYearFilter?: (year: string) => void;
  onProgramFilter?: (program: string) => void;
  onSortChange?: (sortBy: string) => void;
  selectedYear?: string;
  selectedProgram?: string;
  selectedSort?: string;
}

export function SearchFilters({ 
  searchQuery, 
  onSearchChange, 
  viewMode, 
  onViewModeChange,
  onYearFilter,
  onProgramFilter,
  onSortChange,
  selectedYear = "all",
  selectedProgram = "all",
  selectedSort = "date"
}: SearchFiltersProps) {
  // Removed unused handleFilterClick function

  const handleYearChange = (year: string) => {
    if (onYearFilter) {
      onYearFilter(year);
    }
    toast.success(`Filter applied: ${year === "all" ? "All years" : year}`, {
      description: "Documents filtered by year"
    });
  };

  const handleProgramChange = (program: string) => {
    if (onProgramFilter) {
      onProgramFilter(program);
    }
    toast.success("Program filter applied", {
      description: `Showing documents from ${program === "all" ? "all programs" : program}`
    });
  };

  const handleSortChange = (sortBy: string) => {
    if (onSortChange) {
      onSortChange(sortBy);
    }
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
          <Select value={selectedYear} onValueChange={handleYearChange}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
              <SelectItem value="2020">2020</SelectItem>
            </SelectContent>
          </Select>

          {/* Program Filter */}
          <Select value={selectedProgram} onValueChange={handleProgramChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              <SelectItem value="BS Information Technology">BS Information Technology</SelectItem>
              <SelectItem value="BS Computer Science">BS Computer Science</SelectItem>
              <SelectItem value="BS Electrical Engineering">BS Electrical Engineering</SelectItem>
              <SelectItem value="BS Business Administration">BS Business Administration</SelectItem>
              <SelectItem value="Bachelor of Secondary Education">Bachelor of Secondary Education</SelectItem>
              <SelectItem value="BS Nursing">BS Nursing</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <SortAsc className="w-4 h-4 mr-2" />
                Sort by: {selectedSort === "date" ? "Date Added" : 
                         selectedSort === "title" ? "Title" :
                         selectedSort === "author" ? "Author" :
                         selectedSort === "downloads" ? "Downloads" : "Date Added"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSortChange("date")}>Date Added</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("title")}>Title</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("author")}>Author</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("downloads")}>Downloads</DropdownMenuItem>
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