import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // For client-side usage
});

export class OpenAIService {
  static async generateBudgetAnalysis(budgetData: any): Promise<string> {
    try {
      if (!openai.apiKey) {
        return "Pour obtenir des analyses IA, veuillez configurer votre clé API OpenAI dans les variables d'environnement.";
      }

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Vous êtes un conseiller financier spécialisé dans la gestion budgétaire des coopératives agricoles. Donnez des conseils précis, professionnels et utiles."
          },
          {
            role: "user",
            content: `Analysez ce budget trimestriel et donnez des conseils d'optimisation en français (maximum 150 mots): ${JSON.stringify(budgetData)}`
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || "Impossible de générer une analyse pour le moment.";
    } catch (error) {
      console.error("Error generating budget analysis:", error);
      return "Une erreur s'est produite lors de la génération de l'analyse. Veuillez réessayer plus tard.";
    }
  }

  static async generateInvestmentRecommendations(budgetData: any): Promise<string> {
    try {
      if (!openai.apiKey) {
        return "Pour obtenir des recommandations IA, veuillez configurer votre clé API OpenAI.";
      }

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Vous êtes un expert en investissements pour les coopératives agricoles. Donnez des conseils stratégiques et pratiques."
          },
          {
            role: "user",
            content: `Analysez ces investissements et suggérez des améliorations en français (maximum 150 mots): ${JSON.stringify(budgetData.investments)}`
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || "Impossible de générer des recommandations pour le moment.";
    } catch (error) {
      console.error("Error generating investment recommendations:", error);
      return "Une erreur s'est produite lors de la génération des recommandations. Veuillez réessayer plus tard.";
    }
  }

  static async generateQuarterlyInsights(budgetsData: any[]): Promise<string> {
    try {
      if (!openai.apiKey) {
        return "Pour obtenir des insights IA, veuillez configurer votre clé API OpenAI.";
      }

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Vous êtes un analyste financier spécialisé dans l'analyse de tendances budgétaires. Fournissez des insights clairs et actionnables."
          },
          {
            role: "user",
            content: `Analysez ces données budgétaires trimestrielles et identifiez les tendances importantes en français (maximum 150 mots): ${JSON.stringify(budgetsData)}`
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || "Impossible de générer des insights pour le moment.";
    } catch (error) {
      console.error("Error generating quarterly insights:", error);
      return "Une erreur s'est produite lors de la génération des insights. Veuillez réessayer plus tard.";
    }
  }
}