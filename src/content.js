chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getTextContent") {
    // Extract text from the body, removing all HTML tags
    const bodyText = document.body.innerText || '';
    console.log("Extracted text content:", bodyText);

    // Send the content back to the popup
    sendResponse({ content: bodyText });
  }
  // Return true to indicate asynchronous response
  return true;
});
