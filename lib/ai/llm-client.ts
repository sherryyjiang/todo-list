/**
 * LLM Client Abstraction
 * 
 * This module provides a unified interface for LLM calls,
 * allowing easy switching between providers via environment variables.
 * 
 * Currently supported: Gemini
 * Future: OpenAI, Claude, etc.
 */

import { GoogleGenAI } from "@google/genai";

export type LLMProvider = "gemini";

interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
}

interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
}

interface LLMResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

function getConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER ?? "gemini") as LLMProvider;
  const apiKey = process.env.GEMINI_API_KEY ?? "";
  const model = process.env.LLM_MODEL ?? "gemini-2.5-flash";

  return { provider, apiKey, model };
}

export async function generateText(
  prompt: string,
  systemPrompt?: string,
  options: GenerateOptions = {}
): Promise<LLMResponse> {
  const config = getConfig();

  if (config.provider === "gemini") {
    return generateWithGemini(prompt, systemPrompt, options, config);
  }

  throw new Error(`Unsupported LLM provider: ${config.provider}`);
}

async function generateWithGemini(
  prompt: string,
  systemPrompt: string | undefined,
  options: GenerateOptions,
  config: LLMConfig
): Promise<LLMResponse> {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });

  const contents = systemPrompt
    ? `${systemPrompt}\n\n${prompt}`
    : prompt;

  const response = await ai.models.generateContent({
    model: config.model,
    contents,
    config: {
      temperature: options.temperature ?? 0.1,
      maxOutputTokens: options.maxTokens ?? 1000,
      responseMimeType: options.responseFormat === "json" ? "application/json" : "text/plain",
    },
  });

  return {
    text: response.text ?? "",
    usage: response.usageMetadata
      ? {
          promptTokens: response.usageMetadata.promptTokenCount ?? 0,
          completionTokens: response.usageMetadata.candidatesTokenCount ?? 0,
          totalTokens: response.usageMetadata.totalTokenCount ?? 0,
        }
      : undefined,
  };
}

export async function parseJSON<T>(
  prompt: string,
  systemPrompt?: string,
  options: GenerateOptions = {}
): Promise<T> {
  const response = await generateText(prompt, systemPrompt, {
    ...options,
    responseFormat: "json",
  });

  try {
    return JSON.parse(response.text) as T;
  } catch (error) {
    console.error("Failed to parse LLM JSON response:", response.text);
    throw new Error("Invalid JSON response from LLM");
  }
}



