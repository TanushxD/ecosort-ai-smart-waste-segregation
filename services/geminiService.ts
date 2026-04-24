
import { GoogleGenAI, Type } from "@google/genai";
import { WasteAnalysis, RecyclingCenter } from "../types";

// Initialize AI client using the mandatory environment variable directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const classifyWaste = async (base64Image: string): Promise<WasteAnalysis> => {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(',')[1],
          },
        },
        {
          text: "Identify the object in this image and classify it into one of these categories: Organic, Recyclable (mention material), Hazardous, E-Waste, or General. Provide disposal instructions, a list of specific preparation steps (e.g., 'rinse bottle', 'remove cap'), and a summary of common local regulations/warnings for this item.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          category: { type: Type.STRING, description: "One of: Organic, Recyclable, Hazardous, E-Waste, General" },
          confidence: { type: Type.NUMBER },
          disposalInstructions: { type: Type.STRING },
          preparationSteps: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Step-by-step preparation for disposal"
          },
          localRegulationsSummary: { type: Type.STRING, description: "Summary of typical laws or warnings" },
          sustainabilityTip: { type: Type.STRING },
          environmentalImpact: { type: Type.STRING },
        },
        required: ["item", "category", "disposalInstructions", "preparationSteps", "sustainabilityTip"],
      },
    },
  });

  try {
    const text = response.text || "{}";
    return JSON.parse(text) as WasteAnalysis;
  } catch (e) {
    console.error("Analysis parsing error:", e, response.text);
    throw new Error("Failed to parse waste analysis data");
  }
};

export const findNearbyRecyclingCenters = async (lat: number, lng: number, wasteType: string): Promise<RecyclingCenter[]> => {
  const model = "gemini-2.5-flash"; 
  
  const prompt = `Find 3 nearby recycling centers for ${wasteType} waste near coordinates ${lat}, ${lng}. Return their names and official map links.`;
  
  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    }
  });

  const centers: RecyclingCenter[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.maps) {
        centers.push({
          name: chunk.maps.title || "Recycling Facility",
          address: "Nearby Location",
          url: chunk.maps.uri
        });
      }
    });
  }

  if (centers.length === 0) {
    return [
      { 
        name: "Local Recycling Search", 
        address: "Search results for " + wasteType, 
        url: `https://www.google.com/maps/search/recycling+center+${encodeURIComponent(wasteType)}` 
      }
    ];
  }

  return centers;
};
