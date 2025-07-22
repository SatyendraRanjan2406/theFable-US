# Database Schema for Story Management System

## Overview
This document outlines the required database schema to support saving story panels and their corresponding image URLs when the "Add Illustrations" button is clicked.

## API Endpoint
**POST** `/api/stories/save-panels/`

## Tables

### 1. stories
Main table to store story metadata.

```sql
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    character_name VARCHAR(255) NOT NULL,
    character_age VARCHAR(50),
    character_gender VARCHAR(50),
    genre VARCHAR(100) NOT NULL,
    story_text TEXT NOT NULL,
    character_photo_url TEXT,
    total_panels INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_stories_genre ON stories(genre);
```

### 2. story_panels
Table to store individual story panels and their image URLs.

```sql
CREATE TABLE story_panels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    panel_index INTEGER NOT NULL,
    panel_text TEXT NOT NULL,
    image_url TEXT,
    prompt_used TEXT,
    image_generation_status VARCHAR(20) DEFAULT 'pending', -- pending, generating, completed, failed
    generation_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique panel index per story
    UNIQUE(story_id, panel_index)
);

-- Indexes
CREATE INDEX idx_story_panels_story_id ON story_panels(story_id);
CREATE INDEX idx_story_panels_panel_index ON story_panels(story_id, panel_index);
CREATE INDEX idx_story_panels_status ON story_panels(image_generation_status);
```

### 3. character_images (existing)
Table to store character reference images.

```sql
-- This table likely already exists based on the migration files
CREATE TABLE character_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    processed_url TEXT,
    character_name VARCHAR(255),
    processing_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Request/Response Formats

### Request Body
```typescript
interface SaveStoryRequest {
  story_id?: string; // Optional for updates, auto-generated for new stories
  character_name: string;
  character_age: string;
  character_gender: string;
  genre: string;
  story_text: string;
  character_photo_url?: string;
  panels: Array<{
    panel_index: number;
    panel_text: string;
    image_url: string | null; // null if generation failed or not yet generated
    prompt_used?: string;
  }>;
}
```

### Response Body
```typescript
interface SaveStoryResponse {
  success: boolean;
  story_id: string;
  message: string;
  panels_saved: number;
  panels_with_images: number;
  panels_without_images: number;
}
```

## Backend Logic Flow

1. **Receive Request**: Extract story data and panels from request body
2. **Authentication**: Verify user is authenticated via Bearer token
3. **Story Creation/Update**:
   - If `story_id` provided: Update existing story
   - If no `story_id`: Create new story record
4. **Panel Processing**:
   - Delete existing panels for the story (if updating)
   - Insert new panel records with image URLs (or null)
   - Set appropriate status for each panel based on image_url presence
5. **Response**: Return success with story_id and statistics

## Implementation Example (Node.js/Express)

```javascript
app.post('/api/stories/save-panels/', authenticateUser, async (req, res) => {
  const {
    story_id,
    character_name,
    character_age,
    character_gender,
    genre,
    story_text,
    character_photo_url,
    panels
  } = req.body;

  const user_id = req.user.id;

  try {
    let storyId = story_id;
    
    // Create or update story
    if (storyId) {
      await db.query(`
        UPDATE stories 
        SET character_name = $1, character_age = $2, character_gender = $3,
            genre = $4, story_text = $5, character_photo_url = $6,
            total_panels = $7, updated_at = NOW()
        WHERE id = $8 AND user_id = $9
      `, [character_name, character_age, character_gender, genre, story_text, 
          character_photo_url, panels.length, storyId, user_id]);
    } else {
      const result = await db.query(`
        INSERT INTO stories (user_id, character_name, character_age, character_gender,
                           genre, story_text, character_photo_url, total_panels)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [user_id, character_name, character_age, character_gender, genre, 
          story_text, character_photo_url, panels.length]);
      storyId = result.rows[0].id;
    }

    // Delete existing panels (for updates)
    await db.query('DELETE FROM story_panels WHERE story_id = $1', [storyId]);

    // Insert new panels
    for (const panel of panels) {
      const status = panel.image_url ? 'completed' : 'pending';
      await db.query(`
        INSERT INTO story_panels (story_id, panel_index, panel_text, image_url, 
                                prompt_used, image_generation_status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [storyId, panel.panel_index, panel.panel_text, panel.image_url, 
          panel.prompt_used, status]);
    }

    const panelsWithImages = panels.filter(p => p.image_url).length;
    const panelsWithoutImages = panels.length - panelsWithImages;

    res.json({
      success: true,
      story_id: storyId,
      message: 'Story and panels saved successfully',
      panels_saved: panels.length,
      panels_with_images: panelsWithImages,
      panels_without_images: panelsWithoutImages
    });

  } catch (error) {
    console.error('Error saving story panels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save story panels',
      error: error.message
    });
  }
});
```

## Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_panels ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Users can view their own stories" 
  ON stories FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own stories" 
  ON stories FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own stories" 
  ON stories FOR UPDATE 
  USING (user_id = auth.uid());

-- Story panels policies
CREATE POLICY "Users can view panels for their own stories" 
  ON story_panels FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM stories 
    WHERE stories.id = story_panels.story_id 
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can create panels for their own stories" 
  ON story_panels FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM stories 
    WHERE stories.id = story_panels.story_id 
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can update panels for their own stories" 
  ON story_panels FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM stories 
    WHERE stories.id = story_panels.story_id 
    AND stories.user_id = auth.uid()
  ));
```

## Migration Script

```sql
-- Add this to your migration file
BEGIN;

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    character_name VARCHAR(255) NOT NULL,
    character_age VARCHAR(50),
    character_gender VARCHAR(50),
    genre VARCHAR(100) NOT NULL,
    story_text TEXT NOT NULL,
    character_photo_url TEXT,
    total_panels INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create story_panels table
CREATE TABLE IF NOT EXISTS story_panels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    panel_index INTEGER NOT NULL,
    panel_text TEXT NOT NULL,
    image_url TEXT,
    prompt_used TEXT,
    image_generation_status VARCHAR(20) DEFAULT 'pending',
    generation_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, panel_index)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_genre ON stories(genre);
CREATE INDEX IF NOT EXISTS idx_story_panels_story_id ON story_panels(story_id);
CREATE INDEX IF NOT EXISTS idx_story_panels_panel_index ON story_panels(story_id, panel_index);
CREATE INDEX IF NOT EXISTS idx_story_panels_status ON story_panels(image_generation_status);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_panels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (as shown above)

COMMIT;
```

## Additional Features to Consider

1. **Story Templates**: Save story outlines as reusable templates
2. **Version History**: Keep track of story edits and revisions
3. **Sharing**: Allow users to share stories with others
4. **Analytics**: Track story generation metrics and usage patterns
5. **Batch Operations**: Bulk update panel statuses for efficient image generation tracking 