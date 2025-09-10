// src/server/api/trpc.ts
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { auth } from "@/lib/auth"; // Ensure the correct import of the auth setup

export const createTRPCContext = async (opts: { headers: Headers }) => {
  try {
    // Retrieve the session using better-auth
    const session = await auth.api.getSession({
      headers: opts.headers,
    });

    if (!session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized, no session found.",
      });
    }

    const userId = session.user.id;

    return {
      db,
      user: { userId },
      session, // Pass the session data to the context
      ...opts,
    };
  } catch (error) {
    console.error("Failed to retrieve session:", error);
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized, failed to get session.",
    });
  }
};



// Initialize tRPC
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Middleware for authentication (checking session)
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  const { session } = ctx;
  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized, no session.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session,
    },
  });
});

// Timing Middleware
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // Artificial delay in development mode
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

// Public Procedure (Unauthenticated)
export const publicProcedure = t.procedure.use(timingMiddleware);

// Protected Procedure (Authenticated)
export const protectedProcedure = t.procedure.use(isAuthenticated).use(timingMiddleware);

// Router Creation
export const createTRPCRouter = t.router;

// Create server-side caller factory
export const createCallerFactory = t.createCallerFactory;
