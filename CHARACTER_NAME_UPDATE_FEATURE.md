# Character Name Update Feature

## Overview
This feature automatically updates the story outline and generated story content whenever the user changes the character name in the form fields.

## How It Works

### 1. Real-time Detection
- The system monitors changes to the `characterName` field in the form data
- Uses React's `useEffect` hook to detect when the character name changes
- Maintains a `previousCharacterName` state to track the last known character name

### 2. Smart Text Replacement
When a character name change is detected, the system performs intelligent text replacement:

- **Basic Name Occurrences**: Replaces all instances of the old name with the new name
- **Possessive Forms**: Handles possessive forms (e.g., "John's" → "Mary's")
- **Title Patterns**: Updates story titles (e.g., "**John's Adventure**" → "**Mary's Adventure**")
- **Multiple Title Formats**: Handles various title patterns in markdown format

### 3. Comprehensive Updates
The feature updates both:
- **Generated Outline**: The story outline shown in the outline editor
- **Generated Story**: The full story content if it has already been generated

### 4. User Feedback
- Provides console logging for debugging
- Shows a success toast notification when the update is complete
- Updates happen instantly without requiring regeneration

## Implementation Details

### Key Components
- **Location**: `src/pages/Index.tsx`
- **Hook Used**: `useStoryWorkflow` (modified to expose setters)
- **State Management**: Uses existing form data and workflow state

### Code Structure
```typescript
// Effect to update story outline when character name changes
useEffect(() => {
  if (formData.characterName && previousCharacterName && 
      formData.characterName !== previousCharacterName && 
      generatedOutline && 
      !isGeneratingOutline) {
    
    // Helper function with smart replacement logic
    const replaceCharacterName = (text: string, oldName: string, newName: string): string => {
      // Multiple replacement patterns for comprehensive coverage
    };
    
    // Update both outline and story
    setGeneratedOutline(updatedOutline);
    setGeneratedStory(updatedStory);
  }
}, [formData.characterName, generatedOutline, generatedStory, previousCharacterName, isGeneratingOutline]);
```

### Safety Measures
- Only updates when outline/story already exists
- Prevents updates during active generation
- Maintains previous character name to avoid infinite loops
- Handles edge cases with regex patterns

## User Experience
1. User generates a story with character name "John"
2. User decides to change the character name to "Mary"
3. System automatically updates all references in the story outline and content
4. User sees immediate feedback with success notification
5. No need to regenerate the entire story

## Benefits
- **Instant Updates**: No need to regenerate the entire story
- **Preserves Work**: Maintains all other story elements while updating character references
- **User Friendly**: Seamless experience with clear feedback
- **Comprehensive**: Handles various text patterns and edge cases
- **Efficient**: Only updates existing content, doesn't trigger new API calls 