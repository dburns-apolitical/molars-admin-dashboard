import * as React from "react"
import { cn } from "@/lib/utils"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"

interface ComboboxInputProps {
  value: string
  onValueChange: (value: string) => void
  options: string[]
  placeholder?: string
  disabled?: boolean
  className?: string
  maxLength?: number
}

function ComboboxInput({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className,
  maxLength,
}: ComboboxInputProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)

  // Sync external value changes
  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  const filtered = options.filter((option) =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <Popover open={open && filtered.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            onValueChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay to allow click on popover items
            setTimeout(() => setOpen(false), 150)
          }}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={cn(className)}
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            <CommandEmpty>No suggestions found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(selected) => {
                    setInputValue(selected)
                    onValueChange(selected)
                    setOpen(false)
                  }}
                >
                  <span className="truncate">{option}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { ComboboxInput }
