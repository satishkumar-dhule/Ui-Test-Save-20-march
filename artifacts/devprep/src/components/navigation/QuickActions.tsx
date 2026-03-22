import { Plus, FileText, BookOpen, Code, Mic, PenTool, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu'

interface QuickActionsProps {
  onCreateNew?: () => void
}

export function QuickActions({ onCreateNew }: QuickActionsProps) {
  const actions = [
    {
      label: 'Question',
      icon: FileText,
      shortcut: '⌘Q',
      action: () => console.log('Create new question'),
    },
    {
      label: 'Flashcard',
      icon: BookOpen,
      shortcut: '⌘F',
      action: () => console.log('Create new flashcard'),
    },
    {
      label: 'Code Challenge',
      icon: Code,
      shortcut: '⌘C',
      action: () => console.log('Create new code challenge'),
    },
    {
      label: 'Exam',
      icon: GraduationCap,
      shortcut: '⌘E',
      action: () => console.log('Create new exam'),
    },
    {
      label: 'Voice Note',
      icon: Mic,
      shortcut: '⌘V',
      action: () => console.log('Create new voice note'),
    },
    {
      label: 'Writing Exercise',
      icon: PenTool,
      shortcut: '⌘W',
      action: () => console.log('Create new writing exercise'),
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hidden sm:flex">
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Create New Content</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {actions.map((item) => (
            <DropdownMenuItem
              key={item.label}
              onClick={item.action}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
              <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}