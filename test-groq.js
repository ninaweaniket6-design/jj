import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    console.log("Key:", process.env.GROQ_API_KEY ? "Loaded" : "Missing");
    const groq = createGroq();
    const result = await generateText({
      model: groq('llama3-8b-8192'),
      prompt: 'Say hello world',
    });
    console.log("Response:", result.text);
  } catch(e) {
    console.error("Error:", e);
  }
}
main();
