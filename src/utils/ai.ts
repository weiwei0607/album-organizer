// Gemini API wrappers for screenshot AI classification and IG caption generation
// API key is stored in localStorage by user

const getApiUrl = (apiKey: string) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

export interface AIAnalysisResult {
  category: 'shopping' | 'location' | 'quote' | 'recipe' | 'work' | 'other';
  subCategory: string;
  summary: string;
  confidence: number;
}

function parseGeminiResponse(data: any): string {
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Analyze a screenshot image with Gemini 1.5 Flash to determine its category
 */
export async function analyzeScreenshot(
  base64Image: string,
  apiKey: string,
  existingOcrText?: string
): Promise<AIAnalysisResult> {
  const systemPrompt = `你是一個專門分析手機截圖內容的 AI 助手。
請根據圖片內容判斷截圖屬於哪個類別，並提供簡短摘要。

可選的分類（category）只有這六種：
- shopping: 購物相關（商品頁、價格、優惠、收據、訂單）
- location: 地點相關（地圖、地址、餐廳資訊、旅遊景點）
- quote: 語錄相關（名言、句子、對話截圖、書摘）
- recipe: 食譜相關（料理步驟、食材、菜單）
- work: 工作相關（會議紀錄、待辦、郵件、報告）
- other: 其他（無法歸類的截圖）

請嚴格返回 JSON 格式：
{
  "category": "shopping|location|quote|recipe|work|other",
  "subCategory": "更具體的子分類名稱（如：網購訂單、餐廳地圖、勵志語錄、烘焙食譜）",
  "summary": "20字以內的內容摘要",
  "confidence": 0.0-1.0
}`;

  const prompt = systemPrompt + "\n\n" + (existingOcrText ? `這張截圖的 OCR 文字內容：\n${existingOcrText.slice(0, 500)}` : "");
  
  // Extract base64 part (remove data:image/jpeg;base64,)
  const base64Data = base64Image.split(',')[1] || base64Image;

  const res = await fetch(getApiUrl(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "image/jpeg", data: base64Data } }
        ]
      }],
      generationConfig: { temperature: 0.2 }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const raw = parseGeminiResponse(data);
  
  // Extract JSON from possible markdown code block
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  let parsed: any = {};
  try {
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch (e) {
    console.error('Failed to parse Gemini JSON:', raw);
  }

  return {
    category: parsed.category || 'other',
    subCategory: parsed.subCategory || '其他',
    summary: parsed.summary || '',
    confidence: parsed.confidence || 0.5,
  };
}

/**
 * Generate Instagram caption from a photo and its OCR text
 */
export async function generateIGCaption(
  base64Image: string,
  ocrText: string,
  apiKey: string
): Promise<string> {
  const systemPrompt = `你是一個擅長寫 Instagram 文案的社群小編。
請根據照片內容和 OCR 文字，生成一段適合發在 Instagram 的繁體中文文案。

要求：
- 風格自然、有溫度，像朋友在分享生活
- 適當加入 emoji
- 結尾加 3-5 個相關 hashtags
- 總長度控制在 150 字以內
- 如果是美食照片，描述味道和氛圍
- 如果是風景照片，描述感受和當下心情
- 如果是日常照片，分享有趣的小細節`;

  const prompt = systemPrompt + "\n\n這張照片的 OCR 文字（如果有）：\n" + (ocrText.slice(0, 300) || '（無文字）') + "\n\n請生成 Instagram 文案：";
  const base64Data = base64Image.split(',')[1] || base64Image;

  const res = await fetch(getApiUrl(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "image/jpeg", data: base64Data } }
        ]
      }],
      generationConfig: { temperature: 0.7 }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return parseGeminiResponse(data).trim() || '生成失敗，請再試一次';
}

/**
 * Test if an API key is valid by making a minimal request
 */
export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${apiKey}`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Generate a summary for a specific category based on multiple OCR texts
 */
export async function generateCategorySummary(
  categoryName: string,
  texts: string[],
  apiKey: string
): Promise<string> {
  if (texts.length === 0) return '沒有提供任何文字可以整理。';

  const systemPrompt = `你是一個非常聰明的個人助理。
現在使用者整理了多張屬於「${categoryName}」這個類別的截圖/筆記。
請幫忙將這些內容做一個「重點整理」。

要求：
- 使用繁體中文。
- 條理分明，可以使用列點（bullet points）或標題。
- 如果有重複的資訊，請合併。
- 去除雜亂無章的無意義字元，只保留有用的資訊（如地點、價格、待辦事項、語錄精神等）。
- 總長度適中，排版美觀易讀。`;

  const userContent = texts.map((t, i) => `筆記 ${i + 1}：\n${t}`).join('\n\n---\n\n');
  const prompt = systemPrompt + "\n\n" + `請幫我整理以下 ${texts.length} 則筆記：\n\n${userContent}`;

  const res = await fetch(getApiUrl(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: { temperature: 0.5 }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return parseGeminiResponse(data).trim() || '生成失敗，請再試一次';
}
