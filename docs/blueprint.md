# **App Name**: LiveEdit AI

## Core Features:

- Code Editor: VS Code-like user interface for code editing with file folder annotations, file folder upload along with drag and drop, built in terminal
- AI Code Assist: AI coding agent that provides suggestions, autocompletion, autonomous coding, editing, and running commands. Also include speech to text in prompt typing area, it will have reusable terminal in chat interface when required to run shell command. It will have API key manager modal for adding, editing, delete API key, this app will have features to Auto switching API key when quota exceeds with unlimited instant retry until getting successful ai model response. After getting prompt ai model start thinking with timer showing and spinner animation. It will analyze prompt, show analysis result, then start planning, show plan for execution with outcome, then start live execution of code writing, editing, file folder create edit delete move rename etc, run shell command in reusable terminal, execution steps will be shown step by step with start time, then finish with end time, show success or error, outcome. Then after all execution steps show summary of execution with outcome, then show improvement suggestions in clickable chips based on project context. In case of high level code change like UI or process overhaul, file folder delete it will ask user permission.
- Live Preview: Real-time code execution and display.
- AI Refactoring: AI-powered tool to refactor code. LLM will determine whether refactoring could simplify the logic, and only then propose the changes.
- Error Highlighting: Display code errors and warnings.

## Style Guidelines:

- Primary color: Soft blue (#7AB8E6) for a calm, focused coding environment.
- Background color: Dark gray (#282C34) to reduce eye strain and provide contrast.
- Accent color: Yellow (#E5C07B) to highlight important code elements.
- Font: 'Inter' (sans-serif) for code editing, ensuring readability and a modern look.
- Code font: 'Source Code Pro' for displaying computer code clearly.
- Simple, line-based icons for UI elements.
- Split-screen layout with code editor on the left and live preview on the right.
- Smooth transitions for code updates in the live preview.