import * as React from "react"
import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
  placeholder?: string
  className?: string
  disabled?: boolean
}

function TagInput({
  value,
  onChange,
  maxTags = 5,
  placeholder = "Add a tag...",
  className,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const validateTag = (tag: string): string | null => {
    if (!tag.trim()) return null
    
    const cleanTag = tag.trim().replace(/^#/, "")
    
    if (!/^[a-zA-Z0-9_]+$/.test(cleanTag)) {
      setError("Only letters, numbers, and underscores allowed")
      return null
    }
    
    if (value.includes(cleanTag)) {
      setError("Tag already added")
      return null
    }
    
    if (value.length >= maxTags) {
      setError(`Maximum ${maxTags} tags allowed`)
      return null
    }
    
    return cleanTag
  }

  const addTag = (tag: string) => {
    const validTag = validateTag(tag)
    if (validTag) {
      onChange([...value, validTag])
      setInputValue("")
      setError(null)
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue)
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex flex-wrap gap-2 min-h-[42px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-colors focus-within:ring-1 focus-within:ring-ring",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 pr-1"
          >
            #{tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(tag)
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="size-3" />
                <span className="sr-only">Remove {tag}</span>
              </button>
            )}
          </Badge>
        ))}
        {value.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={value.length === 0 ? placeholder : ""}
            disabled={disabled}
            className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground text-sm disabled:cursor-not-allowed"
          />
        )}
      </div>
      <div className="flex justify-between items-center text-xs">
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : (
          <span className="text-muted-foreground">
            Press Enter or comma to add
          </span>
        )}
        <span className="text-muted-foreground">
          {value.length}/{maxTags} tags
        </span>
      </div>
    </div>
  )
}

export { TagInput }
