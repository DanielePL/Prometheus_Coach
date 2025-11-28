import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const MUSCLE_GROUPS = [
  "Chest (Pectorals)",
  "Back (Lats & Upper Back)",
  "Shoulders (Deltoids)",
  "Traps (Trapezius)",
  "Biceps",
  "Triceps",
  "Forearms",
  "Abdominals (Upper, Lower, Obliques)",
  "Lower Back (Erector Spinae)",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Hip Flexors",
] as const;

export const EQUIPMENT_OPTIONS = [
  "Barbell",
  "Dumbbell",
  "Kettlebell",
  "Resistance Bands",
  "Cable Machine",
  "Smith Machine",
  "Bodyweight",
  "Medicine Ball",
  "TRX/Suspension",
  "Bench",
  "Pull-up Bar",
  "Squat Rack",
  "EZ Bar",
  "Leg Press Machine",
  "Lat Pulldown Machine",
  "Rowing Machine",
] as const;

interface MultiSelectAutocompleteProps {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelectAutocomplete({
  options,
  value,
  onChange,
  placeholder = "Type to search...",
  emptyMessage = "No matches found.",
  className,
  disabled = false,
}: MultiSelectAutocompleteProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Parse comma-separated string to array
  const selectedValues = React.useMemo(() => {
    if (!value || value.trim() === "") return [];
    return value.split(",").map((v) => v.trim()).filter(Boolean);
  }, [value]);

  // Filter options based on input - only show when typing
  const filteredOptions = React.useMemo(() => {
    if (!inputValue.trim()) return [];
    const search = inputValue.toLowerCase().trim();
    return options.filter(
      (option) =>
        option.toLowerCase().includes(search) &&
        !selectedValues.includes(option)
    );
  }, [options, inputValue, selectedValues]);

  // Show dropdown only when there's input and matches
  const showDropdown = isOpen && inputValue.trim().length > 0;

  const handleSelect = (option: string) => {
    const newValues = [...selectedValues, option];
    onChange(newValues.join(", "));
    setInputValue("");
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  const handleRemove = (option: string) => {
    const newValues = selectedValues.filter((v) => v !== option);
    onChange(newValues.join(", "));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && inputValue === "" && selectedValues.length > 0) {
      // Remove last item on backspace if input is empty
      const newValues = selectedValues.slice(0, -1);
      onChange(newValues.join(", "));
      return;
    }

    if (!showDropdown || filteredOptions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setInputValue("");
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Input container with chips */}
      <div
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected chips */}
        {selectedValues.map((item) => (
          <Badge
            key={item}
            variant="secondary"
            className="bg-primary/20 text-primary hover:bg-primary/30 gap-1 pr-1 shrink-0"
          >
            {item}
            <button
              type="button"
              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-primary/20"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(item);
              }}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {item}</span>
            </button>
          </Badge>
        ))}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedValues.length === 0 ? placeholder : ""}
          disabled={disabled}
          className={cn(
            "flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground",
            disabled && "cursor-not-allowed"
          )}
        />
      </div>

      {/* Dropdown - only shows when typing and has matches or no matches message */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
          {filteredOptions.length > 0 ? (
            <ul className="max-h-60 overflow-auto py-1">
              {filteredOptions.map((option, index) => (
                <li
                  key={option}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm",
                    index === highlightedIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
                >
                  {option}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
