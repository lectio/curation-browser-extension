function getPageDetails(callback) { 
    // Inject the content script into the current page 
    chrome.tabs.executeScript(null, {  code: "if(typeof chrome.app.isInstalled!=='undefined'){chrome.runtime.sendMessage({'title': document.title,'head':document.head.outerHTML,'url': window.location.href,'body': document.body.outerHTML,'summary': window.getSelection().toString()});}" }); 
    // Perform the callback when a message is received from the content script
    chrome.runtime.onMessage.addListener(function(message)  { 
        // Call the callback function
        callback(message); 
    }); 
  }; 
  