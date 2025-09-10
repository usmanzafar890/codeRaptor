import { App } from '@octokit/app';
import { GithubRepoLoader } from '@langchain/community/document_loaders/web/github';
if (!process.env.GITHUB_APP_ID || !process.env.GITHUB_PRIVATE_KEY || !process.env.GITHUB_WEBHOOK_SECRET) {
  throw new Error('Missing GitHub App environment variables.');
}
export const githubApp = new App({
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_PRIVATE_KEY,
  webhooks: {
    secret: process.env.GITHUB_WEBHOOK_SECRET,
  },
});

githubApp.webhooks.on("installation.created", async ({ octokit, payload }) => {
  const installationId = payload.installation.id;
  const owner = payload.installation.account && 'login' in payload.installation.account
    ? payload.installation.account.login
    : undefined;
  const senderId = payload.sender.id;

  console.log(`New installation created for user/org: ${owner}, installationId: ${installationId}, senderId: ${senderId}`);
});

githubApp.webhooks.on("installation.deleted", async ({ octokit, payload }) => {
  const installationId = payload.installation.id;
  console.log(`Installation deleted: ${installationId}`);
});


export const loadGithubRepo = async (installationId: number, githubUrl: string) => {
  const octokit = await githubApp.getInstallationOctokit(installationId);
  
  const auth = await octokit.auth({ type: 'installation' }) as { token: string };
  const token = auth.token;

  const loader = new GithubRepoLoader(githubUrl, {
    accessToken: token,
    branch: 'main',
    ignoreFiles: ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb"],
    recursive: true,
    unknown: 'warn',
    maxConcurrency: 5
  });

  const docs = await loader.load();
  return docs;
};
