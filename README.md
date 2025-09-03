# NPC Generator for D&D 5e - Bring your own LLM
This Foundry VTT module allows users to generate random NPCs using multiple LLM APIs, including OpenAI and Azure OpenAI.
It is based off of [NPC Generator by Halftonex](https://github.com/Halftonex/npc-generator-gpt).  If you want something more stable please use that module.

##

## Setup
To install, follow these instructions:
1. Inside Foundry, select the Game Modules tab in the Configuration and Setup menu.
1. Click the Install Module button and enter the following URL: https://github.com/michaelmj/npc-generator-byo-llm/releases/latest/download/module.json
1. Click Install and wait for installation to complete.

## Usage

### For OpenAI:
1. Go to https://platform.openai.com/account/api-keys
1. If you don't already have one, create a new account.
1. Generate a new secret key.
1. Open the module settings.
1. Set "Authentication Type" to "OpenAI (Bearer Token)".
1. Set "API URL" to: `https://api.openai.com/v1/chat/completions`
1. Paste your secret key in the "API Key" field.
1. Set "Model" to your desired model (e.g., `gpt-4o-mini`, `gpt-3.5-turbo`).

### For Azure OpenAI:
1. Go to your Azure OpenAI resource in the Azure portal.
1. Navigate to "Keys and Endpoint" section.
1. Copy one of the keys and the endpoint.
1. Open the module settings.
1. Set "Authentication Type" to "Azure OpenAI (API Key Header)".
1. Set "API URL" to: `https://your-resource-name.openai.azure.com/openai/deployments/your-deployment-name/chat/completions`
1. Paste your API key in the "API Key" field.
1. Set "Model" to your deployment name.
1. Set "API Version" to the appropriate version (e.g., `2024-02-15-preview`).
   
---

**N.B.** 
*Both OpenAI and Azure OpenAI APIs are not free, although, given their limited usage by the module, they are very cost-effective. The average cost per generation is about $0.001. You can find the exact generation cost as log in the console (F12).*

*For OpenAI, to check your available credit, please visit:* https://platform.openai.com/account/billing/overview

*For Azure OpenAI, billing is managed through your Azure subscription.*

---

### Generate
After installing and enabling the module, you will find a new button on top of the Actors tab.

<img src="images/button.png">

After pressing the button, a window will open allowing you to select certain parameters.

<img src="images/dialog.png"> <img src="images/dialog2.png">

Here's an example of an NPC created with this module.

<img src="images/sheet1.png">

<img src="images/sheet2.png">

<img src="images/sheet3.png">

<img src="images/sheet4.png">

---

### Enhance
You will also find a new button on the NPC character sheet, this button will let you scale an existing NPC to a desired CR.

<img src="images/button2.png">

<img src="images/button3.png">

Before

<img src="images/sheet5.png">

After

<img src="images/sheet6.png">

<img src="images/sheet7.png">

## Settings
<img src="images/settings.png">

## Support
For any issues, requests and bug reporting, you can dm me on discord @half.tone or visit the project's Github issue page [here](https://github.com/michaelmj/npc-generator-byo-llm/issues).

## Licence
This Foundry VTT module is licensed under a [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).
