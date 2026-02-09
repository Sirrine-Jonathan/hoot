# Hoot: The AI Teacher Agent 🦉

Hoot is a VS Code extension that acts as your personal AI-powered "Teacher Agent." Unlike standard AI assistants that just provide code, Hoot is designed to help you **learn** by using the Socratic method—guiding you with hints, questions, and contextual feedback.

![Hoot Banner](resources/hoot-banner-final.png)

## 🚀 Features

- **Socratic Mentoring:** Hoot focuses on the "why" behind the code. It asks guiding questions and provides hints to help you reach the solution yourself.
- **Sidebar Chat Interface:** A dedicated React-based chat panel for persistent, focused learning sessions.
- **Dynamic Model Selection:** Choose from multiple Gemini models (Flash, Pro, etc.) based on your needs.
- **Automated Tutorials:** Ask Hoot to create comprehensive Markdown tutorials in your workspace.
- **Secure by Design:** Your Gemini API keys are stored securely using VS Code's `SecretStorage` (native OS keychain).

## 📸 Branding & Visuals

<p align="center">
  <img src="resources/hoot_promo_cinematic_S0_1770670710.webp" width="45%" alt="Promo 1">
  <img src="resources/hoot_promo_cinematic_S1_1770670710.webp" width="45%" alt="Promo 2">
</p>

## 🛠️ Getting Started

### Beta Installation (VSIX)
1. Download the latest `hoot-x.x.x.vsix` file.
2. In VS Code, go to the **Extensions** view (`Ctrl+Shift+X`).
3. Click the **...** (Views and More Actions) at the top right.
4. Select **Install from VSIX...** and choose the downloaded file.

### Setup Hoot
1. Open the Hoot sidebar (🦉 icon).
2. Click **Set API Key** (you'll need a [Gemini API Key](https://aistudio.google.com/app/apikey)).
3. Start coding! Hoot will provide Socratic hints as you work.

## 🧪 Development & Testing

We follow a strict Test-Driven Development (TDD) process.

- **Run Tests:** `npm run test`
- **Lint Code:** `npm run lint`
- **Build Webview:** The React-based sidebar is bundled via Webpack into `dist/webview.js`.

## 🦉 Our Philosophy

Hoot isn't a replacement for your brain; it's an accelerator. We believe that true learning happens when you struggle slightly and then succeed. Hoot is there to make sure that struggle is productive.

---
*Built with ❤️ for learners everywhere.*
