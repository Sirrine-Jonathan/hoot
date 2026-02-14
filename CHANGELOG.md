# Change Log

All notable changes to the "hoot" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.0] - 2026-02-13



### Added

- **Ollama Support**: Full support for local LLMs, allowing Hoot to work entirely offline.

- **Dedicated Settings View**: A new sidebar view for managing AI providers, API keys, and local models.

- **Interactive Setup**: "One-click" setup for Ollama, including PATH fixing on Windows and automatic model pulling.

- **Actionable Chat Buttons**: Direct "Pull Model Now" buttons in chat if a requested model is missing.

- **Connection Status**: Real-time visual indicator (status dot) for AI provider connectivity.

- **Custom Model Pulling**: Ability to pull any Ollama model directly from the Hoot interface.



### Changed

- **Multi-Provider Architecture**: Refactored core AI logic to be provider-agnostic.

- **Robust JSON Parsing**: Improved Socratic hint reliability by adding resilient JSON extraction from model responses.

- **Unified Interface**: The sidebar now contextually adapts to the active provider (Gemini or Ollama).



### Fixed

- Fixed model dropdown not refreshing when switching providers.

- Improved error messages for disconnected services or missing local models.

- Downgraded VS Code test requirement to 1.108.0 to resolve update-related test failures.
