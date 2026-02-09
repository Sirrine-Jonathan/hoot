# Hoot: The Teacher Agent - Construction Plan

Hoot is a VS Code extension designed to act as an AI-powered "Teacher Agent," guiding users through learning coding concepts, frameworks, and libraries within their IDE.

## Phase 1: Core Infrastructure & UI (Current)
- [x] Scaffold extension (Vite + React + VS Code API).
- [x] Clean up boilerplate ("Hello World" removal).
- [x] Set up branding assets in `resources/`.
- [x] Implement basic Sidebar Webview (`WebviewViewProvider`).
- [x] Implement secure API Key storage using `vscode.SecretStorage`.
- [x] Create a message-passing bridge between Webview (React) and Extension (TypeScript). (Full React implementation)

## Phase 2: AI Integration (The "Brain")
- [x] Integrate Gemini API (via `@google/generative-ai` or direct fetch).
- [x] Implement a system prompt that defines the "Teacher" persona (Socratic, encouraging, focuses on *why* over *what*).
- [x] Add conversation history management to maintain context during a learning session.
- [x] Implement streaming responses in the Webview for a modern chat feel. (Basic non-streaming chat implemented)

## Phase 3: Contextual Learning Features
- [ ] **Hover Provider:** Display concept summaries or hints when hovering over specific code patterns.
- [ ] **CodeLens:** Add "[Explain This]" or "[Get Hint]" links above functions or complex logic.
- [ ] **Decorations:** Show "virtual text" (e.g., variable types, tensor shapes) inline to help users visualize data flow.
- [ ] **Diagnostics:** Create custom "Learning Opportunity" diagnostics that suggest more idiomatic ways to write code.

## Phase 4: Structured Tutorials & Walkthroughs
- [ ] Implement `contributes.walkthroughs` in `package.json` for guided curricula.
- [ ] Create a "Welcome to Hoot" walkthrough to onboard new users.
- [ ] Develop a mechanism for Hoot to "observe" file changes and provide feedback based on walkthrough progress.

## Phase 5: Interactivity & Assessment
- [ ] **Chat-to-Code Interaction:** Allow Hoot to highlight lines or open files based on chat context.
- [ ] **Quizzes & Knowledge Checks:** Implement small interactive components within the Webview to test user understanding.
- [ ] **Progress Tracking:** Store and visualize the user's learning journey.

## Phase 6: Polishing & Publishing
- [ ] Refine the UI with VS Code Design Toolkit (Material Design principles).
- [ ] Extensive testing (Unit + Extension Integration tests).
- [ ] Bundle extension using Webpack for production.
- [ ] Publish to the VS Code Marketplace.

## Immediate Next Steps:
1.  **Secret Storage:** Implement the command to let users save their Gemini API key securely.
2.  **Webview Communication:** Build a robust `postMessage` handler to allow the sidebar to request explanations.
3.  **Basic Chat UI:** Replace the "Hello from Hoot Chat!" placeholder with a simple chat interface that can send/receive messages.
