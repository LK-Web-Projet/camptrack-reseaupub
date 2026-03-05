# Client-Ready Campaign Performance Report Generation Plan

## Goal Description
Develop a high-quality, automated PDF document generation pipeline within the Next.js application. This pipeline will extract real-time campaign data, aggregate KPIs, pull visual evidence, and format it into a stunning, professional, and client-ready report suitable for external distribution.

## 1. Output Format & Technology Choice
Given the current Next.js (App Router) stack and the need for pixel-perfect, highly styled "client-ready" PDFs with dynamic images, we recommend introducing **React-PDF (`@react-pdf/renderer`)**.
- **Alternative**: Using **Puppeteer/Playwright** to screenshot a Next.js rendered HTML page (requires heavier infrastructure on Vercel via `@sparticuz/chromium`).
- **Recommendation**: `@react-pdf/renderer` offers declarative, deeply customizable Next.js support specifically designed for generating stable PDF documents without headless browser overhead. It handles external images seamlessly and supports custom typography.

## 2. Structure & Content Assembly

The document will be structured into distinct, logically flowing sections:

### 2.1 Front Cover & Campaign Overview
- **Visuals**: Primary brand logo at the top (centered or left-aligned).
- **Metadata**: 
  - Campaign Name / Title (Prominent, Header 1).
  - Client Name and Generation Date.
- **Overview Section**:
  - **Objectives**: A brief summary paragraph of the campaign goals.
  - **Duration**: Start Date to End Date.
  - **Target Audience**: Demographic or geographical targeting summary.

### 2.2 Key Performance Indicators (KPIs)
*Rule: Avoid internal jargon. Use clear, universally understood terms.*
- **Display**: A visually distinct "Grid" or "Card" layout.
- **Metrics**: 
  - **Reach / Impressions** (instead of raw volume).
  - **Engagement Rate** or Clicks (depending on the campaign type).
  - **Budget Utilization** / ROI (if applicable).
- *Implementation*: Rendered as distinct aesthetic blocks with dedicated brand-color accents.

### 2.3 Visual Evidence (Execution Proof)
- **Role**: Validates the campaign was executed as planned.
- **Data Source**: Photos/Terminal screenshots stored in Vercel Blob (or AWS S3).
- **Layout**: A curated "Gallery" section. 2-4 images per page max to ensure high quality and visibility.
- *Styling*: Subtle borders or drop shadows on the images (if supported) to make them pop. Captions/timestamps below each image indicating *when* and *where* it was captured.

### 2.4 Execution & Stakeholder Details
- **Purpose**: Accountability and transparency.
- **Content**: 
  - Name and role of the key person/service provider executing the campaign.
  - Contact Information (email).
  - Credential/Registration Reference (ID). 

## 3. Styling & Formatting Preferences

To achieve a "Premium" marketing report feel:
- **Typography**: Import **Inter** or **Roboto** (Google Fonts). Use bold/black weights for massive metric numbers and medium weights for descriptive text.
- **Color Scheme**:
  - **Background**: Pure White `#ffffff` with soft gray alternating row backgrounds `#f8fafc` to separate data points without harsh lines.
  - **Primary Accents**: Deep authoritative Navy (`#0f172a`) or the company's primary branding color.
  - **Secondary Accents**: vibrant blue (`#3b82f6`) or emerald green (`#10b981`) to indicate positive KPI growth.
- **Spacing**: Generous internal padding (margins are crucial for premium feel). Information must never feel cramped.

---

## 4. Step-by-Step Implementation Approach

### Stage 1: Data Extraction API Layer
**Goal**: Consolidate all data points into a single, clean JSON object.
1. Create a server action or API route (e.g., `api/reports/campaign/[id]`).
2. Write a Prisma query to join the `Campaign`, `KPIs/Stats`, `Photos` (Vercel Blob URLs), and `User/Provider` tables.
3. Serialize and sanitize the data (converting Dates to readable format arrays, formatting currency and numbers).

### Stage 2: Template Component Construction
**Goal**: Build the document structure using `@react-pdf/renderer` primitives (`<Document>`, `<Page>`, `<View>`, `<Text>`, `<Image>`).
1. Install `@react-pdf/renderer`.
2. Register the custom fonts (e.g., `Font.register(...)`).
3. Build declarative sub-components to keep the code clean (`<ReportCover />`, `<KpiGrid />`, `<VisualEvidenceGallery />`, `<StakeholderFooter />`).
4. Apply inline styles (React-PDF uses a StyleSheet API similar to React Native) mirroring the Tailwind aesthetic.

### Stage 3: Asset Handling & Image Optimization
**Goal**: Ensure high-quality images render without ballooning the PDF file size.
1. Implement a utility to fetch Remote URLs (Vercel Blob) safely into the `Image` component. 
2. Ensure aspect ratios are maintained. If images are extremely large, process or compress them server-side before embedding them in the PDF.

### Stage 4: Frontend UI Integration & PDF Generation Engine
**Goal**: Allow users to click "Download Report" and receive the PDF seamlessly.
1. Add a primary "Download Client Report" action button to the Campaign Details page (`app/(dashboard)/campaigns/[id]/page.tsx`).
2. Bind the download function. When clicked, invoke the React-PDF `pdf(<MyDocument />).toBlob()` generation.
3. Expose the generated Blob as a downloadable Object URL, triggering the browser's native `<a download>` behavior. Add loading spinners to UI while the document generates.
