
import { GoogleGenAI, Type } from "@google/genai";
import type { PriceData, Timeframe, GroundingSource, MarketReport } from '../types';
import { TARGET_COUNTRIES, VEGETABLE_OILS } from '../constants';
import { generatePriceData } from './mockPriceService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const isRegionalError = (error: any): boolean => {
  const msg = error?.message || "";
  return msg.includes("Region not supported") || msg.includes("403");
};

export const fetchRealtimePriceData = async (timeframe: Timeframe): Promise<{ data: PriceData[], sources: GroundingSource[], isFallback: boolean }> => {
  const prompt = `Fetch a historical time series of daily OHLC (Open, High, Low, Close) price data for Crude Palm Oil (FCPO) futures on Bursa Malaysia for the past ${timeframe}. 
  IMPORTANT: You MUST provide at least 30 historical data points representing the trend over this period. 
  If hourly data is available for 1D, provide at least 24 points. 
  Return as JSON: { "prices": [{ "date": "YYYY-MM-DDTHH:mm:ssZ", "open": number, "high": number, "low": number, "close": number }] }. 
  Currency: MYR. Ensure dates are in chronological order.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  open: { type: Type.NUMBER },
                  high: { type: Type.NUMBER },
                  low: { type: Type.NUMBER },
                  close: { type: Type.NUMBER },
                },
                required: ["date", "open", "high", "low", "close"],
              },
            },
          },
          required: ["prices"],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{"prices": []}');
    const sources: GroundingSource[] = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
      .filter((c: any) => c.web)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));

    if (!parsed.prices || parsed.prices.length < 2) {
      throw new Error("Insufficient data points returned from AI");
    }

    return { 
      data: parsed.prices.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      sources,
      isFallback: false
    };
  } catch (error) {
    console.warn("Primary price fetch failed or insufficient data, attempting fallback...", error);
    
    if (isRegionalError(error) || error.message === "Insufficient data points returned from AI") {
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt + " Note: Provide an estimated historical trend of at least 20 points based on your latest internal knowledge.",
          config: {
            responseMimeType: "application/json",
          },
        });
        const parsed = JSON.parse(fallbackResponse.text || '{"prices": []}');
        if (parsed.prices && parsed.prices.length >= 2) {
          return { data: parsed.prices.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()), sources: [], isFallback: true };
        }
      } catch (innerError) {
        console.error("Secondary fallback failed:", innerError);
      }
    }

    const mockData = await generatePriceData(timeframe);
    return { data: mockData, sources: [], isFallback: true };
  }
};

export const fetchWeeklyMarketReport = async (): Promise<{ report: MarketReport, sources: GroundingSource[], isFallback: boolean }> => {
  const prompt = `Generate a detailed weekly analytical report for the vegetable oils and fats market for the CURRENT week.
  Scope Countries (Focus on regulatory news here): ${TARGET_COUNTRIES.join(', ')}.
  Commodities: ${VEGETABLE_OILS.join(', ')}.

  Requirements:
  1. For EACH commodity, find exactly ONE top current news headline and summary.
  2. Identify key regulatory & policy updates specifically in the listed target countries.
  3. Provide structured info on price trends, production volumes, and trade flows.
  4. For the trade flows table, for each entry, clarify whether the volume represents Export, Import, or Processing data.
  5. Format as valid JSON matching the schema provided.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      topNews: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            commodity: { type: Type.STRING },
            headline: { type: Type.STRING },
            content: { type: Type.STRING }
          },
          required: ["commodity", "headline", "content"]
        }
      },
      priceTrends: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            commodity: { type: Type.STRING },
            trend: { type: Type.STRING },
            details: { type: Type.STRING },
          },
          required: ["commodity", "trend", "details"],
        },
      },
      regionalHighlights: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            region: { type: Type.STRING },
            events: { type: Type.STRING },
          },
          required: ["region", "events"],
        },
      },
      tradeTable: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            country: { type: Type.STRING },
            commodity: { type: Type.STRING },
            volume: { type: Type.STRING },
            volumeType: { type: Type.STRING, description: "Export, Import, or Processing" },
            status: { type: Type.STRING },
          },
          required: ["country", "commodity", "volume", "volumeType", "status"],
        },
      },
      policyUpdates: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            country: { type: Type.STRING },
            update: { type: Type.STRING }
          },
          required: ["country", "update"]
        }
      },
    },
    required: ["summary", "topNews", "priceTrends", "regionalHighlights", "tradeTable", "policyUpdates"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const report = JSON.parse(response.text || '{}') as MarketReport;
    const sources: GroundingSource[] = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
      .filter((c: any) => c.web)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));

    return { report, sources, isFallback: false };
  } catch (error) {
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt + " Use internal knowledge for a representative report.",
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });
      return { report: JSON.parse(fallbackResponse.text || '{}'), sources: [], isFallback: true };
    } catch (innerError) {
      return { 
        report: {
          summary: "Market analysis temporarily limited.",
          topNews: [],
          priceTrends: [],
          regionalHighlights: [],
          tradeTable: [],
          policyUpdates: []
        }, 
        sources: [], 
        isFallback: true 
      };
    }
  }
};
