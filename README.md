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

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [VS Code](https://code.visualstudio.com/)
- A [Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Sirrine-Jonathan/hoot.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the extension:
   ```bash
   npm run compile
   ```

### Setup Hoot
1. Open Hoot in VS Code.
2. Press `F5` to launch the **Extension Development Host**.
3. In the new window, open the Command Palette (`Ctrl+Shift+P`) and run:
   **"Hoot: Set Gemini API Key"**
4. Enter your key and start chatting with Hoot in the sidebar!

## 🧪 Development & Testing

We follow a strict Test-Driven Development (TDD) process.

- **Run Tests:** `npm run test`
- **Lint Code:** `npm run lint`
- **Build Webview:** The React-based sidebar is bundled via Webpack into `dist/webview.js`.

## 🦉 Our Philosophy

Hoot isn't a replacement for your brain; it's an accelerator. We believe that true learning happens when you struggle slightly and then succeed. Hoot is there to make sure that struggle is productive.

---
*Built with ❤️ for learners everywhere.*
