"use client"

import { Button } from "@/components/ui/button"
import type { Category } from "@/types"

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
}

export function CategoryFilter({ categories = [], selectedCategory, onCategoryChange }: CategoryFilterProps) {
  // Verificação de segurança
  if (!Array.isArray(categories)) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        variant={selectedCategory === "all" ? "default" : "outline"}
        onClick={() => onCategoryChange("all")}
        size="sm"
      >
        Todos
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          onClick={() => onCategoryChange(category.id)}
          size="sm"
        >
          {category.name}
        </Button>
      ))}
    </div>
  )
}
