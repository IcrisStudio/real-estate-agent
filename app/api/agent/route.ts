import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Extend the Window interface for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

interface PropertyData {
  title: string;
  price: string;
  address: string;
  url: string;
  details?: any;
  calculatedProfit?: number;
  arv?: number;
  repairs?: number;
  mov?: number;
}

export async function POST(req: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured. Please set it in your environment variables.' },
        { status: 500 }
      );
    }

    const { query } = await req.json();

    // Step 1: Analyze query
    const analysisPrompt = `Analyze the following query and determine if it's a property search request or a normal conversation. 
    Query: "${query}"
    
    Respond in JSON format:
    {
      "type": "search" | "conversation",
      "isPropertySearch": true/false,
      "reasoning": "brief explanation"
    }`;

    const analysisResponse = await groqClient.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content: analysisPrompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(analysisResponse.choices[0].message.content || '{}');

    if (!analysis.isPropertySearch && analysis.type === 'conversation') {
      // Normal conversation response
      const response = await groqClient.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: "You are Jarvis, an advanced AI real estate assistant. Provide helpful, concise responses about real estate."
          },
          { role: "user", content: query }
        ],
        temperature: 1,
        max_completion_tokens: 8192,
        stream: false,
      });

      return NextResponse.json({
        type: 'conversation',
        response: response.choices[0].message.content,
        status: 'completed'
      });
    }

    // Property search workflow
    // Step 2: Generate query variations
    const variationsPrompt = `Generate 8-10 different search query variations for finding properties based on this request: "${query}"
    
    Create variations like:
    - [property type] in [location]
    - [property type] for sale in [location]
    - [property type] listings [location]
    - etc.
    
    Return a JSON object with a "queries" array: {"queries": ["query1", "query2", ...]}`;

    const variationsResponse = await groqClient.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates search queries. Always respond with valid JSON only."
        },
        { role: "user", content: variationsPrompt }
      ],
      temperature: 1,
      response_format: { type: "json_object" }
    });

    let variationsData: any = {};
    try {
      const content = variationsResponse.choices[0].message.content || '{}';
      // Clean up any markdown formatting
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      variationsData = JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Error parsing variations:', error);
      // Fallback: create variations manually
      const locationMatch = query.match(/(?:in|at|near)\s+([A-Za-z\s,]+)/i)?.[1] || 'Los Angeles';
      variationsData = {
        queries: [
          `condos in ${locationMatch}`,
          `apartments in ${locationMatch}`,
          `houses for sale in ${locationMatch}`,
          `townhouses in ${locationMatch}`,
          `luxury homes in ${locationMatch}`,
          `investment properties in ${locationMatch}`,
          `real estate listings in ${locationMatch}`,
          `properties for sale in ${locationMatch}`
        ]
      };
    }
    const queries = variationsData.queries || [query];

    // Step 3: Search for websites
    const searchResults: string[] = [];
    const realEstateSites = [
      'zillow.com',
      'realtor.com',
      'redfin.com',
      'trulia.com',
      'homes.com',
      'apartments.com',
      'rent.com',
      'apartmentfinder.com'
    ];

    for (const searchQuery of queries.slice(0, 6)) {
      try {
        // Try DuckDuckGo HTML search
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery + ' real estate listings')}`;
        const searchRes = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          timeout: 10000
        });
        const $search = cheerio.load(searchRes.data);
        
        // Extract links from search results
        $search('a.result__a').each((i, elem) => {
          if (searchResults.length >= 20) return false;
          const href = $search(elem).attr('href');
          if (href) {
            try {
              const url = new URL(href);
              if (realEstateSites.some(site => url.hostname.includes(site))) {
                searchResults.push(url.href);
              }
            } catch (e) {
              // Invalid URL, skip
            }
          }
        });
      } catch (error) {
        console.error('Search error:', error);
        // Fallback: construct direct search URLs for known sites
        if (searchResults.length === 0) {
          const location = searchQuery.match(/(?:in|at|near)\s+([A-Za-z\s,]+)/i)?.[1] || 'Los Angeles';
          searchResults.push(
            `https://www.zillow.com/homes/${encodeURIComponent(location)}_rb/`,
            `https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(location)}`,
            `https://www.redfin.com/city/${encodeURIComponent(location)}`
          );
        }
      }
    }

    // Step 4: Scrape property data
    const properties: PropertyData[] = [];
    const uniqueUrls = [...new Set(searchResults)].slice(0, 10);

    for (const url of uniqueUrls) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
          },
          timeout: 15000
        });

        const $ = cheerio.load(response.data);
        
        // Try multiple selectors for different real estate sites
        const selectors = [
          '[data-testid*="property"]',
          '[data-testid*="listing"]',
          '.property-card',
          '.property-tile',
          '.listing-card',
          '.search-result',
          '.PropertyCard',
          '.srp-item'
        ];

        selectors.forEach(selector => {
          $(selector).each((i, elem) => {
            if (properties.length >= 20) return false;
            
            // Try various selectors for address/title
            const titleSelectors = [
              '[data-testid*="address"]',
              '[data-testid*="property-address"]',
              '.property-address',
              '.property-address-full',
              'h2 a',
              'h3 a',
              '.address',
              'a[data-rf-test-id="property-link"]'
            ];
            
            let title = '';
            for (const sel of titleSelectors) {
              title = $(elem).find(sel).first().text().trim();
              if (title) break;
            }
            
            // Try various selectors for price
            const priceSelectors = [
              '[data-testid*="price"]',
              '.property-price',
              '.price',
              '.PropertyCard__price',
              '.srp-item-price'
            ];
            
            let priceText = '';
            for (const sel of priceSelectors) {
              priceText = $(elem).find(sel).first().text().trim();
              if (priceText) break;
            }
            
            const price = priceText.replace(/[^0-9]/g, '');
            
            // Get link
            const link = $(elem).find('a').first().attr('href') || '';
            let fullUrl = url;
            if (link) {
              try {
                fullUrl = link.startsWith('http') ? link : new URL(link, url).href;
              } catch (e) {
                fullUrl = url;
              }
            }

            if (title && price && price.length > 4) {
              // Avoid duplicates
              const isDuplicate = properties.some(p => 
                p.title.toLowerCase() === title.toLowerCase() || 
                p.url === fullUrl
              );
              
              if (!isDuplicate) {
                properties.push({
                  title: title.substring(0, 100),
                  price: price,
                  address: title,
                  url: fullUrl
                });
              }
            }
          });
        });

        // If no properties found, create a placeholder for the search URL
        if (properties.length === 0 && uniqueUrls.length > 0) {
          properties.push({
            title: `Properties in ${query.match(/(?:in|at|near)\s+([A-Za-z\s,]+)/i)?.[1] || 'your area'}`,
            price: '0',
            address: url,
            url: url
          });
        }
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
      }
    }

    // Step 5: Analyze properties with AI for detailed info
    const analyzedProperties: PropertyData[] = [];
    for (const property of properties.slice(0, 10)) {
      try {
        const priceNum = parseInt(property.price.replace(/[^0-9]/g, '')) || 0;
        
        const analysisPrompt = `You are a real estate investment expert. Analyze this property:

        Property Details: ${property.title}
        Listed Price: $${priceNum.toLocaleString()}
        Location: ${property.address || 'Unknown'}
        
        For a property investment analysis, provide realistic estimates:
        1. ARV (After Repair Value) - What the property could sell for after renovations
        2. Estimated Repair Costs - Typical renovation costs needed
        3. MOV (Market Operating Value) - 3% of ARV (standard real estate agent commission)
        4. Additional Costs - Closing costs (2-3% of purchase), holding costs, etc.
        5. Total Profit Calculation - ARV minus (Purchase Price + Repairs + MOV + Additional Costs)
        
        Use realistic market data. For properties in good condition, repairs might be 5-10% of price.
        For fixer-uppers, repairs could be 20-40% of price.
        
        Return ONLY valid JSON (no markdown, no code blocks):
        {
          "arv": number (estimated after repair value),
          "repairs": number (estimated repair costs),
          "mov": number (3% of ARV),
          "additionalCosts": number (closing, holding, etc - roughly 3-5% of purchase),
          "profit": number (calculated profit: arv - price - repairs - mov - additionalCosts),
          "analysis": "One sentence explaining the investment potential"
        }`;

        const propAnalysis = await groqClient.chat.completions.create({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content: "You are a real estate investment analyst. Always respond with valid JSON only, no markdown formatting."
            },
            { role: "user", content: analysisPrompt }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        });

        let analysisText = propAnalysis.choices[0].message.content || '{}';
        // Clean up JSON if it has markdown formatting
        analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const analysis = JSON.parse(analysisText);
        
        // Ensure all values are numbers
        const arv = typeof analysis.arv === 'number' ? analysis.arv : parseInt(analysis.arv) || 0;
        const repairs = typeof analysis.repairs === 'number' ? analysis.repairs : parseInt(analysis.repairs) || 0;
        const mov = typeof analysis.mov === 'number' ? analysis.mov : parseInt(analysis.mov) || arv * 0.03;
        const additionalCosts = typeof analysis.additionalCosts === 'number' ? analysis.additionalCosts : parseInt(analysis.additionalCosts) || priceNum * 0.04;
        
        // Calculate profit
        const profit = arv - priceNum - repairs - mov - additionalCosts;
        
        analyzedProperties.push({
          ...property,
          arv: arv,
          repairs: repairs,
          mov: mov,
          calculatedProfit: profit,
          details: {
            ...analysis,
            purchasePrice: priceNum,
            additionalCosts: additionalCosts
          }
        });
      } catch (error) {
        console.error('Property analysis error:', error);
        // Fallback: basic calculation
        const priceNum = parseInt(property.price.replace(/[^0-9]/g, '')) || 0;
        const estimatedARV = priceNum * 1.2; // 20% increase assumption
        const estimatedRepairs = priceNum * 0.1; // 10% repairs
        const mov = estimatedARV * 0.03;
        const additionalCosts = priceNum * 0.04;
        const profit = estimatedARV - priceNum - estimatedRepairs - mov - additionalCosts;
        
        analyzedProperties.push({
          ...property,
          arv: estimatedARV,
          repairs: estimatedRepairs,
          mov: mov,
          calculatedProfit: profit,
          details: { analysis: 'Estimated calculation' }
        });
      }
    }

    // Step 6: Filter properties with $15k+ profit
    const profitableProperties = analyzedProperties
      .filter(p => (p.calculatedProfit || 0) >= 15000)
      .sort((a, b) => (b.calculatedProfit || 0) - (a.calculatedProfit || 0));

    // Step 7: Generate response
    const responsePrompt = `Based on the property search for "${query}", I found ${profitableProperties.length} properties that meet the $15,000 profit requirement.

    Properties:
    ${profitableProperties.map((p, i) => `${i + 1}. ${p.title} - Price: $${p.price} - Estimated Profit: $${p.calculatedProfit}`).join('\n')}
    
    Provide a natural, conversational response as Jarvis explaining these findings. Ask if the user wants to open the property links.`;

    const finalResponse = await groqClient.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: "You are Jarvis, an advanced AI assistant. Be concise, helpful, and natural."
        },
        { role: "user", content: responsePrompt }
      ],
      temperature: 1,
      max_completion_tokens: 8192,
      stream: false,
    });

    return NextResponse.json({
      type: 'search',
      response: finalResponse.choices[0].message.content,
      properties: profitableProperties,
      status: 'completed',
      query: query
    });

  } catch (error: any) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}