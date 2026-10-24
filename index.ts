import { generateText } from 'ai';
import 'dotenv/config';

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(
      'Missing AI_GATEWAY_API_KEY. Add it to .env.local locally; do not commit or share it.',
    );
  }

  const { text } = await generateText({
    model: 'moonshotai/kimi-k3',
    prompt:
      'Invent a completely new annual holiday. Give it an original name, explain what it celebrates, and describe its traditions, food, symbols, and how families or communities celebrate it.',
  });

  if (!text.trim()) {
    throw new Error('The model returned an empty response.');
  }

  console.log(text);
}

main().catch((error: unknown) => {
  // Avoid printing request objects or environment values that could contain secrets.
  console.error(
    error instanceof Error ? error.message : 'AI Gateway request failed.',
  );
  process.exitCode = 1;
});
