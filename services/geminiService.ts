
import { GoogleGenAI, Type } from "@google/genai";
import { Expense } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeExpenses = async (expenses: Expense[]) => {
  const expenseDataString = JSON.stringify(expenses);
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the following Indonesian expense data (in Rupiah). 
    Source Column Headers: 
    - Tanggal (Date) in Column A
    - Jumlah (Amount) in Column B
    - Kategori (Category) in Column C
    - Pembayaran (Payment Method) in Column D
    
    Provide a detailed summary in English, recommendations for saving, and identify any anomalies. 
    Pay special attention to spending patterns across different categories and payment methods (e.g., if one payment method is being used excessively for small purchases).
    
    Data: ${expenseDataString}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: "A high-level summary of the spending patterns in IDR context.",
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Specific advice to save money in IDR.",
          },
          anomalies: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Any unusual or high-spending items identified.",
          },
        },
        required: ["summary", "recommendations", "anomalies"],
      },
    },
  });

  return JSON.parse(response.text);
};
