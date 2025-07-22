// Function to clean panel text for display while preserving scenery descriptions
export const cleanPanelTextForDisplay = (panelText: string): string => {
  // Keep stage directions but format them nicely (remove asterisks, display as regular text)
  let cleanText = panelText.replace(/\*([^*]*)\*/g, '$1');
  
  // Keep narrator attributions but clean up the formatting
  cleanText = cleanText.replace(/Narrator:\s*["""]([^"""]*)["""]/g, 'Narrator: $1');
  cleanText = cleanText.replace(/Narrator:\s*(.+)/g, 'Narrator: $1');
  
  // Clean up extra whitespace but preserve paragraph breaks
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  
  return cleanText;
};
