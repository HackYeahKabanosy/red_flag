chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      const domain = (new URL(tab.url)).hostname.replace('www.', '');
  
      // Retrieve stored prompts for this domain
      chrome.storage.local.get([domain], (result) => {
        chrome.storage.local.set({ currentDomain: domain });
        if (result[domain]) {
          // Display existing prompts
          chrome.runtime.sendMessage({ action: "loadPrompts", prompts: result[domain] });
        }
      });
    }
  });

  chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  });
  