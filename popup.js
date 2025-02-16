document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggle');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const searchInput = document.getElementById('searchInput');

    let isEnabled = true;
    let blockedDomains = [];
    let allowedDomains = [];

    // Load initial state
    chrome.storage.local.get(['enabled', 'blockedDomains', 'allowedDomains'], function(result) {
        isEnabled = result.enabled !== false;
        blockedDomains = result.blockedDomains || [];
        allowedDomains = result.allowedDomains || [];
        updateUI();
        displayBlockedDomains();
        displayAllowedDomains();
    });

    // Toggle blocking
    toggleButton.addEventListener('click', function() {
        isEnabled = !isEnabled;
        chrome.storage.local.set({ enabled: isEnabled });
        updateUI();
    });

    // Add tabs for Blocked and Allowed domains
    const blocklist = document.querySelector('.blocklist');
    blocklist.innerHTML = `
        <div class="tabs">
            <button id="blockedTab" class="tab active">Blocked Domains</button>
            <button id="allowedTab" class="tab">Allowed Domains</button>
        </div>
        <div id="blockedContent">
            <input type="text" id="blocklistInput" placeholder="Enter domain to block (e.g., example.com)">
            <button id="addDomain">Add to Blocklist</button>
            <div id="domainList"></div>
        </div>
        <div id="allowedContent" style="display: none;">
            <input type="text" id="allowlistInput" placeholder="Enter domain to allow (e.g., example.com)">
            <button id="addAllowedDomain">Add to Allowlist</button>
            <div id="allowedDomainList"></div>
        </div>
    `;

    // Add styles for tabs
    const style = document.createElement('style');
    style.textContent = `
        .tabs {
            display: flex;
            margin-bottom: 15px;
            border-bottom: 1px solid #ddd;
        }
        .tab {
            padding: 8px 15px;
            border: none;
            background: none;
            cursor: pointer;
            opacity: 0.7;
            transition: all 0.3s ease;
        }
        .tab.active {
            opacity: 1;
            border-bottom: 2px solid #3498db;
        }
        .tab:hover {
            opacity: 1;
        }
        .domain-count {
            margin-left: 5px;
            background: #eee;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 0.8em;
            color: #666;
        }
        .empty-list {
            text-align: center;
            padding: 20px;
            color: #666;
            font-style: italic;
        }
        .domain-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background-color: #f8f9fa;
            margin: 5px 0;
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        .domain-item:hover {
            background-color: #e9ecef;
        }
        .remove-domain {
            color: #e74c3c;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
            transition: background-color 0.2s;
        }
        .remove-domain:hover {
            background-color: #fee;
        }
    `;
    document.head.appendChild(style);

    // Get references to new elements
    const blockedTab = document.getElementById('blockedTab');
    const allowedTab = document.getElementById('allowedTab');
    const blockedContent = document.getElementById('blockedContent');
    const allowedContent = document.getElementById('allowedContent');
    const blocklistInput = document.getElementById('blocklistInput');
    const allowlistInput = document.getElementById('allowlistInput');
    const addDomainButton = document.getElementById('addDomain');
    const addAllowedDomainButton = document.getElementById('addAllowedDomain');

    // Tab switching logic
    blockedTab.addEventListener('click', () => {
        blockedTab.classList.add('active');
        allowedTab.classList.remove('active');
        blockedContent.style.display = 'block';
        allowedContent.style.display = 'none';
        updateDomainCounts();
    });

    allowedTab.addEventListener('click', () => {
        allowedTab.classList.add('active');
        blockedTab.classList.remove('active');
        allowedContent.style.display = 'block';
        blockedContent.style.display = 'none';
        updateDomainCounts();
    });

    // Domain management functions
    function addBlockedDomain() {
        const domain = blocklistInput.value.trim().toLowerCase();
        if (domain) {
            if (allowedDomains.includes(domain)) {
                alert('This domain is currently in the allow list. Please remove it from there first.');
                return;
            }
            if (!blockedDomains.includes(domain)) {
                blockedDomains.push(domain);
                chrome.storage.local.set({ blockedDomains });
                blocklistInput.value = '';
                displayBlockedDomains();
                updateDomainCounts();
            }
        }
    }

    function addAllowedDomain() {
        const domain = allowlistInput.value.trim().toLowerCase();
        if (domain) {
            if (blockedDomains.includes(domain)) {
                alert('This domain is currently in the block list. Please remove it from there first.');
                return;
            }
            if (!allowedDomains.includes(domain)) {
                allowedDomains.push(domain);
                chrome.storage.local.set({ allowedDomains });
                allowlistInput.value = '';
                displayAllowedDomains();
                updateDomainCounts();
            }
        }
    }

    function removeBlockedDomain(domain) {
        blockedDomains = blockedDomains.filter(d => d !== domain);
        chrome.storage.local.set({ blockedDomains });
        displayBlockedDomains();
        updateDomainCounts();
    }

    function removeAllowedDomain(domain) {
        allowedDomains = allowedDomains.filter(d => d !== domain);
        chrome.storage.local.set({ allowedDomains });
        displayAllowedDomains();
        updateDomainCounts();
    }

    function displayBlockedDomains() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredDomains = blockedDomains.filter(domain => 
            domain.toLowerCase().includes(searchTerm)
        );

        const domainList = document.getElementById('domainList');
        domainList.innerHTML = '';

        if (filteredDomains.length === 0) {
            domainList.innerHTML = '<div class="empty-list">No blocked domains</div>';
            return;
        }

        filteredDomains.forEach(domain => {
            const domainElement = document.createElement('div');
            domainElement.className = 'domain-item';
            domainElement.innerHTML = `
                <span>${domain}</span>
                <span class="remove-domain" title="Remove from blocklist">×</span>
            `;
            domainElement.querySelector('.remove-domain').addEventListener('click', () => {
                removeBlockedDomain(domain);
            });
            domainList.appendChild(domainElement);
        });
    }

    function displayAllowedDomains() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredDomains = allowedDomains.filter(domain => 
            domain.toLowerCase().includes(searchTerm)
        );

        const allowedDomainList = document.getElementById('allowedDomainList');
        allowedDomainList.innerHTML = '';

        if (filteredDomains.length === 0) {
            allowedDomainList.innerHTML = '<div class="empty-list">No allowed domains</div>';
            return;
        }

        filteredDomains.forEach(domain => {
            const domainElement = document.createElement('div');
            domainElement.className = 'domain-item';
            domainElement.innerHTML = `
                <span>${domain}</span>
                <span class="remove-domain" title="Remove from allowlist">×</span>
            `;
            domainElement.querySelector('.remove-domain').addEventListener('click', () => {
                removeAllowedDomain(domain);
            });
            allowedDomainList.appendChild(domainElement);
        });
    }

    function updateDomainCounts() {
        const blockedCount = blockedDomains.length;
        const allowedCount = allowedDomains.length;
        
        blockedTab.innerHTML = `Blocked Domains <span class="domain-count">${blockedCount}</span>`;
        allowedTab.innerHTML = `Allowed Domains <span class="domain-count">${allowedCount}</span>`;
    }

    function updateUI() {
        statusIndicator.className = `status-indicator ${isEnabled ? 'active' : 'inactive'}`;
        statusText.textContent = `Extension is ${isEnabled ? 'running' : 'paused'}`;
        toggleButton.textContent = `${isEnabled ? 'Disable' : 'Enable'} Blocking`;
        updateDomainCounts();
    }

    // Event listeners
    addDomainButton.addEventListener('click', addBlockedDomain);
    addAllowedDomainButton.addEventListener('click', addAllowedDomain);

    blocklistInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addBlockedDomain();
        }
    });

    allowlistInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addAllowedDomain();
        }
    });

    searchInput.addEventListener('input', function() {
        displayBlockedDomains();
        displayAllowedDomains();
    });

    // Initialize UI
    updateDomainCounts();
});