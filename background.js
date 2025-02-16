// background.js
let isEnabled = true;
let blockedDomains = [];
let allowedDomains = [];
let ruleId = 1;

// Load settings from storage
chrome.storage.local.get(['enabled', 'blockedDomains', 'allowedDomains'], function(result) {
    isEnabled = result.enabled !== false;
    blockedDomains = result.blockedDomains || [];
    allowedDomains = result.allowedDomains || [];
    updateRules();
});

// Listen for changes in storage
chrome.storage.onChanged.addListener(function(changes) {
    if (changes.enabled) {
        isEnabled = changes.enabled.newValue;
    }
    if (changes.blockedDomains) {
        blockedDomains = changes.blockedDomains.newValue;
    }
    if (changes.allowedDomains) {
        allowedDomains = changes.allowedDomains.newValue;
    }
    updateRules();
});

// Function to convert domain to rule format
function domainToRule(domain, id, action) {
    return {
        id: id,
        priority: 1,
        action: { type: action },
        condition: {
            urlFilter: `||${domain}`,
            resourceTypes: ["main_frame"]
        }
    };
}

// Update dynamic rules
async function updateRules() {
    if (!isEnabled) {
        // Remove all rules when disabled
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: Array.from({ length: ruleId }, (_, i) => i + 1)
        });
        return;
    }

    // Create rules for blocked domains
    const blockRules = blockedDomains.map((domain, index) => 
        domainToRule(domain, index + 1, "block")
    );

    // Create rules for allowed domains
    const allowRules = allowedDomains.map((domain, index) => 
        domainToRule(domain, index + blockRules.length + 1, "allow")
    );

    // Update all rules
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: Array.from({ length: ruleId }, (_, i) => i + 1),
        addRules: [...blockRules, ...allowRules]
    });

    ruleId = blockRules.length + allowRules.length + 1;
}

// Listen for navigation events to handle prompts
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' && tab.url) {
        const url = new URL(tab.url);
        const domain = url.hostname;

        // Skip if domain is in either list
        if (blockedDomains.includes(domain) || allowedDomains.includes(domain)) {
            return;
        }

        // Check if this is a new domain
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: () => {
                    return document.referrer ? new URL(document.referrer).hostname : null;
                }
            });

            const referrerDomain = results[0].result;
            if (referrerDomain && referrerDomain !== domain) {
                // Send message to content script to show prompt
                chrome.tabs.sendMessage(tabId, {
                    type: 'SHOW_PROMPT',
                    domain: domain
                });
            }
        } catch (error) {
            console.error('Error checking navigation:', error);
        }
    }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ADD_TO_LIST') {
        const { domain, allow } = message;
        if (allow) {
            allowedDomains.push(domain);
            chrome.storage.local.set({ allowedDomains });
        } else {
            blockedDomains.push(domain);
            chrome.storage.local.set({ blockedDomains });
        }
        updateRules();
    }
});