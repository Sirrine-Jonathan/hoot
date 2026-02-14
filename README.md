# Hoot: The AI Teacher Agent 🦉

Hoot is a VS Code extension that acts as your personal AI-powered "Teacher Agent." Unlike standard AI assistants that just provide code, Hoot is designed to help you **learn** by using the Socratic method—guiding you with hints, questions, and contextual feedback.

![Hoot Banner](resources/hoot-banner-final.png)

## 🚀 Features

- **Socratic Mentoring:** Hoot focuses on the "why" behind the code. It asks guiding questions and provides hints to help you reach the solution yourself.
- **Dual AI Providers:** Choose between **Google Gemini** (Cloud) and **Ollama** (Local). Work entirely offline with privacy-focused models.
- **Sidebar Chat Interface:** A dedicated React-based chat panel for persistent, focused learning sessions.
- **Dynamic Model Selection:** Choose from multiple Gemini or Ollama models (e.g., `qwen2.5-coder:7b`, `llama3`, `mistral`) based on your needs.
- **Automated Tutorials:** Ask Hoot to create comprehensive Markdown tutorials in your workspace.
- **Secure by Design:** Your Gemini API keys are stored securely using VS Code's `SecretStorage` (native OS keychain).
- **One-Click Setup:** Integrated PATH fixing and model pulling for Ollama to get you running locally in seconds.

## 📸 Branding & Visuals

<p align="center">
  <img src="resources/hoot_promo_cinematic_S0_1770670710.webp" width="45%" alt="Promo 1">
  <img src="resources/hoot_promo_cinematic_S1_1770670710.webp" width="45%" alt="Promo 2">
</p>

## 🛠️ Getting Started

### Prerequisites
- For Cloud: A **Gemini API Key**. Get one for free from **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
- For Local: **Ollama** installed on your machine.

### Beta Installation (VSIX)
1. Download the latest `hoot-x.x.x.vsix` file.
2. In VS Code, go to the **Extensions** view (`Ctrl+Shift+X`).
3. Click the **...** (Views and More Actions) at the top right.
4. Select **Install from VSIX...** and choose the downloaded file.

### Setup Hoot
1. Open the Hoot sidebar (🦉 icon).
2. Choose your provider in the **Settings** view (gear icon).
3. If using Gemini, click **Set API Key**.
4. If using Ollama, click **Setup Ollama** to pull the recommended coding model.
5. Start coding! Hoot will provide Socratic hints as you work.

## 🧪 Development & Testing

We follow a strict Test-Driven Development (TDD) process.

- **Run Tests:** `npm run test`
- **Lint Code:** `npm run lint`
- **Build Webview:** The React-based sidebar is bundled via Webpack into `dist/webview.js`.

## 🦉 Our Philosophy

Hoot isn't a replacement for your brain; it's an accelerator. We believe that true learning happens when you struggle slightly and then succeed. Hoot is there to make sure that struggle is productive.

---
*Built with ❤️ for learners everywhere.*
