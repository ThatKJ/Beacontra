/**
 * Beacontra Lens — Background Service Worker (Manifest V3)
 */

// Enable side panel to open on toolbar action click
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
      console.warn('Failed to set side panel behavior:', error);
    });
  }
});
