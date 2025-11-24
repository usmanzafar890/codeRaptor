// import { GoogleGenerativeAI } from '@google/generative-ai'
// import { Document } from "@langchain/core/documents";


// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
// const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })


// export async function aiSummariseCommit(diff: string) {
//     // https://github.com/docker/genai-stack/commit/<commithash>.diff
//     const response = await model.generateContent([
//         `You are an expert programmer, and you are trying to summarize a git diff.
//     Reminders about the git diff format:
//     For every file, there are a few metadata lines, like (for example):
//     \`\`\`
//     diff --git a/lib/index.js b/lib/index.js
//     index aadf691..1111111 100644
//     --- a/lib/index.js
//     +++ b/lib/index.js
//     \`\`\`
//     This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
//     Then there is a specifier of the lines that were modified.
//     A line starting with \`+\` means that the line was added.
//     A line starting with \`-\` means that the line was removed.
//     A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding.
//     [...]
//     EXAMPLE SUMMARY COMMENTS:
//     \`\`\`
//     * Raised the amount of returned recordings from \`10\` to \`100\` [packages/server/recordings_api.ts], [packages/server/constants.ts]
//     * Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
//     * Moved the \`octokit\` initialization to a seperate file [src/octokit.ts]
//     * Added an OpenAI API for completion [packages/utils/apis/openai.ts]
//     * Lowered numeric tolerace for test files
//     \`\`\`
//     Most commits will have less comments than this examples list. 
//     The last comment does not include the files names,
//     because there were more than two relevant files in the hypothetical commit.
//     Do not include parts of the example in your summary.
//     It is given only as an example of appropriate comments.`,
//         `Please summarize the following diff file: \n\n${diff}`,
//     ]);

//     return response.response.text();
// }




// export async function summariseCode(doc: Document, retries: number = 3): Promise<string> {
//     console.log("getting summary for", doc.metadata.source);
    
//     for (let attempt = 1; attempt <= retries; attempt++) {
//         try {
//             const code = doc.pageContent.slice(0, 1000);
            
//             // Skip empty or very short files
//             if (!code || code.trim().length < 10) {
//                 return `Empty or minimal content file: ${doc.metadata.source}`;
//             }
            
//             const response = await model.generateContent([
//                 `You are an intelligent senior software engineer who specializes in onboarding junior software engineers onto projects`,
//                 `You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file.
// Here is the code:
// ---
// ${code}
// ---
//         Give a summary no more than 100 words of the code above`,
//             ]);

//             const summary = response.response.text();
            
//             // Validate summary was generated
//             if (!summary || summary.trim().length === 0) {
//                 throw new Error("Empty summary returned");
//             }
            
//             return summary;
//         } catch (error) {
//             console.error(`Error generating summary for ${doc.metadata.source} (attempt ${attempt}/${retries}):`, error);
            
//             if (attempt === retries) {
//                 // Last attempt failed, return a fallback summary
//                 return `Code file: ${doc.metadata.source}. Unable to generate AI summary after ${retries} attempts.`;
//             }
            
//             // Wait before retrying (exponential backoff)
//             await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
//         }
//     }
    
//     return `Code file: ${doc.metadata.source}. Summary generation failed.`;
// }


 
// export async function generateEmbedding(summary: string, retries: number = 3): Promise<number[]> {
//     const model = genAI.getGenerativeModel({
//         model: "gemini-embedding-001"
//     })

//     for (let attempt = 1; attempt <= retries; attempt++) {
//         try {
//             // Ensure summary is not empty
//             if (!summary || summary.trim().length === 0) {
//                 throw new Error("Empty summary provided for embedding");
//             }

//             const result = await model.embedContent(summary);
//             const embedding = result.embedding;
            
//             if (!embedding || !embedding.values || embedding.values.length === 0) {
//                 throw new Error("Empty embedding returned");
//             }
            
//             return embedding.values;
//         } catch (error) {
//             console.error(`Error generating embedding (attempt ${attempt}/${retries}):`, error);
            
//             if (attempt === retries) {
//                 // Last attempt failed, return a zero vector as fallback
//                 console.warn("Returning zero vector as fallback for failed embedding");
//                 return new Array(768).fill(0);
//             }
            
//             // Wait before retrying (exponential backoff)
//             await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
//         }
//     }
    
//     // Fallback: return zero vector
//     return new Array(768).fill(0);
// }






import { GoogleGenerativeAI } from '@google/generative-ai'
import { Document } from "@langchain/core/documents";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })


export const aiSummariseCommit = async (diff: string) => {
    // https://github.com/docker/genai-stack/commit/<commithash>.diff
    const response = await model.generateContent([
        `You are an expert programmer, and you are trying to summarize a git diff.
    Reminders about the git diff format:
    For every file, there are a few metadata lines, like (for example):
    \`\`\`
    diff --git a/lib/index.js b/lib/index.js
    index aadf691..1111111 100644
    --- a/lib/index.js
    +++ b/lib/index.js
    \`\`\`
    This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
    Then there is a specifier of the lines that were modified.
    A line starting with \`+\` means that the line was added.
    A line starting with \`-\` means that the line was removed.
    A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding.
    [...]
    EXAMPLE SUMMARY COMMENTS:
    \`\`\`
    * Raised the amount of returned recordings from \`10\` to \`100\` [packages/server/recordings_api.ts], [packages/server/constants.ts]
    * Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
    * Moved the \`octokit\` initialization to a seperate file [src/octokit.ts]
    * Added an OpenAI API for completion [packages/utils/apis/openai.ts]
    * Lowered numeric tolerace for test files
    \`\`\`
    Most commits will have less comments than this examples list. 
    The last comment does not include the files names,
    because there were more than two relevant files in the hypothetical commit.
    Do not include parts of the example in your summary.
    It is given only as an example of appropriate comments.`,
        `Please summarize the following diff file: \n\n${diff}`,
    ]);

    return response.response.text();
}


export async function summariseCode(doc: Document) {
    console.log("getting summary for", doc.metadata.source);
    try {
    const code = doc.pageContent.slice(0, 10000); // Limit to 10000 characters
    const response = await model.generateContent([
        `You are an intelligent senior software engineer who specializes in onboarding junior software engineers onto projects`,
        `You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file.
Here is the code:
---
${code}
---
        Give a summary no more than 100 words of the code above`,
        
    ]);

    return response.response.text()
} catch (error) {
return ""
}}

 
export async function generateEmbedding(summary:string) {
    const model = genAI.getGenerativeModel({
        model: "gemini-embedding-001"
    })

    const result = await model.embedContent(summary)
    const embedding = result.embedding
    return embedding.values
}

