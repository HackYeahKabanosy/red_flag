document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const projectNameInput = document.getElementById('projectName');
  const domainInput = document.getElementById('domain');
  const resultsDiv = document.getElementById('results');

  // Prompt inputs
  const promptInputs = [
    { name: document.getElementById('name1'), prompt: document.getElementById('prompt1') },
    { name: document.getElementById('name2'), prompt: document.getElementById('prompt2') },
    { name: document.getElementById('name3'), prompt: document.getElementById('prompt3') },
    { name: document.getElementById('name4'), prompt: document.getElementById('prompt4') },
    { name: document.getElementById('name5'), prompt: document.getElementById('prompt5') }
  ];

  // Load saved settings
  chrome.storage.local.get(['openaiApiKey', 'projectName', 'currentDomain'], (data) => {
    apiKeyInput.value = data.openaiApiKey || '';
    projectNameInput.value = data.projectName || '';
    domainInput.value = data.currentDomain || '';

    // Check if prompts exist for the current domain
    if (data.currentDomain) {
      chrome.storage.local.get(data.currentDomain, (res) => {
        const storedPrompts = res[data.currentDomain] || [];
        storedPrompts.forEach((p, i) => {
          if (promptInputs[i]) {
            promptInputs[i].name.value = p.name || '';
            promptInputs[i].prompt.value = p.prompt || '';
          }
        });
      });
    }
  });

  // Automatically save on text change
  function savePrompts() {
    const prompts = promptInputs.map(input => ({
      name: input.name.value,
      prompt: input.prompt.value
    }));

    const domain = domainInput.value;
    if (domain) {
      chrome.storage.local.set({ [domain]: prompts }, () => {
        console.log('Prompts saved for domain:', domain);
      });
    }
  }

  // Save API key and project name on input change
  apiKeyInput.addEventListener('input', () => {
    chrome.storage.local.set({ openaiApiKey: apiKeyInput.value });
  });

  projectNameInput.addEventListener('input', () => {
    chrome.storage.local.set({ projectName: projectNameInput.value });
  });

  // Save prompts automatically on text input change
  promptInputs.forEach(input => {
    input.name.addEventListener('input', savePrompts);
    input.prompt.addEventListener('input', savePrompts);
  });

  document.getElementById('startAnalysis').addEventListener('click', () => {
    resultsDiv.innerHTML = '';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getTextContent" }, (response) => {
        if (!response || !response.content) {
          console.error('No response or content received from the active tab.');
          resultsDiv.innerHTML = 'Error: Unable to retrieve content from the page.';
          return;
        }

        const textContent = response.content;
        const prompts = promptInputs.map(input => ({
          name: input.name.value.trim(),
          prompt: input.prompt.value.trim()
        })).filter(p => p.prompt !== "");  // Only include non-empty prompts

        if (prompts.length === 0) {
          resultsDiv.innerHTML = 'No valid prompts to analyze.';
          return;
        }

        prompts.forEach(({ name, prompt }) => {
          const requestBody = {
            model: "gpt-4o-mini",
            messages: [{
              role: "user",
              content: `Check if on the given website ${prompt}. Answer with 1 if true or 0 if false: ${textContent}`
            }],
            temperature: 0.7
          };

          fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKeyInput.value}`
            },
            body: JSON.stringify(requestBody)
          })
          .then(response => response.json())
          .then(data => {
            const result = data.choices[0].message.content.trim();
            const isTrue = result === '1';
            const resultElem = document.createElement('div');
            resultElem.textContent = `${name}: ${result}`;
            resultElem.style.color = isTrue ? 'green' : 'red';
            resultsDiv.appendChild(resultElem);
          })
          .catch(error => {
            console.error('Error fetching from OpenAI:', error);
            const errorElem = document.createElement('div');
            errorElem.textContent = `${name}: Error fetching result`;
            errorElem.style.color = 'red';
            resultsDiv.appendChild(errorElem);
          });
        });
      });
    });
  });
});
