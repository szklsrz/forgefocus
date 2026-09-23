<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1T1Qw6YlgXpU92EQztnjEO9d5oaPzc9cG

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Browser Notifications

The timer can trigger browser-local notifications when a focus or break session ends.

- Permission is requested from the first timer start or from the in-app enable button.
- Notifications are local to the browser session and do not use Web Push.
- Delivery depends on browser support, granted permission, and the tab not being fully suspended or closed.
