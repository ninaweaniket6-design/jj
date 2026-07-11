export const runtime = 'edge';
import { streamText, convertToModelMessages } from 'ai';
import { createGroq } from '@ai-sdk/groq';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const queryModel = url.searchParams.get('model');
    const body = await req.json();
    let messages = body.messages || [];
    const model = queryModel || body.model || 'llama-3.1-8b-instant';

    console.log("RECEIVED MESSAGES TYPE:", Array.isArray(messages), "VAL:", JSON.stringify(messages).substring(0, 200));

    if (!Array.isArray(messages)) {
      messages = [];
    }

    // The API key is automatically picked up from process.env.GROQ_API_KEY
    // But we explicitly create a groq instance to ensure standard behavior
    const groq = createGroq();

    // Default to llama3-8b-8192 if model is invalid or not provided
    const validModels = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'qwen/qwen3.6-27b'];
    const selectedModel = validModels.includes(model) ? model : 'llama-3.1-8b-instant';

    let modelMessages: any = convertToModelMessages(messages);
    if (modelMessages instanceof Promise) {
      modelMessages = await modelMessages;
    }

    const result = streamText({
      model: groq(selectedModel),
      messages: (modelMessages as any),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
