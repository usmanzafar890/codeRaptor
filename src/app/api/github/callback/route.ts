import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { db } from "@/server/db";
import { auth } from "@/lib/auth";

const callbackParamsSchema = z.object({
  installation_id: z.string().transform(Number),
  state: z.string(),
});

const callbackParamsSchemaAuth = z.object({
  code: z.string(),
});

async function getSessions() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return session;
  } catch (error) {
    console.error("Error retrieving session:", error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = callbackParamsSchema.safeParse({
      installation_id: url.searchParams.get("installation_id"),
      state: url.searchParams.get("state"),
    });

    const paramsAuth = callbackParamsSchemaAuth.safeParse({
      code: url.searchParams.get("code"),
    });

    if (!params.success) {
      console.error(
        "Validation error for GitHub callback parameters:",
        params.error,
      );
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri1 = `${process.env.NEXT_PUBLIC_APP_URL}/api/github/callback`;
    const scope = "repo,user,read:user,user:email";

    try {
      const tokenResponse = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "code-raptor-890",
          },
          body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: paramsAuth?.data?.code || "",
          }),
        },
      );

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Error from GitHub token exchange:", errorText);
        return NextResponse.json(
          { error: "Failed to get access token from GitHub" },
          { status: 400 },
        );
      }

      const tokenData = await tokenResponse.json();
      if (tokenData.error === "bad_verification_code") {
        console.log(
          "params?.data?.installation_id",
          params?.data?.installation_id,
        );
        const session = await getSessions();
        try {
          if (session?.user?.id) {
            const existingAccount = await db.account.findFirst({
              where: {
                userId: session.user.id,
                providerId: "github",
              },
            });

            if (existingAccount) {
              await db.account.update({
                where: { id: existingAccount.id },
                data: {
                  installationId: params?.data?.installation_id,
                },
              });
            } else {
              await db.account.create({
                data: {
                  id: uuidv4(),
                  userId: session.user.id,
                  providerId: "github",
                  accountId: session.user.id,
                  installationId: params?.data?.installation_id,
                  scope: "repo,user,read:user,user:email",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              });
            }

            console.log(
              `Successfully saved GitHub tokens for user ${session.user.id}`,
            );
          }
        } catch (dbError) {
          console.error("Error saving GitHub tokens to database:", dbError);
        }
        if (params?.data?.installation_id) {
          const authorizationUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri1}&scope=${scope}`;
          return NextResponse.redirect(authorizationUrl);
        }
      }

      const { access_token, refresh_token, expires_in } = tokenData;
      const session = await getSessions();
      if (!session || !session.user) {
        return NextResponse.redirect(
          new URL("/login?github_pending=true", req.url),
        );
      }

      try {
        if (session?.user?.id) {
          const existingAccount = await db.account.findFirst({
            where: {
              userId: session.user.id,
              providerId: "github",
            },
          });

          if (existingAccount) {
            await db.account.update({
              where: { id: existingAccount.id },
              data: {
                accessToken: access_token,
                refreshToken: access_token || null,
                gitToken: access_token || null,
              },
            });
          } else {
            await db.account.create({
              data: {
                id: uuidv4(),
                userId: session.user.id,
                providerId: "github",
                accountId: session.user.id,
                accessToken: access_token,
                gitToken: access_token,
                refreshToken: access_token || null,
                accessTokenExpiresAt: expires_in
                  ? new Date(Date.now() + expires_in * 1000)
                  : null,
                scope: "repo,user,read:user,user:email",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          }

          console.log(
            `Successfully saved GitHub tokens for user ${session.user.id}`,
          );
        }
      } catch (dbError) {
        console.error("Error saving GitHub tokens to database:", dbError);
      }

      return NextResponse.redirect(
        new URL("/setup?github_connected=true", req.url),
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("[CALLBACK] Error during token exchange:", errorMessage);
      const githubAuthUrl = `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || "code-raptor-890"}/installations/new?state=${uuidv4()}`;
      return NextResponse.redirect(githubAuthUrl);
    }
  } catch (error) {
    console.error("Error in token exchange route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
