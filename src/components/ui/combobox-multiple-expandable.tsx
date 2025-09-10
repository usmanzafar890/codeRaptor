"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { BadgeButton } from "@/components/ui/badge-button"
import { X } from "lucide-react"

interface EmailMultiSelectProps {
  selectedEmails: string[];
  onEmailsChange: (emails: string[]) => void;
  placeholder?: string;
  className?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  onInputKeyDown?: (e: React.KeyboardEvent) => void;
  validateEmail?: (email: string) => boolean;
  onValidationError?: (error: string) => void;
}

export default function EmailMultiSelect({ 
  selectedEmails, 
  onEmailsChange, 
  placeholder = "Enter email addresses...", 
  className = "", 
  inputValue = "", 
  onInputChange, 
  onInputKeyDown,
  validateEmail,
  onValidationError
}: EmailMultiSelectProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [internalInputValue, setInternalInputValue] = React.useState("")
  
  // Use external input value if provided, otherwise use internal
  const currentInputValue = inputValue !== undefined ? inputValue : internalInputValue;
  const setCurrentInputValue = onInputChange || setInternalInputValue;

  // Function to add or remove an email from the selection
  const toggleSelection = React.useCallback((value: string) => {
    onEmailsChange(selectedEmails.includes(value) ? selectedEmails.filter((v) => v !== value) : [...selectedEmails, value])
  }, [selectedEmails, onEmailsChange])

  // Function to remove an email from the selection
  const removeSelection = React.useCallback((value: string) => {
    onEmailsChange(selectedEmails.filter((v) => v !== value))
  }, [selectedEmails, onEmailsChange])

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (onInputKeyDown) {
      onInputKeyDown(e);
      return;
    }
    
    if (e.key === 'Enter' && currentInputValue.trim()) {
      e.preventDefault()
      const email = currentInputValue.trim()
      
      // Validate email if validation function is provided
      if (validateEmail && !validateEmail(email)) {
        if (onValidationError) {
          onValidationError('Please enter a valid email address');
        }
        return;
      }
      
      if (!selectedEmails.includes(email)) {
        onEmailsChange([...selectedEmails, email])
        setCurrentInputValue("")
        // Clear any validation error when email is successfully added
        if (onValidationError) {
          onValidationError('');
        }
      }
    }
  }

  // Maximum number of badges to show before collapsing
  const maxShownItems = 2

  // Determine which items are visible based on the 'expanded' state
  const visibleItems = expanded ? selectedEmails : selectedEmails.slice(0, maxShownItems)

  // Calculate the number of hidden items
  const hiddenCount = selectedEmails.length - visibleItems.length

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-wrap items-center gap-1">
          {selectedEmails.length > 0 ? (
            <>
              {/* Render visible email badges */}
              {visibleItems.map((email) => (
                <Badge key={email} variant="outline">
                  {email}
                  <BadgeButton
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSelection(email)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </BadgeButton>
                </Badge>
              ))}

              {/* Show "+X more" badge if there are hidden items and not expanded */}
              {hiddenCount > 0 && !expanded && (
                <Badge
                  className="cursor-pointer px-1.5 text-muted-foreground hover:bg-accent"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpanded(true)
                  }}
                >
                  {`+${hiddenCount} more`}
                </Badge>
              )}

              {/* Show "Show Less" badge if expanded and there were hidden items initially */}
              {expanded && selectedEmails.length > maxShownItems && (
                <Badge
                  className="cursor-pointer px-1.5 text-muted-foreground hover:bg-accent"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpanded(false)
                  }}
                >
                  {"Show Less"}
                </Badge>
              )}
            </>
          ) : null}
          
                     {/* Input field */}
           <input
             type="email"
             value={currentInputValue}
             onChange={(e) => setCurrentInputValue(e.target.value)}
             onKeyDown={handleInputKeyDown}
             className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 min-w-[200px]"
             placeholder={selectedEmails.length === 0 ? placeholder : "Add another email..."}
           />
        </div>
    </div>
  )
}
