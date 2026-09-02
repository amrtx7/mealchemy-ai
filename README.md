# 🍳 Mealchemy AI

> **Transforming dietary preferences into intelligent meal plans, optimized grocery lists, and live quick-commerce store price comparisons.**

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
![React](https://img.shields.io/badge/React-18.3-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7.1-646CFF.svg)
![Express](https://img.shields.io/badge/Express-5.2-000000.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-8.18-47A248.svg)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)
![Gemini AI](https://img.shields.io/badge/AI-Gemini%202.0%20Flash%20%7C%20OpenAI-orange.svg)
![License](https://img.shields.io/badge/License-ISC-yellow.svg)

---

## 📖 Table of Contents

- [About The App](#-about-the-app)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#-running-the-application)
- [Usage Guide](#-usage-guide)
- [API Endpoints](#-api-endpoints)
- [Live Store Lookup Engine](#-live-store-lookup-engine)
- [License](#-license)

---

## 🌟 About The App

**Mealchemy AI** is a full-stack, AI-driven meal planning and grocery cart optimization platform designed to eliminate the friction between planning healthy meals and buying groceries on a budget. 

Standard meal apps provide recipes, but leave users with manual arithmetic to calculate exact grocery needs, ingredient costs, and store availability. **Mealchemy AI** bridges this gap by combining LLM-powered dietary intelligence with real-time quick-commerce store scraping (Blinkit, Instamart, Zepto, JioMart, BigBasket) localized to your pincode.

Whether you are targeting high-protein goals, managing strict dietary constraints (keto, vegan, gluten-free), or adhering to a strict weekly budget, Mealchemy AI tailors every recipe, computes consolidated ingredient shopping carts, deduplicates pantry items, and evaluates real store prices instantly.

---

## ✨ Key Features

- 🧠 **AI-Powered Meal Generation**: Multi-provider support (Google Gemini 2.0 Flash, OpenAI, or OpenAI-Compatible gateways) with structured Zod schema parsing for reliable, step-by-step recipe generation.
- 🎯 **Nutritional & Macro Targeting**: Custom calorie targets, macro breakdowns (carbs, protein, fat), dietary filters, meal counts (breakfast, lunch, dinner, snacks), and serving sizes.
- 🛒 **Smart Grocery Aggregation & Deduplication**: Automatically parses raw ingredient quantities across multiple meals, standardizes units (g, kg, ml, pieces), and subtracts on-hand pantry items.
- ⚡ **Live Store Price Lookup Bridge**: Built-in Selenium & Playwright web scraping engine that queries local quick-commerce platforms for live price and inventory verification using your local pincode.
- 💰 **Budget Optimization**: Calculates store-by-store cost distribution to find the cheapest cart combination across platforms.
- 🔐 **Secure Auth & User Profiles**: Full JWT authentication (access & refresh tokens) with encrypted passwords (bcryptjs) and saved user preferences.
- 📜 **Historical Plan Storage**: Save, review, and revisit past generated meal plans and shopping lists directly from your user dashboard.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 18 with Vite build system
- **Routing**: React Router v6
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **HTTP Client**: Axios

### **Backend**
- **Runtime**: Node.js (ES Modules)
- **Web Framework**: Express.js (v5)
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Zod schema validation
- **Auth**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`

### **AI & Automation**
- **AI Providers**: `@google/generative-ai` (Gemini 2.0 Flash) & OpenAI API
- **Automation / Scraping**: Playwright & Selenium Webdriver

---

## 📁 Project Architecture

```text
mealchemy-ai/
├── backend/
│   ├── config/             # DB connection & environment settings
│   ├── controllers/        # Meal planning & auth controllers
│   ├── data/               # Static dataset fallbacks & mock store data
│   ├── middleware/         # Auth verification & error handling middleware
│   ├── models/             # Mongoose schemas (User, MealPlan)
│   ├── routes/             # Express API route endpoints
│   ├── scrapers/           # Playwright & Selenium store scrapers
│   ├── scripts/            # Database seeding scripts (`seed.js`)
│   ├── services/           # Core domain logic (AI, Pricing, Optimization, Live Pricing)
│   ├── validation/         # Zod schemas for AI response validation
│   └── server.js           # Express app entry point
│
├── frontend/
│   ├── public/             # Static public assets
│   ├── src/
│   │   ├── api/            # Axios API instances & service calls
│   │   ├── components/     # UI Components (Navbar, Cards, Modals)
│   │   ├── context/        # React Context (Auth, Theme)
│   │   ├── pages/          # Application views (Home, Dashboard, Cart, LiveCheck, Profile)
│   │   ├── App.jsx         # Routes & Layout wrapper
│   │   ├── index.css       # Tailwind CSS directives
│   │   └── main.jsx        # React entry point
│   ├── package.json
│   └── vite.config.js
│
├── .env.example            # Master environment template
├── package.json            # Root scripts & backend dependencies
└── README.md               # Documentation
```

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB**: A running local MongoDB instance (`mongodb://localhost:27017`) or a MongoDB Atlas connection string.
- **AI API Key**: A valid API key from [Google AI Studio](https://aistudio.google.com/) (for Gemini) or [OpenAI Platform](https://platform.openai.com/).

---

## 🚀 Installation & Setup

1. **Clone the repository** (or navigate to project directory):
   ```bash
   cd d:/dev/mealchemy-ai
   ```

2. **Install all dependencies** (Backend and Frontend):
   ```bash
   npm run install:all
   ```
   *This command installs root dependencies as well as frontend npm packages in one step.*

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your preferred configuration:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ai-meal-planner
JWT_SECRET=your-super-secret-access-token-key
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key

# AI Provider Configuration
AI_PROVIDER=gemini           # Options: gemini | openai | openai-compatible
AI_API_KEY=your-gemini-api-key-here
AI_MODEL=gemini-2.0-flash

# Optional Live Store Scraper Settings
LIVE_STORE_MODE=selenium     # Options: selenium | playwright
LIVE_STORE_PINCODE=201301
LIVE_STORE_HEADLESS=true
```

---

## 🗄️ Database Seeding

To seed the database with a pre-configured demo user and sample meal plan:

```bash
npm run seed
```

**Demo Account Credentials:**
- **Email:** `demo@meal.app`
- **Password:** `password123`

---

## 🏃 Running the Application

### Option A: Running Backend and Frontend Separately

1. **Start the Backend API Server (with auto-reload):**
   ```bash
   npm run dev
   ```
   The backend server runs on `http://localhost:5000`.

2. **Start the Frontend Dev Server:**
   ```bash
   npm run client
   ```
   The Vite frontend will open at `http://localhost:5173`.

### Option B: Quick Commands Overview

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Express server using `nodemon` |
| `npm run server` | Starts the Express server with standard `node` |
| `npm run client` | Starts the Vite React frontend client |
| `npm run seed` | Seeds default demo user and initial meal plan data |
| `npm run install:all` | Installs root/backend and frontend dependencies |

---

## 💻 Usage Guide

### 1. Account Setup & Authentication
- Launch the application at `http://localhost:5173`.
- Sign up for a new account or sign in using demo credentials (`demo@meal.app` / `password123`).

### 2. Generating a Meal Plan
- Head to the **Dashboard / Planner** page.
- Enter your meal prompt (e.g., *"High protein vegetarian diet under ₹500/day for 2 people"*).
- Specify optional constraints: Target Calories, Macros ratio, Dietary Type (Keto, Vegan, Paleo, Vegetarian), and Servings.
- Click **Generate Plan** — Mealchemy AI will process the prompt through Gemini/OpenAI, return structured recipes, prep steps, and a consolidated shopping cart.

### 3. Shopping Cart & Pantry Deduplication
- Navigate to the **Cart** view.
- Review consolidated ingredient quantities scaled for your chosen plan duration.
- Mark items you already have in your pantry to recalculate net shopping list cost.

### 4. Live Store Pricing & Pincode Lookup
- Open the **Live Check** feature.
- Input your local pincode to trigger automated store availability checking via Playwright/Selenium scrapers.
- View price breakdowns across available delivery platforms.

---

## 🔌 API Endpoints

### **Authentication (`/api/auth`)**
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new user | Public |
| `POST` | `/api/auth/login` | Authenticate user & receive tokens | Public |
| `GET` | `/api/auth/me` | Fetch active user profile | Private |
| `POST` | `/api/auth/refresh` | Refresh access token | Public |

### **Meal Planning (`/api`)**
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/meals/generate` | Generate AI meal plan & cart | Private |
| `GET` | `/api/meals/history` | Retrieve user's saved meal plans | Private |
| `GET` | `/api/meals/:id` | Fetch specific meal plan details | Private |
| `DELETE` | `/api/meals/:id` | Delete saved meal plan | Private |

### **Debug & Live Store (`/api/debug`)**
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/debug/live-check` | Execute live scraper pricing check | Dev Mode |

---

## 🧪 Live Store Lookup Engine

Mealchemy AI includes an experimental live store price bridge located in `backend/scrapers/` and `backend/services/livePricingService.js`.

- **Supported Scrapers**: Selenium WebDriver & Playwright browser automation.
- **Pincode Localization**: Dynamically updates store delivery location based on input pincodes.
- **Failover / Fallback System**: If live scraping is disabled or headless browser instances are blocked, the service gracefully falls back to normalized regional price datasets (`backend/data/`).

---

## 📜 License

This project is licensed under the [ISC License](LICENSE).

---

<p center="align">
  Crafted with ❤️ by the <strong>Mealchemy AI Team</strong>
</p>
