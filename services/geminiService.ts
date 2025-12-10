import { GoogleGenAI, Modality } from "@google/genai";
import { AnswerData, GeminiModel, AppSettings } from '../types';

// Ensure API key is available
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing in the environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const SYSTEM_INSTRUCTION = `
You are an expert Academic Mentor and Study Guide Creator, inspired by the values of "Vidya" (Knowledge) and "Purusharth" (Hard Work).

**Role & Tone:**
- Tone: Professional, Encouraging, Precise.
- Values: Integrity, Clarity, and Depth.

**Tasks:**
1. **Content Extraction**: Identify all questions from the input PDF.
2. **Comprehensive Solutions**: Provide accurate, step-by-step solutions.
3. **Concept Roadmap (MANDATORY)**: At the end, create a section "## 🗺️ Concept Roadmap" showing the flow of topics.
4. **Formatting**:
   - **Math**: Use LaTeX ($$ ... $$ for block, $ ... $ for inline).
   - **Structure**: Clear Headers (##).
   - **Tables**: Markdown tables for comparisons.

**Output Structure:**
- **Title**
- **Study Plan Summary**
- **Questions & Answers**
- **Concept Roadmap**

Do not include conversational filler.
`;

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const generateAnswersFromPdf = async (
  file: File, 
  customInstructions?: string,
  settings?: AppSettings
): Promise<AnswerData> => {
  const base64Data = await fileToBase64(file);
  const mimeType = file.type;

  let promptText = "Generate a comprehensive study guide, solution key, and concept roadmap for the questions in this PDF. Use LaTeX for all math.";

  // Apply Settings to Prompt
  if (settings) {
    promptText += "\n\nCONFIGURATION:";
    
    if (settings.depth === 'concise') {
      promptText += "\n- DEPTH: Concise. Focus on key points and direct answers. Avoid fluff.";
    } else {
      promptText += "\n- DEPTH: Detailed. Provide in-depth explanations, background context, and step-by-step derivations.";
    }

    if (settings.language === 'hinglish') {
      promptText += "\n- LANGUAGE: Use English for technical terms but explain concepts using simple analogies or occasional Hindi/Gujarati context where helpful for Indian students (Hinglish style).";
    }

    if (settings.focus === 'exam') {
      promptText += "\n- FOCUS: Exam Preparation. Highlight potential exam questions, common pitfalls, and marking scheme tips.";
    } else {
      promptText += "\n- FOCUS: Concept Mastery. Focus on deep understanding, real-world applications, and connecting dots between topics.";
    }
  }
  
  if (customInstructions && customInstructions.trim().length > 0) {
    promptText += `\n\nUSER SPECIFIC INSTRUCTIONS: "${customInstructions}".`;
  }

  try {
    console.log(`Attempting generation with ${GeminiModel.PRO}...`);
    const response = await ai.models.generateContent({
      model: GeminiModel.PRO,
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: promptText }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 2048 } 
      }
    });

    if (response.text) {
        return {
            text: response.text,
            modelUsed: GeminiModel.PRO
        };
    }
    throw new Error("Empty response from Pro model");

  } catch (error) {
    console.warn(`Model ${GeminiModel.PRO} failed or returned empty. Falling back to ${GeminiModel.FLASH}.`, error);
    
    try {
        const response = await ai.models.generateContent({
            model: GeminiModel.FLASH,
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType } },
                    { text: promptText }
                ]
            },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            }
        });

        if (response.text) {
             return {
                text: response.text,
                modelUsed: GeminiModel.FLASH
            };
        }
        throw new Error("Empty response from Flash model");

    } catch (finalError) {
        throw new Error("Failed to generate answers. Please try again later or check if the PDF is valid.");
    }
  }
};

export const generateAudioGuide = async (text: string): Promise<string> => {
  const currentAi = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const summaryPrompt = "Read this study guide clearly and professionally. Content: " + text.slice(0, 4000);

  const response = await currentAi.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: { parts: [{ text: summaryPrompt }] },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated by the model.");
  
  return base64Audio;
};

export const generateEducationalVideo = async (prompt: string): Promise<string> => {
    const veoAi = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    let operation = await veoAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `Professional educational animation, 3d style, clear and bright visuals, explaining: ${prompt}`,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await veoAi.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation completed but no URI returned.");

    return videoUri;
};