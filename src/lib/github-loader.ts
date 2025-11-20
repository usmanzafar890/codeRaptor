import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { summariseCode } from "./gemini";
import { generateEmbedding } from "./gemini";
import { db } from "@/server/db";
import { Octokit } from "octokit";

const getFileCount = async (path: string, octokit: Octokit, githubOwner: string, githubRepo: string, acc: number = 0) => {
    const {data} = await octokit.rest.repos.getContent({
        owner: githubOwner,
        repo: githubRepo,
        path
    })

    if (!Array.isArray(data) && data.type === "file") {
        return acc + 1
    }
    if (Array.isArray(data)) {
        let fileCount = 0
        const directories: string[] = []

        for (const item of data) {
            if (item.type === 'dir') {
                directories.push(item.path)
            } else {
                fileCount++
            }
        }

        if (directories.length > 0) {
            const directoryCounts = await Promise.all(
                directories.map(dirPath => getFileCount(dirPath, octokit, githubOwner, githubRepo, fileCount))
            )
            fileCount += directoryCounts.reduce((acc, count) => acc + count, 0)
        }
        return acc + fileCount
    }
    return acc
}


export const checkCredits = async (githubUrl: string, githubToken?: string) => {
    //find out how many files are in the repo

    const octokit = new Octokit({ auth: githubToken || process.env.GITHUB_TOKEN})

    const githubOwner = githubUrl.split('/')[3]
    const githubRepo = githubUrl.split('/')[4]
    if (!githubOwner || !githubRepo) {
        return 0
    }
    const fileCount = await getFileCount('', octokit, githubOwner, githubRepo, 0)
    return fileCount
}

export const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
    const loader = new GithubRepoLoader(githubUrl, {
        accessToken: githubToken || '',
        branch: 'main',
        ignoreFiles: ["package-lock.json", "yarn.lock", "pnpm-lock.yaml, bun.lockb"],
        recursive: true,
        unknown: 'warn',
        maxConcurrency: 5
    })

    const docs = await loader.load()
    return docs
}


export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?:string) => {
    try {
        console.log(`Starting indexing for project ${projectId}`);
        const docs = await loadGithubRepo(githubUrl, githubToken);
        console.log(`Loaded ${docs.length} documents from repository`);
        
        // Process embeddings in batches of 10 with concurrency control
        const BATCH_SIZE = 10;
        const allEmbeddings: Array<{
            summary: string;
            embedding: number[];
            sourceCode: string;
            fileName: string;
        } | null> = [];
        
        // Process documents in batches
        for (let i = 0; i < docs.length; i += BATCH_SIZE) {
            const batch = docs.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(docs.length / BATCH_SIZE)} (files ${i + 1}-${Math.min(i + BATCH_SIZE, docs.length)})`);
            
            const batchEmbeddings = await Promise.allSettled(
                batch.map(async (doc) => {
                    try {
                        const summary = await summariseCode(doc);
                        if (!summary || summary.trim().length === 0) {
                            throw new Error("Empty summary generated");
                        }
                        
                        const embedding = await generateEmbedding(summary);
                        return {
                            summary,
                            embedding,
                            sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
                            fileName: doc.metadata.source,
                        };
                    } catch (error) {
                        console.error(`Error processing file ${doc.metadata.source}:`, error);
                        // Return a fallback embedding
                        const fallbackSummary = `Code file: ${doc.metadata.source}`;
                        const embedding = await generateEmbedding(fallbackSummary).catch(() => new Array(768).fill(0));
                        return {
                            summary: fallbackSummary,
                            embedding,
                            sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
                            fileName: doc.metadata.source,
                        };
                    }
                })
            );
            
            allEmbeddings.push(...batchEmbeddings.map(result => 
                result.status === 'fulfilled' ? result.value : null
            ));
            
            // Small delay between batches to avoid rate limiting
            if (i + BATCH_SIZE < docs.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        console.log(`Generated ${allEmbeddings.filter(e => e !== null).length} embeddings out of ${docs.length} files`);
        
        // Save embeddings to database in batches
        const DB_BATCH_SIZE = 20;
        for (let i = 0; i < allEmbeddings.length; i += DB_BATCH_SIZE) {
            const batch = allEmbeddings.slice(i, i + DB_BATCH_SIZE);
            
            await Promise.allSettled(
                batch.map(async (embedding, index) => {
                    if (!embedding) {
                        console.warn(`Skipping null embedding at index ${i + index}`);
                        return;
                    }
                    
                    try {
                        const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
                            data: {
                                summary: embedding.summary,
                                sourceCode: embedding.sourceCode,
                                fileName: embedding.fileName,
                                projectId,
                            }
                        });

                        await db.$executeRaw`
                        UPDATE "SourceCodeEmbedding"
                        SET "summaryEmbedding" = ${embedding.embedding}::vector
                        WHERE "id" = ${sourceCodeEmbedding.id}
                        `;
                    } catch (error) {
                        console.error(`Error saving embedding for ${embedding.fileName}:`, error);
                    }
                })
            );
        }
        
        console.log(`Completed indexing for project ${projectId}`);
    } catch (error) {
        console.error(`Error in indexGithubRepo for project ${projectId}:`, error);
        throw error;
    }
}

// This function is no longer used but kept for backward compatibility
// The new implementation processes embeddings directly in indexGithubRepo
const generateEmbeddings = async (docs: Document[]) => {
    return await Promise.all(docs.map(async doc => {
        const summary = await summariseCode(doc)
        const embedding = await generateEmbedding(summary)
        return {
            summary,
            embedding,
            sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
            fileName: doc.metadata.source,
        }
    }))
}