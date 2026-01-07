
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { MarketplaceListing, GroundingSource } from "../types.ts";

function extractJsonFromText(text: string): any {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("The AI response did not contain a valid JSON object.");
  }
  
  const jsonString = text.substring(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("JSON Parse Error:", jsonString);
    throw new Error("The AI provided malformed data. Please try again.");
  }
}

export const analyzeItemWithGemini = async (
  base64Image: string,
  suburb: string,
  onStatusUpdate: (status: string) => void
): Promise<{ listing: MarketplaceListing; sources: GroundingSource [] }> => {
  
  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
    throw new Error("API Key is missing. Please ensure the environment variable API_KEY is configured in your Hostinger dashboard.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  onStatusUpdate("Researching eBay, Gumtree & Cash Converters...");

  const prompt = `
    Role: You are an expert reseller assistant for Facebook Marketplace in Melbourne, Australia.
    
    CRITICAL CHECK:
    First, analyze if the image is clear enough to identify the brand, model, and condition. 
    If it is too blurry, dark, or low-resolution, set "is_unclear": true and "unclear_message": "A polite request for a higher resolution or better-lit photo because specific details couldn't be seen."
    
    If clear, proceed with:
    1. Identify item, brand, model, and condition.
    2. MANDATORY MARKET RESEARCH: You MUST search Gumtree AU, Cash Converters AU, and eBay AU (Sold listings). 
    3. For each of those three (Gumtree, Cash Converters, eBay), determine if stock currently exists or has sold recently.
    4. MANDATORY LABELING: If no items matching the description exist on that platform, you MUST use the label "No Stock". Otherwise, use "In Stock" or "Recent Sales".
    5. Find the current New RRP at major Australian retailers (Bunnings, JB Hi-Fi, Kmart, etc.).
    6. Generate 5-10 SEO keywords.
    7. Create 'Standard' and 'Quick Sell' listings.
    
    DESCRIPTION REQUIREMENTS:
    - Include 1-2 lines explaining why this is a useful product.
    - Provide TWO specific examples of how you used it to improve productivity or get a task done effortlessly (be creative based on the item type).
    - MANDATORY ENDING: "Cash only & will only meet in a public place."
    - Natural integration of keywords.
    
    Location: ${suburb}, Melbourne.
    
    JSON Schema:
    {
      "is_unclear": false,
      "unclear_message": "",
      "suggested_title": "Title with keywords",
      "estimated_price_range": "$X - $Y AUD",
      "suggested_list_price": "$Z AUD",
      "quick_sell_price": "$Q AUD",
      "new_price": "$N AUD (Retail Price)",
      "market_stock_status": {
        "ebay": "In Stock / No Stock / Recent Sales",
        "gumtree": "In Stock / No Stock",
        "cash_converters": "In Stock / No Stock"
      },
      "description": "Utility lines... Productivity examples... Details... Cash only & will only meet in a public place.",
      "description_quick_sell": "Value focused... Priced to sell quickly!... Utility/Productivity... Cash only & will only meet in a public place.",
      "keywords": ["kw1", "kw2", "..."],
      "category_suggestion": "FB Category",
      "comparable_items": ["Reference 1", "Reference 2"]
    }
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image,
    },
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });

    const text = response.text || "";
    const listing: MarketplaceListing = extractJsonFromText(text);

    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return { listing, sources };
  } catch (error: any) {
    console.error("Gemini Assistant Error:", error);
    const errorMessage = error.message || "";
    
    if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota")) {
      throw new Error("429: Resource Exhausted. This usually means your Google Cloud project has hit its rate limit (Requests Per Minute). If you are on a paid plan, please verify that your Billing Account is 'Active' and not 'Closed' or 'Past Due' in the Google Cloud Console.");
    }
    
    throw new Error(errorMessage || "An unexpected error occurred while contacting Google AI.");
  }
};
