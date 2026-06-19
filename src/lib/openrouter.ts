// ============================================================
// AntimAI — OpenRouter AI Client
// ============================================================

export async function generateOpenRouterCompletion(
  systemInstruction: string,
  userPrompt: string,
  primaryModel: string = "x-ai/grok-4.1-fast:free"
): Promise<string> {
  // A robust list of excellent free models on OpenRouter to fall back on
  const modelsToTry = [
    primaryModel,
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemini-2.5-flash:free",
    "google/gemini-2.0-flash-lite-preview-02-05:free",
    "mistralai/mistral-nemo:free"
  ];

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "AntimAI",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter Error (${model}): ${response.status} ${errorBody}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error(`No completion choices returned from OpenRouter using ${model}.`);
      }
      
      return data.choices[0].message.content;
    } catch (error) {
      console.warn(`Model ${model} failed, attempting fallback...`, error);
      lastError = error;
      // Continue to the next model
    }
  }

  throw lastError || new Error("All OpenRouter fallback models failed.");
}
