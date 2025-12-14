📘 DocuMind-AI

**Enterprise-grade document intelligence platform powered by Google Gemini 2.5.**  
DocuMind-AI enables deep document understanding with multimodal support — PDF, Image, Video, and Text — along with strict citation grounding, deep-thinking responses, and voice-based interaction.

---

## 🚀 Features

- 📄 **Multimodal Document Support**  
  Upload and analyze PDFs, images, videos, and plain text.

- 🧠 **AI-Powered Understanding**  
  Uses Google Gemini 2.5 for advanced reasoning and contextual intelligence.

- 💬 **Chat-Based Interface**  
  Ask questions in natural language and get accurate, contextual answers.

- 🎯 **Citation & Source Grounding**  
  Every response is grounded with references from the uploaded content.

- 🎤 **Voice Interaction**  
  Supports voice input and spoken AI responses.

- 🔍 **Deep Thinking Mode**  
  Handles complex and multi-step questions with structured reasoning.

---

## 🧠 Tech Stack

- **Frontend:** React + TypeScript  
- **Build Tool:** Vite  
- **AI Model:** Google Gemini 2.5  
- **Deployment:** AI Studio / Vercel / Netlify  
- **Styling:** Tailwind CSS / Modern Custom UI  

---

## 📁 Project Structure

documind-ai/
├── components/
├── contexts/
├── services/
├── views/
├── public/
├── src/
├── App.tsx
├── main.tsx
├── package.json
├── tsconfig.json
└── README.md

🔄 Application Workflow

Upload document

Extract content

Process with Gemini

Generate cited response

Display via chat UI

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1rGYXgl9-hScNDx2m3K9s9-Ulm4JpRSxN

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
