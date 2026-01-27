# OneScript

> **Human Friendly Support Powered by AI.**
> A modern, AI-driven chatbot SaaS that integrates seamlessly with your website. **Just one script tag, and you have a fully functional chatbot.**

## 🚀 Features

### 1. Landing Page (onescript.xyz)
*   **Hero Section:** "Human Friendly Support Powered by AI" with a dynamic "Aurora" background animation and glass-morphism effects.
*   **Interactive Preview:** Floating chat interface simulating real-world usage in a "Test Environment".
*   **Social Proof:** Trusted by modern product teams (fictional logos like Acme, Nexus).
*   **The Power of One Script:** A focused showcase demonstrating our core USP: **"One line of code, infinite possibilities."**
    *   **3-Step Integration:** Scan URL -> Copy Snippet -> Auto-resolve.
    *   **Code Block:** Visualizing the single `<script>` tag that powers the entire experience.
*   **Pricing:** Free Starter tier and Pro tier ($49/mo) with complete feature comparison.

### 2. Authentication & Onboarding
*   **Neon Auth:** Secure authentication powered by **Neon**.
*   **Organization Management:** Auto-creation of organizations for team collaboration backed by **Postgres RLS**.
*   **Onboarding Wizard:**
    *   Step 1: Business Identity (Name, Website).
    *   Step 2: External Links (Resources).
    *   Smooth entry animations using `framer-motion`.

### 3. Dashboard
*   **Overview:** Setup progress tracker (Scanned, Knowledge Added, Configured, Installed).
*   **Stats:** Real-time counts for Pages, Manual Text, and Uploads.
*   **Quick Install:** Instant access to your unique `data-id` and script snippet.

### 4. Knowledge Base (RAG)
*   **Data Sources:**
    *   **Website Crawling:** Custom-built high-performance crawler for dynamic content.
    *   **Summarization:** **OpenAI GPT-4o-mini** processes content into clean Markdown.
    *   **File Uploads:** CSV support with header parsing (max 10MB).
    *   **Manual Text:** Direct paste for policies and specific answers.
*   **Vector Search:** Powered by **Neon pgvector** for lightning-fast retrievals.
*   **Management:** Sources table with status badges (Active/Training/Failed) and duplicate detection.

### 5. Smart Routing (Sections)
*   **Contextual Bots:** Create specific sections (e.g., "Billing", "Tech Support").
*   **Tone Control:** Strict, Neutral, Friendly, or Empathetic personalities.
*   **Scope Configuration:** Whitelist allowed topics and block competitors.
*   **Source Linking:** Attach specific knowledge sources to specific sections.

### 6. Playground & Config
*   **Chat Simulator:** Split-screen testing environment with "Context Testing" to verify specific sections.
*   **Customization:** Brand color presets (Indigo, Blue, Emerald, etc.) and custom welcome messages.
*   **Embed Generator:** One-click copy for the widget script.

### 7. Conversation Inbox
*   **Real-time Chat:** View visitor messages with IP tracking.
*   **Human Takeover:** Admin reply capability (injects messages as "Assistant").
*   **Chat History:** Searchable list with "Visitor #ID" and relative timestamps.

### 8. Team & Settings
*   **Member Management:** Invite team members via email.
*   **Role-Based Access:** Robust RBAC utilizing Neon's Postgres roles.
*   **Workspace Settings:** Read-only organization details and Danger Zone for deletion.

### 9. The Widget
*   **Universal Embed:** `widget.js` script works on any domain (CORS enabled).
*   **Secure Session:** Temporary JWT tokens (2h validity).
*   **Isolated UI:** Iframe injection prevents CSS conflicts.
*   **Smart Features:** Section selector and Escalation logic for complex queries.

### 10. AI Engine
*   **RAG Pipeline:** Vector search for relevant chunks + System Prompt injection.
*   **Token Management:** `js-tiktoken` integration to manage context window (summarizes >6k tokens).
*   **Streaming:** Asynchronous backend processing with optimistic UI updates.

---

## 🛠 Tech Stack

*   **Framework:** Next.js (App Router)
*   **Styling:** Tailwind CSS, Framer Motion
*   **Database & Auth:** Neon (Postgres + Auth)
*   **AI & Logic:** OpenAI (GPT-4o-mini), js-tiktoken
*   **Scraping:** Custom Crawler (Puppeteer/Playwright)
*   **Vector DB:** Neon pgvector

## 📦 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/onescript.git
    cd onescript
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file with the following:
    ```env
    DATABASE_URL=postgres://... (Neon Connection String)
    OPENAI_API_KEY=...
    NEXT_PUBLIC_APP_URL=...
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

## 📖 API Documentation

For a detailed breakdown of the API endpoints powering the dashboard and widget, please refer to [API_DESIGN.md](./API_DESIGN.md).
