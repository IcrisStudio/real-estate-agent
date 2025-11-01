# Jarvis Real Estate AI Agent

A futuristic, AI-powered real estate assistant with voice mode, built with Next.js, Groq AI, and Framer Motion. This application provides a Jarvis-like interface for searching properties, analyzing investment opportunities, and calculating real estate metrics.

## Features

- 🎙️ **Voice Recognition**: Speak your queries naturally using the Web Speech API
- 🔊 **Text-to-Speech**: AI responses are spoken back to you
- 🎨 **Futuristic UI**: Sci-fi inspired interface with glowing animations
- 🤖 **AI-Powered Analysis**: Uses Groq AI to analyze queries and properties
- 📊 **Real Estate Calculations**: 
  - ARV (After Repair Value)
  - Repair cost estimates
  - MOV (Market Operating Value)
  - Profit calculations
  - Property filtering ($15k+ profit threshold)
- 🌐 **Web Scraping**: Automatically searches and scrapes property listings
- 🔍 **Smart Query Processing**: Breaks down searches into multiple variations for comprehensive results

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Groq API key (included in code, or set as environment variable)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd scott-real-estate-agent
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional - API key is already in code):
Create a `.env.local` file:
```
GROQ_API_KEY=your_groq_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Voice Mode

1. Click the microphone button at the bottom
2. Speak your query (e.g., "Find me properties in Los Angeles")
3. The circular animation indicates listening/processing
4. Watch status updates as the AI processes your request
5. Review properties and their profit calculations
6. Say "yes" or "open" to view property links in new tabs

### Text Input

- Type your query in the input field
- Press Enter to submit
- The AI will process and respond

### Example Queries

- "Find me some properties in Los Angeles"
- "Show me condos in Miami"
- "What are good investment properties in Dallas?"
- "Find apartments in Seattle with good profit potential"

## How It Works

1. **Query Analysis**: The AI determines if your query is a property search or conversation
2. **Query Variation**: Generates 8-10 search query variations
3. **Web Search**: Searches for property listings across multiple real estate websites
4. **Data Scraping**: Extracts property details from listing pages
5. **AI Analysis**: Analyzes each property for investment potential
6. **Calculation**: Computes ARV, repairs, MOV, and profit
7. **Filtering**: Shows only properties with $15,000+ profit potential
8. **Response**: Provides natural language response with property details

## Technology Stack

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type safety
- **Groq AI**: Fast inference for AI agent logic
- **Framer Motion**: Smooth animations
- **React Icons**: Icon library
- **Cheerio**: HTML parsing for web scraping
- **Axios**: HTTP client
- **Tailwind CSS**: Styling
- **Web Speech API**: Voice recognition

## Project Structure

```
scott-real-estate-agent/
├── app/
│   ├── api/
│   │   └── agent/
│   │       └── route.ts        # AI agent API endpoint
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main page
├── components/
│   ├── JarvisAgent.tsx         # Main UI component
│   ├── CircularAnimation.tsx   # Animated circular indicator
│   └── StatusText.tsx          # Status update component
├── lib/
│   └── utils.ts                # Utility functions
└── types/
    └── speech.d.ts             # TypeScript definitions
```

## API Endpoints

### POST `/api/agent`

Processes queries and returns property analysis.

**Request:**
```json
{
  "query": "Find me properties in Los Angeles"
}
```

**Response:**
```json
{
  "type": "search",
  "response": "I found X properties...",
  "properties": [...],
  "status": "completed"
}
```

## Customization

### Profit Threshold

Change the minimum profit threshold in `app/api/agent/route.ts`:
```typescript
const profitableProperties = analyzedProperties
  .filter(p => (p.calculatedProfit || 0) >= 15000) // Change this value
```

### Status Messages

Modify status messages in `components/JarvisAgent.tsx`:
```typescript
const statuses = [
  'Analyzing query...',
  'Crafting search queries...',
  // Add your custom statuses
];
```

## Notes

- Web scraping may be limited by website robots.txt and rate limiting
- Some real estate sites may require JavaScript rendering (consider using Playwright for more complex sites)
- Voice recognition requires HTTPS in production or localhost for development
- The TTS API is hosted at `icrisstudio1.pythonanywhere.com`

## License

Private project - All rights reserved

## Support

For issues or questions, please contact the development team.