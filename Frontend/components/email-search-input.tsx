"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Loader2, Search, User, Check } from "lucide-react"
import { searchUsers } from "@/services/api"

interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
}

interface EmailSearchInputProps {
  value: string
  onChange: (value: string) => void
  onUserSelect?: (user: User) => void
  placeholder?: string
  className?: string
}

export function EmailSearchInput({ 
  value, 
  onChange, 
  onUserSelect, 
  placeholder = "Enter email address",
  className = ""
}: EmailSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (value.length >= 2 && !selectedUser) {
        try {
          setIsLoading(true)
          const results = await searchUsers(value)
          setSearchResults(results || [])
          setIsOpen(results?.length > 0)
        } catch (error) {
          console.error("Error searching users:", error)
          setSearchResults([])
        } finally {
          setIsLoading(false)
        }
      } else {
        setSearchResults([])
        setIsOpen(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [value, selectedUser])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Clear selected user if value changes
    if (selectedUser && newValue !== selectedUser.email) {
      setSelectedUser(null)
    }
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    onChange(user.email)
    setIsOpen(false)
    onUserSelect?.(user)
  }

  const handleClearSelection = () => {
    setSelectedUser(null)
    onChange("")
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="email"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          className={`${className} ${selectedUser ? "pr-20" : ""}`}
          onFocus={() => {
            if (searchResults.length > 0) {
              setIsOpen(true)
            }
          }}
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {selectedUser && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <Check className="h-4 w-4 text-green-500" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleClearSelection}
            >
              ×
            </Button>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={selectedUser.avatar || ""} />
              <AvatarFallback className="text-xs">
                {selectedUser.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{selectedUser.name}</span>
            <Badge variant="default" className="text-xs">Raqam User</Badge>
          </div>
        </div>
      )}

      {isOpen && searchResults.length > 0 && (
        <Card 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto border shadow-lg"
        >
          <div className="p-2">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Search className="h-3 w-3" />
              Suggested Raqam users
            </div>
            {searchResults.map((user) => (
              <button
                key={user.id}
                type="button"
                className="w-full p-2 text-left hover:bg-muted rounded-lg flex items-center gap-2 transition-colors"
                onClick={() => handleUserSelect(user)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar || ""} />
                  <AvatarFallback className="text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{user.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
                <Badge variant="outline" className="text-xs">Registered</Badge>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}