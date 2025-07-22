
import { useState, useEffect } from 'react';
import { PanelText } from './types';

export const usePanelProcessor = (story: string | null) => {
  const [totalPanels, setTotalPanels] = useState(0);
  const [panelTexts, setPanelTexts] = useState<PanelText[]>([]);

  // Calculate total panels and extract panel texts when story changes
  useEffect(() => {
    if (story) {
      const pages = story.split('---').map(page => page.trim()).filter(page => page.length > 0);
      let panelCount = 0;
      const allPanelTexts: PanelText[] = [];
      
      pages.forEach((page, pageIndex) => {
        const lines = page.split('\n').filter(line => line.trim());
        const panelSections: string[] = [];
        let currentPanel = '';
        let inPanel = false;
        
        for (const line of lines) {
          if (line.includes('**Panel') && line.includes(':**')) {
            if (currentPanel.trim()) {
              panelSections.push(currentPanel.trim());
            }
            currentPanel = line.replace(/\*\*Panel \d+:\*\*/, '').trim();
            inPanel = true;
          } else if (inPanel && !line.includes('**Page') && !line.includes('**Panel')) {
            currentPanel += ' ' + line.trim();
          }
        }
        
        if (currentPanel.trim()) {
          panelSections.push(currentPanel.trim());
        }
        
        // Only 2 panels per page
        const panelsToShow = panelSections.slice(0, 2);
        panelsToShow.forEach((panelText, panelIndex) => {
          const globalPanelIndex = (pageIndex * 2) + panelIndex;
          allPanelTexts.push({
            text: panelText,
            index: globalPanelIndex
          });
        });
        
        panelCount += panelsToShow.length;
      });
      
      setTotalPanels(panelCount);
      setPanelTexts(allPanelTexts);
      //console.log('Total panels for visual continuity:', panelCount);
    }
  }, [story]);

  return {
    totalPanels,
    panelTexts
  };
};
