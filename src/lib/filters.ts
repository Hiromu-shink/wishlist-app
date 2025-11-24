import type { WishlistItem } from "@/types/wishlist";
import type { DeadlineFilter, PriceRangeFilter, PriorityFilter } from "@/components/FilterMenu";

export function filterItems(
  items: WishlistItem[],
  filters: {
    deadline?: DeadlineFilter;
    priceRange?: PriceRangeFilter;
    priority?: PriorityFilter;
  }
): WishlistItem[] {
  let filtered = [...items];

  // 期限フィルター
  if (filters.deadline && filters.deadline !== "all") {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    filtered = filtered.filter((item) => {
      if (!item.deadline || item.is_someday) {
        return false; // 期限がないものや未定は除外
      }
      
      const deadline = new Date(item.deadline);
      const deadlineYear = deadline.getFullYear();
      const deadlineMonth = deadline.getMonth();
      
      switch (filters.deadline) {
        case "this-month":
          return deadlineYear === currentYear && deadlineMonth === currentMonth;
        case "next-month": {
          const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
          const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
          return deadlineYear === nextYear && deadlineMonth === nextMonth;
        }
        case "within-3months": {
          const threeMonthsLater = new Date(currentYear, currentMonth + 3, 0);
          return deadline <= threeMonthsLater;
        }
        default:
          return true;
      }
    });
  }

  // 価格帯フィルター
  if (filters.priceRange && filters.priceRange !== "all") {
    filtered = filtered.filter((item) => {
      if (item.price === null || item.price === undefined) {
        return false; // 価格がないものは除外
      }
      
      switch (filters.priceRange) {
        case "under-10k":
          return item.price < 10000;
        case "10k-50k":
          return item.price >= 10000 && item.price < 50000;
        case "50k-100k":
          return item.price >= 50000 && item.price < 100000;
        case "over-100k":
          return item.price >= 100000;
        default:
          return true;
      }
    });
  }

  // 優先度フィルター
  if (filters.priority && filters.priority !== "all") {
    filtered = filtered.filter((item) => {
      switch (filters.priority) {
        case "5":
          return item.priority === 5;
        case "4+":
          return item.priority >= 4;
        case "3+":
          return item.priority >= 3;
        default:
          return true;
      }
    });
  }

  return filtered;
}

export function sortItems(
  items: WishlistItem[],
  sort: "created-desc" | "price-desc" | "price-asc" | "priority-desc" | "deadline-asc"
): WishlistItem[] {
  const sorted = [...items];
  
  switch (sort) {
    case "created-desc":
      return sorted.sort((a, b) => {
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        return bTime - aTime;
      });
    
    case "price-desc":
      return sorted.sort((a, b) => {
        const aPrice = a.price ?? 0;
        const bPrice = b.price ?? 0;
        return bPrice - aPrice;
      });
    
    case "price-asc":
      return sorted.sort((a, b) => {
        const aPrice = a.price ?? Infinity;
        const bPrice = b.price ?? Infinity;
        return aPrice - bPrice;
      });
    
    case "priority-desc":
      return sorted.sort((a, b) => b.priority - a.priority);
    
    case "deadline-asc":
      return sorted.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    
    default:
      return sorted;
  }
}

