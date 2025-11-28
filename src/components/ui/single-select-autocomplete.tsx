import React, { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Predefined exercise names list (108 options)
export const EXERCISE_NAMES = [
  // CHEST
  "Bench Press",
  "Incline Bench Press",
  "Decline Bench Press",
  "Push-Ups",
  "Chest Fly",
  "Cable Fly",
  "Pec Deck",
  "Dips",
  // TRICEPS
  "Tricep Pushdown",
  "Overhead Tricep Extension",
  "Skull Crushers",
  "Close-Grip Bench Press",
  "Tricep Kickbacks",
  // BICEPS
  "Bicep Curls",
  "Hammer Curls",
  "Preacher Curls",
  "Concentration Curls",
  "Cable Curls",
  "Barbell Curls",
  // BACK
  "Chin-Ups",
  "Pull-Ups",
  "Lat Pulldown",
  "Seated Row",
  "Bent-Over Row",
  "T-Bar Row",
  "Single-Arm Dumbbell Row",
  "Face Pulls",
  "Rear Delt Fly",
  "Shrugs",
  "Deadlift",
  "Romanian Deadlift",
  "Sumo Deadlift",
  "Good Mornings",
  "Back Extensions",
  // GLUTES & HIPS
  "Hip Thrusts",
  "Glute Bridge",
  "Hip Abduction",
  "Hip Adduction",
  "Hip Thrust Machine",
  "Cable Kickbacks",
  "Donkey Kicks",
  "Fire Hydrants",
  "Glute Kickback Machine",
  // LEGS
  "Squat",
  "Front Squat",
  "Goblet Squat",
  "Hack Squat",
  "Leg Press",
  "Lunges",
  "Walking Lunges",
  "Bulgarian Split Squat",
  "Step-Ups",
  "Leg Extension",
  "Leg Curl (Seated/Lying)",
  "Calf Raise",
  "Seated Calf Raise",
  "Sumo Squat",
  "Curtsy Lunge",
  // SHOULDERS
  "Shoulder Press",
  "Arnold Press",
  "Lateral Raise",
  "Front Raise",
  "Upright Row",
  "Military Press",
  "Cable Lateral Raise",
  "Reverse Pec Deck",
  // CORE/ABS
  "Plank",
  "Sit-Ups",
  "Crunches",
  "Bicycle Crunches",
  "Leg Raises",
  "Hanging Leg Raise",
  "Russian Twist",
  "Mountain Climbers",
  "Dead Bug",
  "Pallof Press",
  "Toe Touches",
  "V-Ups",
  "Side Plank",
  // FULL BODY/FUNCTIONAL
  "Burpees",
  "Kettlebell Swings",
  "Kettlebell Snatch",
  "Kettlebell Clean & Press",
  "Battle Ropes",
  "Sled Push",
  "Sled Pull",
  "Box Jump",
  "Jump Squats",
  "Farmer's Carry",
  "Turkish Get-Up",
  "Medicine Ball Slams",
  "Wall Ball Shots",
  "Cable Woodchopper",
  "Superman",
  // CARDIO
  "Rowing (Erg)",
  "Air Bike",
  "Treadmill Run",
  "Stair Climber",
  "SkiErg",
  // TRX/SUSPENSION
  "TRX Rows",
  "TRX Chest Press",
  "TRX Pike",
  // ASSISTED/MACHINE
  "Assisted Pull-Up",
  // LANDMINE
  "Landmine Press",
  "Landmine Row",
  "Landmine Squat",
  // OTHER
  "Inverted Row",
];

interface SingleSelectAutocompleteProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const SingleSelectAutocomplete: React.FC<SingleSelectAutocompleteProps> = ({
  options,
  value,
  onChange,
  placeholder = "Type to search...",
  className,
  disabled = false,
  required = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter options based on word-boundary matching
  const filteredOptions = useMemo(() => {
    if (!inputValue.trim()) return [];
    
    const searchTerm = inputValue.toLowerCase().trim();
    return options.filter((option) => {
      const words = option.toLowerCase().split(/[\s\-\/\(\)]+/);
      return words.some((word) => word.startsWith(searchTerm));
    });
  }, [inputValue, options]);

  // Get autocomplete suggestion (first match for inline gray text)
  const autocompleteSuggestion = useMemo(() => {
    if (!inputValue.trim() || filteredOptions.length === 0) return null;
    
    const searchTerm = inputValue.toLowerCase();
    // Find first option that starts with the input (case-insensitive)
    const match = filteredOptions.find((option) =>
      option.toLowerCase().startsWith(searchTerm)
    );
    
    if (match) {
      return match;
    }
    return null;
  }, [inputValue, filteredOptions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(newValue.trim().length > 0);
    setHighlightedIndex(-1);
  };

  // Handle option selection
  const handleSelectOption = (option: string) => {
    setInputValue(option);
    onChange(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" || e.key === "ArrowRight") {
      // Accept autocomplete suggestion
      if (autocompleteSuggestion && inputValue !== autocompleteSuggestion) {
        e.preventDefault();
        setInputValue(autocompleteSuggestion);
        onChange(autocompleteSuggestion);
        setIsOpen(false);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && inputValue.trim()) {
        setIsOpen(true);
      } else if (filteredOptions.length > 0) {
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        handleSelectOption(filteredOptions[highlightedIndex]);
      } else if (autocompleteSuggestion) {
        handleSelectOption(autocompleteSuggestion);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.trim() && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="bg-background/50 border-border/50 pr-8"
        />
        {/* Autocomplete suggestion overlay */}
        {autocompleteSuggestion && inputValue && autocompleteSuggestion.toLowerCase().startsWith(inputValue.toLowerCase()) && inputValue !== autocompleteSuggestion && (
          <div className="absolute inset-0 flex items-center pointer-events-none px-3">
            <span className="invisible">{inputValue}</span>
            <span className="text-muted-foreground/50">
              {autocompleteSuggestion.slice(inputValue.length)}
            </span>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md border border-border bg-popover shadow-lg">
          {filteredOptions.map((option, index) => (
            <div
              key={option}
              className={cn(
                "px-3 py-2 cursor-pointer text-sm transition-colors",
                highlightedIndex === index
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
              onClick={() => handleSelectOption(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
