import * as React from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  placeholder = "Select options...",
  emptyMessage = "No options found.",
  className,
  disabled = false,
}: MultiSelectAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  // Parse comma-separated string to array
  const selectedValues = React.useMemo(() => {
    if (!value || value.trim() === "") return [];
    return value.split(",").map((v) => v.trim()).filter(Boolean);
  }, [value]);

  // Filter options based on input
  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options;
    const search = inputValue.toLowerCase();
    return options.filter((option) =>
      option.toLowerCase().includes(search)
    );
  }, [options, inputValue]);

  const handleSelect = (option: string) => {
    if (selectedValues.includes(option)) {
      // Remove if already selected
      const newValues = selectedValues.filter((v) => v !== option);
      onChange(newValues.join(", "));
    } else {
      // Add to selection
      const newValues = [...selectedValues, option];
      onChange(newValues.join(", "));
    }
    setInputValue("");
  };

  const handleRemove = (option: string) => {
    const newValues = selectedValues.filter((v) => v !== option);
    onChange(newValues.join(", "));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && inputValue === "" && selectedValues.length > 0) {
      // Remove last item on backspace if input is empty
      const newValues = selectedValues.slice(0, -1);
      onChange(newValues.join(", "));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          onClick={() => !disabled && setOpen(true)}
        >
          {selectedValues.length > 0 ? (
            <>
              {selectedValues.map((item) => (
                <Badge
                  key={item}
                  variant="secondary"
                  className="bg-primary/20 text-primary hover:bg-primary/30 gap-1 pr-1"
                >
                  {item}
                  <button
                    type="button"
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search..."
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option);
                return (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => handleSelect(option)}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span>{option}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
