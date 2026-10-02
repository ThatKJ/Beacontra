/**
 * Beacontra Lens 2.0 — Background Service Worker
 * Handles extension lifecycle, side panel controls, and image context menu investigations.
 */

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for quick image forensics
  chrome.contextMenus.create({
    id: 'beacontra_investigate_image',
    title: 'Investigate Image with Beacontra Lens',
    contexts: ['image'],
  });
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id }).catch((err) => {
      console.warn('Failed to open side panel:', err);
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'beacontra_investigate_image' && info.srcUrl) {
    chrome.storage.local.set({
      pendingImageInvestigation: {
        imageUrl: info.srcUrl,
        pageUrl: info.pageUrl || tab?.url || '',
        timestamp: Date.now(),
      },
    }, () => {
      if (tab?.id) {
        chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
      }
    });
  }
});
