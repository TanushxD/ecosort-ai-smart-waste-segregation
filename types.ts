
export type WasteCategory = 'Organic' | 'Recyclable' | 'Hazardous' | 'E-Waste' | 'General' | 'Unknown';

export interface WasteAnalysis {
  item: string;
  category: WasteCategory;
  confidence: number;
  disposalInstructions: string;
  preparationSteps: string[];
  localRegulationsSummary: string;
  sustainabilityTip: string;
  environmentalImpact: string;
}

export interface RecyclingCenter {
  name: string;
  address: string;
  url: string;
  distance?: string;
}

export interface WasteRecord {
  id: string;
  timestamp: number;
  item: string;
  category: WasteCategory;
}
