# BrandLens (Commerce & Market Intelligence)

> **Commercial Anomaly & Brand-Risk Scanner for Indian D2C Brands**  
> Built for the SerpApi India Hackathon 2026.

BrandLens helps Indian direct-to-consumer (D2C) brands monitor marketplace listings across Flipkart, Amazon.in, and the open web. It cross-references live marketplace listings (`google_shopping`), performs reverse-image verification via Google Lens (`google_lens`), and evaluates seller metadata to identify suspect listings, unauthorized distributors, and listing anomalies.

---

## SerpApi Setup

### 1. Configure Environment Variables

Create a local `.env` file from the example template:

```bash
cp .env.example .env
```

Add your SerpApi API key:

```env
SERPAPI_API_KEY=your_key_here
```

> [!IMPORTANT]
> - **Never commit `.env`**: `.env` and `.dev.vars` are gitignored to ensure API keys are never checked into version control.
> - **Server-side only**: The SerpApi API key is strictly accessed in server-side worker bindings or backend Node runtime. It is never bundled into or accessible by client-side browser JavaScript.
> - **Backwards compatibility**: Both `SERPAPI_API_KEY` and legacy `SERPAPI_KEY` are supported through the centralized config layer (`src/lib/config.ts`).

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

Start the Cloudflare Workers development server:

```bash
npm run dev
```

Visit `http://localhost:8787` in your browser to access the interactive BrandLens UI.

### 4. Running Tests

#### Unit Tests (Zero Live Credits)
Standard unit tests run entirely against local fixture data and **never** consume live SerpApi credits:

```bash
npm test
```

#### Controlled Live Smoke Test (Opt-in)
To verify your real SerpApi key with a single, controlled query that validates authentication, schema parsing, and entity normalization:

```bash
npm run serpapi:smoke
```

Or via Vitest:

```bash
npm run test:live
```

---

## Architecture & Credit Budget

- **Backend Runtime**: Cloudflare Workers (Hono framework) with TypeScript.
- **Engines Used**:
  - `google_shopping`: 1 call per scan to discover marketplace listings.
  - `google_lens`: Reverse image search against official product photos (capped to top 10 candidates per scan to strictly respect the 250/month free tier budget).
- **Signal Fusion**: Deterministic weighting of Price Anomaly, Seller Anomaly, and Visual Signal into a 0-100 Confidence Risk Score.
- **Frontend**: Clean Tailwind CSS + Vanilla JS interface with side-by-side visual photo comparison and "Load Demo Example" capability.

---

## Production Deployment (Cloudflare Workers)

To configure production secrets in Cloudflare Workers without committing credentials:

```bash
npx wrangler secret put SERPAPI_API_KEY
```

Then deploy:

```bash
npm run deploy
```
