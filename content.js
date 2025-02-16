let isPromptShowing = false;

function showPrompt(domain) {
    if (isPromptShowing) return;
    isPromptShowing = true;

    const dialog = document.createElement('div');
    dialog.innerHTML = `
        <div id="redirect-blocker-dialog" style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 999999;
            font-family: Arial, sans-serif;
            min-width: 300px;
        ">
            <h3 style="margin-top: 0; color: #2c3e50;">Redirect Detected</h3>
            <p>You are being redirected to: ${domain}</p>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <label style="display: flex; align-items: center; gap: 5px;">
                    <input type="checkbox" id="remember-choice">
                    Remember my choice for this domain
                </label>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button id="allow-button" style="
                    background: #2ecc71;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                ">Allow</button>
                <button id="block-button" style="
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                ">Block</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);
    
    const allowButton = dialog.querySelector('#allow-button');
    const blockButton = dialog.querySelector('#block-button');
    const rememberChoice = dialog.querySelector('#remember-choice');

    allowButton.addEventListener('click', () => {
        if (rememberChoice.checked) {
            chrome.runtime.sendMessage({
                type: 'ADD_TO_LIST',
                domain: domain,
                allow: true
            });
        }
        dialog.remove();
        isPromptShowing = false;
    });

    blockButton.addEventListener('click', () => {
        if (rememberChoice.checked) {
            chrome.runtime.sendMessage({
                type: 'ADD_TO_LIST',
                domain: domain,
                allow: false
            });
        }
        dialog.remove();
        isPromptShowing = false;
        // Redirect to previous page
        history.back();
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SHOW_PROMPT') {
        showPrompt(message.domain);
    }
});
