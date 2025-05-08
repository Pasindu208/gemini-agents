import express from 'express';
import cors from 'cors';
import { parseArgs } from 'node:util';
import { getConfig, parseConfig, Config } from './config.js';
import { createBot } from './bot.js';
import { functions } from './tools.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let config: Config;
try {
  const { values } = parseArgs(parseConfig(process.argv.slice(2)));
  config = getConfig(values);
} catch (error) {
  console.error('Failed to load config:', error);
  process.exit(1);
}

const bot = createBot(config);

app.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });
  try {
    const messages: string[] = [];
    // Send initial user message
    let result = await bot.sendMessage(message);
    let response = await result.response;
    let text = response.text();
    messages.push(text);

    // Handle any tool function calls
    let functionCalls = response.functionCalls();
    while (functionCalls && functionCalls.length > 0) {
      const functionResponses = await Promise.all(
        functionCalls.map(async (call) => {
          const { name, args } = call;
          // @ts-expect-error dynamic function call
          const funcResult = await functions[name](args);
          return { functionResponse: { name, response: funcResult } };
        })
      );
      result = await bot.sendMessage(functionResponses);
      response = await result.response;
      const followupText = response.text();
      messages.push(followupText);
      functionCalls = response.functionCalls();
    }

    // Return concatenated responses
    res.json({ message: messages.join(' ') });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});