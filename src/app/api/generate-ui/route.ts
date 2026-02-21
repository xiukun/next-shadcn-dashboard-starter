import { streamText } from 'ai';
import { createOllama } from 'ollama-ai-provider-v2';

/**
 * API 路由：生成 UI
 * 接收用户 prompt，使用 Ollama AI 生成 JSON spec，返回流式响应
 */
export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return Response.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // 导入服务器端 catalog（不包含 React 依赖）
    const { catalog } = await import('@/lib/json-render/catalog-server');

    // 生成 system prompt
    const systemPrompt = catalog.prompt();

    // 配置 Ollama 提供者
    // 支持环境变量配置：OLLAMA_BASE_URL（默认：http://localhost:11434/api）
    const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api';
    const ollama = createOllama({
      baseURL,
      headers: process.env.OLLAMA_API_KEY
        ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` }
        : undefined
    });

    // 配置模型（默认：glm-5:cloud）
    const modelName = process.env.OLLAMA_MODEL || 'glm-5:cloud';
    const model = ollama(modelName);

    // 生成流式响应
    const result = streamText({
      model,
      system: systemPrompt,
      prompt
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error generating UI:', error);
    return Response.json(
      {
        error: 'Failed to generate UI',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
