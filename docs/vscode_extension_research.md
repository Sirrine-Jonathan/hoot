# VS Code Extension Research: The "Teacher Agent"

This document outlines the research and proposed architecture for building a "Teacher Agent" VS Code extension that integrates with Gemini. The goal is to create an interactive learning environment for developers.

---

## 1. Chat Interface

The core of the interactive experience will be a chat panel.

- **Recommended API:** `vscode.window.registerWebviewViewProvider`
- **Implementation:** Create a "Webview View" and place it in the VS Code sidebar (e.g., like the GitHub Copilot Chat). This provides a persistent, accessible chat interface.
- **Key Best Practices:**
    - **Security:** Use a strict Content Security Policy (CSP). All scripts and styles must be loaded from the extension's local, controlled files. Avoid inline scripts.
    - **Communication:** Use `webview.postMessage()` for message passing between the extension's main logic (TypeScript) and the webview's UI (HTML/JS/CSS).
    - **Theming:** The UI should use VS Code's CSS variables (e.g., `var(--vscode-editor-background)`) to adapt to the user's theme for a native look and feel.

---

## 2. Authentication & API Key Management

To communicate with Gemini, we need to securely handle authentication.

### Method A: Simple API Key Storage (Recommended First Step)

- **Workflow:** The extension prompts the user to enter their Gemini API key once.
- **API:** `vscode.SecretStorage`
- **Details:** This API securely stores the key in the operating system's native keychain (e.g., Windows Credential Manager, macOS Keychain). It is the standard, secure way to persist sensitive strings.
- **UX:** Use `vscode.window.showInputBox()` with a `password: true` flag to ask for the key.

### Method B: Google Authentication (Advanced)

- **Workflow:** The extension prompts the user to sign in with their Google account.
- **API:** `vscode.authentication.getSession('google', scopes, { createIfNone: true })`
- **Details:** This is the most seamless UX, as it uses VS Code's built-in, trusted authentication flow. The extension receives an OAuth token.
- **SecretStorage:** The retrieved token should still be cached in `vscode.SecretStorage` to minimize re-authentication prompts.

---

## 3. Inline Teaching, Hints, and Help

This is how the agent provides contextual guidance directly in the code.

### API 1: Decorations (`vscode.window.createTextEditorDecorationType`)

- **Use Cases:**
    - **Live Feedback ("Shadow Coding"):** Add non-intrusive text *after* a line of code (e.g., `// Tensor Shape: [16, 128]`).
    - **Highlighting:** Temporarily highlight a block of code that has an issue or is relevant to the current learning concept.
    - **Gutter Icons:** Place an icon in the gutter next to a line to indicate a learning note is available.

### API 2: CodeLens (`vscode.languages.registerCodeLensProvider`)

- **Use Cases:**
    - **Actionable Links:** Add clickable text like "[Get Hint]" or "[Explain This Code]" directly above functions or complex blocks.
    - **User-Initiated Learning:** This is perfect for providing help only when the user explicitly requests it, making the agent less intrusive.

### API 3: Commenting (`vscode.comments.createCommentController`)

- **Use Cases:**
    - **Socratic Dialogue:** Create a "discussion thread" on a specific line of code. The agent can ask a question in the thread, and the user can reply, creating a focused, contextual conversation.

---

## 4. Structured Learning: Projects & Tutorials

For guiding a user through an entire project, like building a neural network.

- **Recommended API:** **VS Code Walkthroughs** (`contributes.walkthroughs` in `package.json`).
- **Implementation:** This is a powerful, built-in feature for creating multi-step tutorials. A walkthrough can:
    - Present a series of steps with Markdown content.
    - Link to specific files and even line numbers.
    - Trigger VS Code commands (e.g., "Run this test").
    - Open our chat webview at a specific point in the lesson.
- **Benefit:** This is the ideal API for creating the main "course curriculum" structure.

---

## 5. Proposed Architecture & User Flow

Combining these APIs creates a powerful learning loop:

1.  **Initiation:** The user starts a "Learn PyTorch" walkthrough from the "Get Started" page.
2.  **Guidance:** The walkthrough opens `model.py` and the "Teacher Agent" chat panel. Step 1 of the walkthrough asks the user to define the first layer of a neural network.
3.  **Live Feedback:** As the user types, the extension uses **Decorations** to show the changing output tensor shapes as "virtual text" at the end of the lines.
4.  **Problem Solving:** The user gets stuck on the activation function. They click a **CodeLens** link that says "[Hint: Which activation is best for classification?]".
5.  **Interaction:** The agent responds in the **chat panel**, not with the answer, but with a question: "What is the range of values you need for your output layer?".
6.  **Authentication:** All communication with the Gemini API is handled in the background, using an API key securely stored with **SecretStorage**.
