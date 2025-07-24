/**
 * Parse raw story text into an array of panel texts
 * @param storyText - The raw story text with panel markers
 * @returns Array of panel texts
 */
export const parseStoryToPanels = (storyText: string): string[] => {
  const allPanels: string[] = [];
  
  // Check if story has page separators (---)
  if (storyText.includes('---')) {
    // Format 1: Pages separated by --- with **Panel X:** markers
    const pages = storyText.split('---').map(page => page.trim()).filter(page => page.length > 0);
    
    pages.forEach((page) => {
      const lines = page.split('\n').filter(line => line.trim());
      let currentPanel = '';
      let inPanel = false;
      
      for (const line of lines) {
        if (line.includes('**Panel') && line.includes(':**')) {
          if (currentPanel.trim()) {
            allPanels.push(currentPanel.trim());
          }
          currentPanel = line.replace(/\*\*Panel \d+:\*\*/, '').trim();
          inPanel = true;
        } else if (inPanel && !line.includes('**Page') && !line.includes('**Panel')) {
          currentPanel += ' ' + line.trim();
        }
      }
      
      if (currentPanel.trim()) {
        allPanels.push(currentPanel.trim());
      }
    });
  } else {
    // Format 2: Simple Panel X: format without page separators
    const lines = storyText.split('\n').filter(line => line.trim());
    let currentPanel = '';
    let inPanel = false;
    
    for (const line of lines) {
      // Check for both formats: "Panel X:" and "**Panel X:**"
      if ((line.match(/^Panel \d+:/) || line.includes('**Panel') && line.includes(':**'))) {
        if (currentPanel.trim()) {
          allPanels.push(currentPanel.trim());
        }
        // Remove panel header from both formats
        currentPanel = line.replace(/^(Panel \d+:|\*\*Panel \d+:\*\*)/, '').trim();
        inPanel = true;
      } else if (inPanel && line.trim()) {
        // Add content to current panel
        currentPanel += ' ' + line.trim();
      }
    }
    
    if (currentPanel.trim()) {
      allPanels.push(currentPanel.trim());
    }
  }
  
  console.log('🔍 StoryParser: Parsed', allPanels.length, 'panels');
  console.log('🔍 StoryParser: First few panels:', allPanels.slice(0, 3));
  
  return allPanels;
}; 