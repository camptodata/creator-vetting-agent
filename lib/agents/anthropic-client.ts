import Anthropic from "@anthropic-ai/sdk";
import { z, toJSONSchema } from "zod";

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "PLACEHOLDER_PASTE_WHEN_READY") {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Please add a valid key to .env.local."
      );
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

/**
 * Calls Claude with a single structured-output tool defined by a Zod schema.
 * Returns the parsed, typed result.
 */
export async function callWithZodTool<T extends z.ZodType>(
  schema: T,
  toolName: string,
  toolDescription: string,
  systemPrompt: string,
  userMessage: string
): Promise<z.infer<T>> {
  const client = getAnthropicClient();

  // Convert Zod schema to JSON schema for the tool definition
  const jsonSchema = toJSONSchema(schema) as Record<string, unknown>;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system: systemPrompt,
    tools: [
      {
        name: toolName,
        description: toolDescription,
        input_schema: jsonSchema as Anthropic.Tool["input_schema"],
      },
    ],
    tool_choice: { type: "tool", name: toolName },
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  // Extract tool use block
  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUseBlock) {
    throw new Error(`No tool_use block returned by Claude for tool: ${toolName}`);
  }

  // Parse and validate with Zod
  const parsed = schema.parse(toolUseBlock.input);
  return parsed;
}
