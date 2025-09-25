"use server";

import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateEmbedding } from "@/lib/gemini";
import { db } from "@/server/db";
import { createRun } from "@/lib/langsmith-tracing";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function askQuestion(question: string, projectId: string) {
  const stream = createStreamableValue();

  const queryVector = await generateEmbedding(question);
  const vectorQuery = `[${queryVector.join(",")}]`;

  const result = (await db.$queryRaw`
        SELECT "fileName", "sourceCode", "summary",
        1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
        FROM "SourceCodeEmbedding"
        WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > .5
        AND "projectId" = ${projectId}
        ORDER BY similarity DESC
        LIMIT 10
    `) as { fileName: string; sourceCode: string; summary: string }[];

  let context = "";

  for (const doc of result) {
    context += `source: ${doc.fileName}\ncode content: ${doc.sourceCode}\n summary of file: ${doc.summary}\n\n`;
  }

  (async () => {
    await createRun(
      async () => {
        try {
          console.log("Prompt sent to Gemini:", { context, question });
          const { textStream } = await streamText({
            model: google("gemini-2.5-flash-lite"),
            prompt: `
                        You are a ai code assistant who answers questions about the codebase. Your target audience is a technical intern who has questions and is looking to understand the codebase.
                            AI assistant is a brand new, powerful, human-like artificial intelligence.
             The traits of AI include expert knowledge, helpfulness, cleverness and articulateness.
             AI is a well-behaved and well-mannered individual.
             AI is always friendly, kind and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
             AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in the conversation.
             If the question is asking about code or a specific file, AI will provide the detailed answer, giving step by step instructions, inclduing code suggestions, snippets, and changes.
             START OF CONTEXT BLOCK
             ${context}
             END OF CONTEXT BLOCK
             
             START QUESTION
             ${question}
             END OF QUESTION
            
             AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
             If the context does not provide the answer to question, the AI assistant will say, "I'm sorry but i dont know the answer to that question. Please try again."
             AI assistant will not apologize for previous responses, but instead will indicate new information was gained.
             AI assisatant will not invent anything that is not drawn directly from the context.
             Answer in markdown syntax, with code snippets if need. Be as detailed as possible when asnwering.
             `,
          });

          for await (const delta of textStream) {
            console.log("Server streaming delta:", delta);
            stream.update(delta);
          }
        } catch (e) {
          console.error(e);
        } finally {
          stream.done();
        }
      },
      {
        name: "codebase_qa_streaming",
        runType: "chain",
        inputs: {
          question,
          context_length: context.length,
          similar_files_count: result.length,
        },
        tags: ["gemini", "qa", "codebase", "streaming"],
        metadata: {
          model: "gemini-2.5-flash-lite",
          similarity_threshold: 0.5,
          project_id: projectId,
        },
      },
    );
  })();

  return {
    output: stream.value,
    filesReferences: result,
  };
}
