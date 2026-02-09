# VS Code Extension Deep Dive: "Teacher Agent" Blueprint

This document synthesizes research on the VS Code API to serve as a technical blueprint for the "Teacher Agent" extension.

---

## 1. Core Extension Anatomy

- **`package.json` (The Manifest):** This is the heart of the extension.
    - **`activationEvents`**: Declares how the extension is activated (e.g., `onCommand`, `onLanguage:python`, `onView:teacherAgentChat`). This is crucial for performance, as it prevents our extension from loading unnecessarily.
    - **`contributes`**: Statically declares all UI contributions, such as commands, menus, views, settings, and keybindings.
- **`extension.ts` (The Entry Point):** The main file containing `activate()` and `deactivate()` functions. All dynamic, programmatic logic starts here.

---

## 2. UI & Workbench Integration

This is how our agent will be visible and interactive.

- **Chat/Main Interface (`WebviewViewProvider`):**
    - **API:** `vscode.window.registerWebviewViewProvider`
    - **Use Case:** The primary UI for the chat, course content, and displaying rich media (images, diagrams). It will live in the sidebar for easy access.
    - **Security:** A strict Content Security Policy (CSP) is mandatory. All scripts, styles, and images must be loaded via special `vscode-resource:` URIs.

- **Contextual Actions (`CodeLensProvider`):**
    - **API:** `vscode.languages.registerCodeLensProvider`
    - **Use Case:** Add clickable links like "[Explain This]" or "[Get a Hint]" directly above code blocks. This is a non-intrusive way to offer user-initiated help.

- **Inline Hints & Feedback (`TextEditorDecorationType`):**
    - **API:** `vscode.window.createTextEditorDecorationType`
    - **Use Case:**
        - Provide "virtual" inline text (e.g., show tensor shapes: `// shape: [1, 128]`).
        - Highlight code blocks relevant to a learning concept.
        - Add gutter icons to indicate lines with available learning notes.

- **Structured Tutorials (`contributes.walkthroughs`):**
    - **API:** A `package.json` contribution point.
    - **Use Case:** The best way to create a multi-step, guided project. A walkthrough can open files, run commands, and link directly to our chat webview, providing a cohesive curriculum experience.

---

## 3. Programmatic Language Features

These APIs allow the agent to understand and interact with code like a native IDE feature.

- **Diagnostics (Errors/Warnings/Hints):**
    - **API:** `vscode.languages.createDiagnosticCollection`
    - **Use Case:** This is how our agent will provide feedback. We can create custom "learning opportunity" diagnostics. For example, if a student uses a non-optimal `for` loop, we can underline it and, via a Code Action, suggest a more idiomatic `map` or `forEach`.

- **Hover Information:**
    - **API:** `vscode.languages.registerHoverProvider`
    - **Use Case:** When a user hovers over a function we've taught them, we can display a custom tooltip with a summary of the concept, a link to our chat, or a small code example.

- **IntelliSense / Completions:**
    - **API:** `vscode.languages.registerCompletionItemProvider`
    - **Use Case:** Offer custom auto-complete items. For a learning module on a new library, we can provide completions that are annotated with extra documentation and point back to our agent's explanations.

---

## 4. Authentication & Security

- **API Key Management (`SecretStorage`):**
    - **API:** `context.secrets` (available in the `activate` function)
    - **Use Case:** Securely stores the user's Gemini API key on their machine using the OS keychain. This is the standard, secure method.

- **Google Sign-In (`Authentication` API):**
    - **API:** `vscode.authentication.getSession`
    - **Use Case:** For a more seamless UX, we can use this to allow users to sign in with their Google account, avoiding the need to manually manage API keys. The retrieved token should still be cached using `SecretStorage`.

---

## 5. Testing & Debugging

- **Debugging (`F5` Key):**
    - **Process:** Pressing `F5` in the project launches a new "Extension Development Host" window with the extension running. The `launch.json` is pre-configured for this.
    - **Console:** All `console.log` output appears in the "Debug Console" of the main VS Code window.

- **Testing (`@vscode/test-cli`):**
    - **Framework:** The official tool for running extension tests, which uses Mocha by default.
    - **Integration Tests:** Tests run inside a real VS Code instance, giving them full access to the API. This is essential for testing UI interactions and commands.
    - **Isolation:** It's critical to run tests with `--disable-extensions` to prevent other installed extensions from interfering with our tests.

This deep dive provides a solid foundation. We have a clear path from scaffolding the project to implementing advanced, context-aware teaching features.
