import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { summariseCode } from "./gemini";
import { generateEmbedding } from "./gemini";
import { db } from "@/server/db";
import { Octokit } from "octokit";

const sanitizeText = (value: unknown): string => {
    if (typeof value !== "string") return "";
    // Remove NULL bytes and enforce valid UTF-8 friendly string
    return value.replace(/\u0000/g, "");
}

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
        ignoreFiles: ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb"],
        recursive: true,
        unknown: 'warn',
        maxConcurrency: 5
    })

    const docs = await loader.load()
    return docs
}


export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?:string) => {
    const docs = await loadGithubRepo(githubUrl, githubToken)

    // Process in small batches to avoid rate limits and DB pool timeouts
    const batchSize = 5
    for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize)
        const results = await generateEmbeddings(batch)

        for (let j = 0; j < results.length; j++) {
            const item = results[j]
            const globalIndex = i + j
            console.log(`processing ${globalIndex + 1} of ${docs.length}`)
            if (!item || !item.summary || !item.embedding || item.embedding.length === 0) {
                continue
            }

            const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
                data: {
                    summary: item.summary,
                    sourceCode: item.sourceCode,
                    fileName: item.fileName,
                    projectId,
                }
            })

            await db.$executeRaw`
            UPDATE "SourceCodeEmbedding"
            SET "summaryEmbedding" = ${item.embedding}::vector
            WHERE "id" = ${sourceCodeEmbedding.id}
            `
        }
    }
}

const generateEmbeddings = async (docs: Document[]) => {
    return await Promise.all(docs.map(async doc => {
        try {
            const summary = await summariseCode(doc)
            if (!summary || summary.trim().length === 0) {
                return null
            }
            const embedding = await generateEmbedding(summary)
            return {
                summary: sanitizeText(summary),
                embedding,
                sourceCode: sanitizeText(JSON.parse(JSON.stringify(doc.pageContent))),
                fileName: doc.metadata.source,
            }
        } catch (err) {
            console.error("Failed to generate summary/embedding for", doc.metadata?.source, err)
            return null
        }
    }))
}
