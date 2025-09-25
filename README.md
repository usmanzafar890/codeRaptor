# Code Raptor - AI-Powered Code Analysis Platform

Code Raptor is a comprehensive SaaS application that provides AI-powered code analysis, documentation generation, Q&A capabilities, and team collaboration tools for software development teams.

## 🏗️ Architecture Overview

### Technology Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with tRPC for type-safe APIs
- **Database**: PostgreSQL with Prisma ORM and pgvector extension
- **Authentication**: Clerk (planned migration to BetterAuth)
- **AI Services**: Google Gemini for code analysis and embeddings
- **External APIs**: AssemblyAI (transcription), GitHub API (repository access)
- **Payments**: Stripe for subscription management
- **tRPC**: Type-safe API layer with React Query integration
- **Tailwind CSS**: Utility-first CSS framework with Radix UI components

### Core Features

1. **Repository Analysis**: GitHub repository indexing with AI-powered code understanding
2. **AI Q&A**: Natural language questions about codebases with contextual answers
3. **Meeting Analysis**: Audio transcription and AI-powered insights extraction
4. **Team Collaboration**: Project sharing, user management, and access control
5. **Credit System**: Usage-based billing with Stripe integration
6. **Commit Tracking**: Automated commit summarization and change analysis

## 🔧 tRPC Architecture & Usage

### Why tRPC?

Code Raptor uses tRPC as its primary API layer to achieve:

- **End-to-end type safety** from database to frontend
- **Automatic API documentation** through TypeScript inference
- **Optimistic updates** and caching via React Query integration
- **Reduced boilerplate** compared to traditional REST APIs
- **Real-time error handling** with detailed type information

### Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   tRPC Router    │    │   Database      │
│   Components    │◄──►│   Procedures     │◄──►│   (Prisma)      │
│                 │    │                  │    │                 │
│ • useQuery()    │    │ • Input validation│    │ • Type-safe     │
│ • useMutation() │    │ • Business logic │    │ • Relations     │
│ • Optimistic UI │    │ • Auth middleware│    │ • Constraints   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Core Components

#### 1. Router Definition (`src/server/api/routers/`)

**Project Router Structure**:

```typescript
export const projectRouter = createTRPCRouter({
  // Queries (read operations)
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    // Automatic type inference for return value
    return await ctx.db.project.findMany(/* ... */);
  }),

  // Mutations (write operations)
  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        githubUrl: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Input is automatically typed and validated
      return await ctx.db.project.create(/* ... */);
    }),
});
```

#### 2. Client Setup (`src/trpc/react.tsx`)

**Provider Configuration**:

```typescript
export const api = createTRPCReact<AppRouter>();

// Automatic batching and streaming
const trpcClient = api.createClient({
  links: [
    httpBatchStreamLink({
      transformer: SuperJSON, // Handles Date, BigInt, etc.
      url: getBaseUrl() + "/api/trpc",
    }),
  ],
});
```

#### 3. Frontend Usage Patterns

**Data Fetching (Queries)**:

```typescript
// Automatic loading states, error handling, and caching
const { data: projects, isLoading, error } = api.project.getProjects.useQuery();

// With parameters and conditional fetching
const { data: questions } = api.project.getQuestions.useQuery(
  { projectId },
  { enabled: !!projectId }, // Only fetch when projectId exists
);
```

**Data Mutations**:

```typescript
const createProject = api.project.createProject.useMutation({
  onSuccess: () => {
    // Invalidate and refetch related queries
    utils.project.getProjects.invalidate();
  },
  onError: (error) => {
    // Typed error handling
    toast.error(error.message);
  },
});

// Usage with full type safety
const handleSubmit = (data: { name: string; githubUrl: string }) => {
  createProject.mutate(data); // Fully typed input
};
```

**Optimistic Updates**:

```typescript
const deleteMeeting = api.project.deleteMeeting.useMutation({
  onMutate: async ({ meetingId }) => {
    // Cancel outgoing refetches
    await utils.project.getMeetings.cancel();

    // Snapshot previous value
    const previousMeetings = utils.project.getMeetings.getData();

    // Optimistically update UI
    utils.project.getMeetings.setData({ projectId }, (old) =>
      old?.filter((m) => m.id !== meetingId),
    );

    return { previousMeetings };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    utils.project.getMeetings.setData({ projectId }, context?.previousMeetings);
  },
});
```

### Authentication Integration

**Middleware Protection**:

```typescript
// All procedures use protectedProcedure for auth
export const protectedProcedure = t.procedure
  .use(isAuthenticated) // Clerk auth validation
  .use(timing); // Performance monitoring

// Context automatically includes authenticated user
const createProject = protectedProcedure.mutation(async ({ ctx }) => {
  const userId = ctx.user.userId; // Always available and typed
  // ...
});
```

### Input Validation & Type Safety

**Zod Schema Integration**:

```typescript
// Input validation with detailed error messages
const createProjectInput = z.object({
  name: z.string().min(1, "Project name is required"),
  githubUrl: z.string().url("Must be a valid GitHub URL"),
  githubToken: z.string().optional(),
});

// Automatic TypeScript type generation
type CreateProjectInput = z.infer<typeof createProjectInput>;
```

**Type Inference Helpers**:

```typescript
// Extract input/output types for reuse
type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

// Usage in components
type Project = RouterOutputs["project"]["getProjects"][0];
type CreateProjectData = RouterInputs["project"]["createProject"];
```

### Performance Optimizations

**Request Batching**:

- Multiple tRPC calls in same render cycle are automatically batched
- Reduces network requests and improves performance
- Configurable batch timing and size limits

**Streaming Responses**:

- Large responses are streamed for better perceived performance
- Particularly useful for repository indexing and AI operations

**Intelligent Caching**:

```typescript
// React Query integration provides:
// - Automatic background refetching
// - Stale-while-revalidate patterns
// - Optimistic updates
// - Error boundaries integration

const { data } = api.project.getProjects.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: false, // Customize behavior
  retry: (failureCount, error) => {
    // Custom retry logic
    return failureCount < 3 && error.data?.code !== "UNAUTHORIZED";
  },
});
```

### Error Handling Patterns

**Typed Error Responses**:

```typescript
// Server-side error throwing
if (currentCredits < fileCount) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Insufficient credits",
    cause: { required: fileCount, available: currentCredits },
  });
}

// Client-side error handling
const { error } = api.project.createProject.useMutation();
if (error?.data?.code === "BAD_REQUEST") {
  // Handle specific error types
}
```

### Development Experience

**Hot Reloading**:

- Changes to tRPC procedures automatically update client types
- No manual API documentation maintenance required
- IDE autocomplete and error checking throughout the stack

**Debugging Tools**:

```typescript
// Development logging
loggerLink({
  enabled: (op) =>
    process.env.NODE_ENV === "development" ||
    (op.direction === "down" && op.result instanceof Error),
});
```

**Testing Integration**:

```typescript
// Easy procedure testing
const caller = appRouter.createCaller({
  db: mockDb,
  user: { userId: "test-user" },
});

const result = await caller.project.createProject({
  name: "Test Project",
  githubUrl: "https://github.com/test/repo",
});
```

### Best Practices in Code Raptor

1. **Procedure Organization**: Related operations grouped in routers (project, user, etc.)
2. **Input Validation**: All inputs validated with Zod schemas
3. **Error Boundaries**: Graceful error handling with user-friendly messages
4. **Optimistic Updates**: Immediate UI feedback for better UX
5. **Cache Management**: Strategic invalidation and background refetching
6. **Type Safety**: Full end-to-end typing from database to UI

## 💼 Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                  # Authentication pages
│   │   ├── login/               # Login page
│   │   ├── sign-up/             # Sign-up page
│   │   ├── reset-password/      # Password reset flow
│   │   └── layout.tsx           # Auth layout
│   ├── (protected)/             # Authentication-required routes
│   │   ├── dashboard/           # Main dashboard interface
│   │   ├── projects/             # Project management
│   │   │   ├── [projectId]/      # Individual project pages
│   │   │   │   ├── commits/      # Project commits
│   │   │   │   └── settings/     # Project settings
│   │   │   └── create/          # Project creation
│   │   ├── organizations/        # Organization management
│   │   │   ├── [id]/            # Organization details
│   │   │   └── create/          # Create organization
│   │   ├── invitations/         # Project invitations
│   │   ├── join/[projectId]/    # Project invitation handling
│   │   ├── meetings/            # Meeting management
│   │   ├── qa/                  # Q&A interface
│   │   ├── settings/            # User settings and billing
│   │   ├── setup/               # Initial setup flow
│   │   └── layout.tsx           # Protected routes layout
│   ├── (welcome)/              # Welcome and onboarding
│   │   └── welcome/             # Welcome flow
│   ├── api/                     # API routes and webhooks
│   │   ├── process-meeting/     # Meeting processing endpoint
│   │   ├── send-login-notification/ # Login notification emails
│   │   ├── trpc/[trpc]/        # tRPC API endpoint
│   │   ├── user/                # User-related endpoints
│   │   └── webhook/stripe/      # Stripe webhook handler
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/
│   ├── ui/                      # Reusable UI components (Radix-based)
│   ├── auth/                    # Authentication components
│   │   ├── login-form.tsx       # Login form
│   │   ├── sign-up-form.tsx     # Sign-up form
│   │   └── reset-password-form.tsx # Password reset form
│   ├── dashboard/               # Dashboard components
│   │   ├── ask-question-card.tsx # Q&A interface
│   │   ├── commit-log.tsx       # Commit history display
│   │   ├── empty-dashboard-view.tsx # Empty state view
│   │   └── meeting-card.tsx     # Meeting upload interface
│   ├── project/                 # Project components
│   │   ├── project-id-view.tsx   # Project detail view
│   │   └── team-tab.tsx         # Team management tab
│   ├── project-invitation/      # Invitation components
│   │   └── project-invite.tsx    # Project invitation UI
│   ├── organization/            # Organization components
│   │   ├── create-organization.tsx # Create organization form
│   │   ├── organization-view.tsx  # Organizations list view
│   │   └── organization-id-view.tsx # Single organization view
│   ├── welcome/                 # Welcome flow components
│   ├── layout/                  # Layout components
│   └── [feature]/               # Other feature-specific components
├── lib/                         # Core business logic
│   ├── auth.ts                  # Authentication configuration
│   ├── auth-client.ts            # Client-side auth utilities
│   ├── email-utils.ts            # Email sending utilities
│   ├── github-loader.ts         # Repository indexing and embedding
│   ├── github.ts                # Commit tracking and summarization
│   ├── gemini.ts                # AI model configuration
│   ├── stripe.ts                # Payment processing
│   ├── firebase.ts              # File storage
│   ├── mail.ts                  # Email templates
│   ├── langsmith-tracing.ts     # AI tracing and monitoring
│   └── utils.ts                 # Shared utilities
├── server/                      # Backend logic
│   ├── api/                     # tRPC router definitions
│   │   └── routers/
│   │       ├── project.ts       # Project operations
│   │       ├── organization.ts   # Organization operations
│   │       └── user.ts          # User management
│   ├── db.ts                    # Prisma client configuration
│   └── trpc.ts                  # tRPC configuration
├── hooks/                       # Custom React hooks
│   ├── use-project.ts           # Project context hook
│   └── use-refetch.ts           # Data refetching hook
├── trpc/                        # tRPC client setup
│   ├── react.tsx                # React query integration
│   └── server.ts                # Server-side tRPC setup
├── styles/                      # Global styles and Tailwind config
└── middleware.ts                # Authentication middleware
```

## 🗄️ Database Schema

### Core Models

**User Model**

```prisma
model User {
  id                 String              @id @default(cuid())
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
  name               String?
  email              String?             @unique
  emailVerified      DateTime?
  image              String?
  credits            Int                 @default(150)
  welcomeCompleted   Boolean             @default(false)
  // Relationships
  accounts           Account[]
  userToProjects     UserToProject[]
  organizationMembers OrganizationMember[]
  questionsAsked     Question[]
  stripeTransactions StripeTransaction[]
  invitedProjects    UserToProject[]     @relation("inviter")
}
```

**Project Model**

```prisma
model Project {
  id                  String               @id @default(cuid())
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  name                String
  githubUrl           String
  deletedAt           DateTime?
  organizationId      String?
  // Relationships
  organization        Organization?        @relation(fields: [organizationId], references: [id])
  commits             Commit[]
  userToProjects      UserToProject[]
  sourceCodeEmbeddings SourceCodeEmbedding[]
  savedQuestions      Question[]
  meetings            Meeting[]
  branches            ProjectBranch[]
}
```

**Organization Model**

```prisma
model Organization {
  id          String               @id @default(cuid())
  name        String
  description String?
  logoUrl     String?
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt
  ownerId     String
  // Relationships
  members     OrganizationMember[]
  projects    Project[]
}
```

**UserToProject Model**

```prisma
model UserToProject {
  userId    String
  projectId String
  access    ProjectAccess      @default(VIEW_ONLY)
  status    InvitationStatus   @default(PENDING)
  invitedAt DateTime           @default(now())
  invitedBy String?
  // Relationships
  user      User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  project   Project            @relation(fields: [projectId], references: [id], onDelete: Cascade)
  inviter   User?              @relation("inviter", fields: [invitedBy], references: [id], onDelete: SetNull)
  @@id([userId, projectId])
}
```

**Meeting Model**

```prisma
model Meeting {
  id          String         @id @default(cuid())
  name        String
  meetingUrl  String
  status      MeetingStatus  @default(PROCESSING)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  projectId   String
  // Relationships
  project     Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  issues      Issue[]
}
```

**Commit Model**

```prisma
model Commit {
  id               String    @id @default(cuid())
  commitHash       String
  commitMessage    String?
  commitAuthorName String?
  commitAuthorEmail String?
  commitDate       DateTime?
  branchName       String?
  aiSummary        String?
  projectId        String
  createdAt        DateTime  @default(now())
  // Relationships
  project          Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@unique([commitHash, projectId])
}
```

**SourceCodeEmbedding Model**

```prisma
model SourceCodeEmbedding {
  id               String   @id @default(cuid())
  fileName         String
  sourceCode       String   @db.Text
  summary          String   @db.Text
  summaryEmbedding Unsupported("vector(1536)")
  projectId        String
  createdAt        DateTime @default(now())
  // Relationships
  project          Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

**Key Relationships**

- Users ↔ Projects (many-to-many via `UserToProject`)
- Users ↔ Organizations (many-to-many via `OrganizationMember`)
- Organizations → Projects (one-to-many)
- Projects → SourceCodeEmbeddings (one-to-many)
- Projects → Questions (one-to-many)
- Projects → Meetings (one-to-many)
- Projects → Commits (one-to-many)
- Projects → Branches (one-to-many)
- Meetings → Issues (one-to-many)

### Enums

```prisma
enum ProjectAccess {
  FULL_ACCESS
  EDIT
  VIEW_ONLY
  OWNER
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  DECLINED
}

enum OrganizationRole {
  OWNER
  ADMIN
  MEMBER
}

enum MeetingStatus {
  PROCESSING
  COMPLETED
  FAILED
}
```

### Vector Storage

- **SourceCodeEmbedding**: Stores AI-generated embeddings for semantic code search
- **PostgreSQL + pgvector**: Enables efficient similarity search for Q&A
- **Indexing**: Vector indexes for performance optimization

### Prisma Configuration

**Schema Extensions**

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(schema: "public")]
}
```

**Migration Strategy**

- Development: `db:push` for schema prototyping
- Production: `db:migrate` for controlled schema changes
- Version control: Migration files tracked in repository

## 🔐 Authentication Flow

### Current Implementation (Clerk)

1. **Route Protection**: `middleware.ts` protects all routes except public ones
2. **tRPC Integration**: `auth()` provides user context in server procedures
3. **UI Components**: Pre-built Clerk components for sign-in/sign-up
4. **Session Management**: Automatic session handling and user synchronization

### Authentication Points

- `src/middleware.ts` - Route-level protection
- `src/server/api/trpc.ts` - API-level authentication
- `src/app/layout.tsx` - Global authentication provider
- `src/app/(protected)/layout.tsx` - User interface components

## 🤖 AI Integration

### Google Gemini Integration

**File**: `src/lib/gemini.ts`

- **Code Analysis**: Generates summaries and insights from code files
- **Embeddings**: Creates vector representations for semantic search
- **Q&A Generation**: Answers questions based on code context
- **Commit Summarization**: Analyzes git diffs and generates summaries

### LangChain Integration

**File**: `src/lib/github-loader.ts`

- **Repository Loading**: Uses `GithubRepoLoader` for efficient file processing
- **Document Processing**: Handles text splitting and chunking
- **Concurrent Processing**: Batch processing with configurable concurrency
- **File Filtering**: Ignores lock files, binaries, and other non-code files

### AssemblyAI Integration

- **Meeting Transcription**: Converts audio to text
- **Speaker Identification**: Identifies different speakers in meetings
- **Action Item Extraction**: AI-powered insights from meeting content

## 💳 Billing & Credits System

### Credit Model

- **File-Based Pricing**: 1 credit per file during repository indexing
- **Default Credits**: New users start with 150 credits
- **Stripe Integration**: Handles subscription management and payments
- **Usage Tracking**: Credits are deducted during project creation

### Stripe Integration

**File**: `src/lib/stripe.ts`

- **Subscription Management**: Multiple pricing tiers
- **Webhook Processing**: Handles payment events
- **Credit Top-ups**: Automatic credit allocation on payment

## 🔄 Data Flow

### Repository Indexing Flow

1. User provides GitHub URL and access token
2. `github-loader.ts` counts files and calculates credit cost
3. Credits are deducted from user account
4. Repository files are loaded using LangChain's `GithubRepoLoader`
5. Files are processed in batches with concurrency control
6. AI generates summaries and embeddings for each file
7. Data is stored in PostgreSQL with vector embeddings

### Q&A Flow

1. User submits question about their codebase
2. Question is converted to embedding using Gemini
3. Vector similarity search finds relevant code files
4. Context is provided to Gemini for answer generation
5. Answer and file references are stored in database
6. Response is returned to user with source file links

### Meeting Processing Flow

1. User uploads audio file to Firebase storage
2. AssemblyAI processes transcription in background
3. Gemini analyzes transcript for insights and action items
4. Results are stored and made available to user

## 🔌 API Documentation

### tRPC API Endpoints

Code Raptor uses tRPC for type-safe API communication. All tRPC procedures are located in `src/server/api/routers/`.

#### Project Router (`/api/trpc/project.*`)

**Project Management**

- `createProject` - Creates new project and indexes GitHub repository
  - Input: `{ name: string, githubUrl: string, githubToken?: string, organizationId?: string }`
  - Validates user credits before creation
  - Deducts credits based on file count
  - Triggers repository indexing and commit polling

- `getProjects` - Retrieves user's projects
  - Returns: Array of projects where user is a member
  - Excludes soft-deleted projects

- `archiveProject` - Soft deletes a project
  - Input: `{ projectId: string }`
  - Sets `deletedAt` timestamp instead of hard deletion

- `updateProjectOrganization` - Moves project to an organization
  - Input: `{ projectId: string, organizationId: string }`
  - Validates user has access to both project and organization

**Repository & Commit Management**

- `getCommits` - Retrieves project commits with AI summaries
  - Input: `{ projectId: string, page?: number, perPage?: number, branch?: string, author?: string }`
  - Supports pagination and filtering
  - Triggers background commit polling
  - Returns: Array of commits with metadata and AI summaries

- `checkCredits` - Validates user credits against repository size
  - Input: `{ githubUrl: string, githubToken?: string }`
  - Returns: `{ fileCount: number, userCredits: number }`

- `getGitHubStatus` - Checks GitHub connection status
  - Returns: `{ isConnected: boolean, hasValidToken: boolean, hasPrivateRepoAccess: boolean }`

- `getGitHubRepositories` - Lists available GitHub repositories
  - Returns: Array of repositories user has access to

**Q&A System**

- `saveAnswer` - Stores Q&A pairs with file references
  - Input: `{ projectId: string, question: string, answer: string, filesReferences: any }`
  - Associates answer with authenticated user

- `getQuestions` - Retrieves project Q&A history
  - Input: `{ projectId: string }`
  - Returns: Questions with user info, ordered by creation date

**Meeting Management**

- `uploadMeeting` - Creates meeting record for processing
  - Input: `{ projectId: string, meetingUrl: string, name: string }`
  - Sets initial status to "PROCESSING"
  - Returns: Created meeting object

- `getMeetings` - Retrieves project meetings with issues
  - Input: `{ projectId: string }`
  - Includes related issues/action items

- `getMeetingById` - Retrieves specific meeting details
  - Input: `{ meetingId: string }`
  - Includes all related issues

- `deleteMeeting` - Removes meeting and associated files
  - Input: `{ meetingId: string }`
  - Deletes related issues from database
  - Removes audio file from Firebase storage
  - Handles cleanup errors gracefully

**Team & Invitation Management**

- `getTeamMembers` - Retrieves project team members
  - Input: `{ projectId: string }`
  - Returns: User-to-project relationships with user details

- `inviteUserToProject` - Sends project invitation
  - Input: `{ projectId: string, email: string, access: ProjectAccess }`
  - Creates pending invitation record
  - Sends email notification

- `respondToInvitation` - Accept or decline invitation
  - Input: `{ invitationId: string, status: "ACCEPTED" | "DECLINED" }`
  - Updates invitation status
  - Returns updated invitation with project details

- `getMyInvitations` - Retrieves pending invitations
  - Returns: Array of pending invitations for current user

- `getPendingInvitationCount` - Counts pending invitations
  - Returns: Number of pending invitations

- `updateUserAccess` - Updates team member access level
  - Input: `{ projectId: string, userId: string, access: ProjectAccess }`
  - Requires FULL_ACCESS or OWNER permission

- `removeUserFromProject` - Removes user from project
  - Input: `{ projectId: string, userId: string }`
  - Requires FULL_ACCESS or OWNER permission

- `getMyCredits` - Gets current user's credit balance
  - Returns: `{ credits: number }`

#### Organization Router (`/api/trpc/organization.*`)

**Organization Management**

- `createOrganization` - Creates a new organization
  - Input: `{ name: string, description?: string, logoUrl?: string }`
  - Sets current user as OWNER
  - Returns created organization

- `getUserOrganizations` - Lists user's organizations
  - Returns: Array of organizations user is a member of

- `getOrganization` - Gets organization details
  - Input: `{ id: string }`
  - Returns: Organization with members and projects
  - Validates user is a member

- `updateOrganization` - Updates organization details
  - Input: `{ id: string, name: string, description?: string, logoUrl?: string }`
  - Requires OWNER or ADMIN role

- `deleteOrganization` - Deletes an organization
  - Input: `{ id: string }`
  - Requires OWNER role
  - Removes all members and disassociates projects

**Member Management**

- `addMember` - Adds member to organization
  - Input: `{ organizationId: string, userEmail: string, role: "ADMIN" | "MEMBER" }`
  - Requires OWNER or ADMIN role
  - Creates membership record

- `updateMemberRole` - Updates member's role
  - Input: `{ organizationId: string, userId: string, role: "ADMIN" | "MEMBER" }`
  - Requires OWNER or ADMIN role
  - Cannot change OWNER's role

- `removeMember` - Removes member from organization
  - Input: `{ organizationId: string, userId: string }`
  - Requires OWNER or ADMIN role
  - Cannot remove OWNER

- `getUserRole` - Gets user's role in organization
  - Input: `{ organizationId: string }`
  - Returns: `{ role: "OWNER" | "ADMIN" | "MEMBER" }`

- `getOrganizationProjects` - Lists organization projects
  - Input: `{ organizationId: string }`
  - Returns: Array of projects belonging to organization

### REST API Routes

Located in `src/app/api/` directory.

#### Meeting Processing (`POST /api/process-meeting`)

**Purpose**: Processes uploaded meeting audio files using AssemblyAI

**Authentication**: Required (Clerk)

**Request Body**:

```json
{
  "meetingUrl": "string", // Firebase storage URL
  "projectId": "string", // Associated project ID
  "meetingId": "string" // Meeting record ID
}
```

**Process Flow**:

1. Validates user authentication
2. Processes audio file through AssemblyAI
3. Extracts action items and summaries
4. Creates Issue records in database
5. Updates meeting status to "COMPLETED"
6. Sets meeting name from first headline

**Response**:

```json
{
  "success": true
}
```

**Configuration**:

- Max duration: 300 seconds (5 minutes)
- Handles long-running transcription processes

#### tRPC Handler (`/api/trpc/[...trpc]`)

**Purpose**: Handles all tRPC procedure calls

**Configuration**:

- Endpoint: `/api/trpc`
- Uses Clerk authentication context
- Provides type-safe API communication
- Handles request/response serialization

### Webhooks

#### Stripe Webhook (`POST /api/webhook/stripe`)

**Purpose**: Processes Stripe payment events for credit purchases

**Authentication**: Stripe signature verification

**Supported Events**:

- `checkout.session.completed` - Processes successful credit purchases

**Event Processing**:

1. Verifies webhook signature using `STRIPE_WEBHOOK_SECRET`
2. Extracts credits and user ID from session metadata
3. Creates `StripeTransaction` record
4. Increments user credits in database

**Required Metadata**:

- `credits` - Number of credits purchased
- `client_reference_id` - User ID for credit allocation

**Error Handling**:

- Invalid signature: 400 status
- Missing metadata: 400 status
- Database errors: 500 status

### Authentication & Authorization

**tRPC Procedures**:

- All procedures use `protectedProcedure` requiring Clerk authentication
- User context automatically injected via `ctx.user.userId`
- No role-based permissions (all authenticated users have same access)

**API Routes**:

- `/api/process-meeting` - Requires Clerk authentication
- `/api/webhook/stripe` - Uses Stripe signature verification
- `/api/trpc/*` - Authentication handled per procedure

**Middleware Protection**:

- Route-level protection via `src/middleware.ts`
- Protects all routes except public ones (sign-in, webhooks, homepage)

### Rate Limiting & Performance

**Current Implementation**:

- No explicit rate limiting implemented
- Relies on external service limits (Gemini AI, AssemblyAI)
- Database connection pooling via Prisma

**Performance Considerations**:

- Repository indexing runs asynchronously
- Meeting processing has 5-minute timeout
- Commit polling runs in background
- Vector similarity searches optimized with pgvector indexes

### Error Handling

**tRPC Procedures**:

- Automatic error serialization and type safety
- Database constraint violations handled gracefully
- External API failures bubble up with context

**API Routes**:

- Structured error responses with appropriate HTTP status codes
- Detailed logging for debugging
- Graceful degradation for non-critical failures

**Common Error Scenarios**:

- Insufficient credits: Throws error before processing
- Invalid GitHub URLs: Validation at input level
- Missing authentication: 401 Unauthorized
- Database connection issues: 500 Internal Server Error

## 🚀 Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL with pgvector extension
- Clerk account for authentication
- Google AI (Gemini) API key
- AssemblyAI API key
- Stripe account for payments
- Firebase project for file storage

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication (Clerk)
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."

# AI Services
GEMINI_API_KEY="..."
ASSEMBLYAI_API_KEY="..."

# Payments
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Storage
FIREBASE_PROJECT_ID="..."
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL="..."

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Installation & Setup

```bash
# Clone repository
git clone <repository-url>
cd code-raptor

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

### Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:studio        # Open Prisma Studio
npm run db:migrate       # Run migrations

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run typecheck        # Run TypeScript checks
npm run format:check     # Check Prettier formatting
npm run format:write     # Fix Prettier formatting
```

## 🔧 Key Integration Points

### GitHub Integration

- **Authentication**: Uses GitHub personal access tokens
- **Repository Access**: Supports both public and private repositories
- **File Processing**: Handles large repositories with pagination
- **Commit Tracking**: Monitors repository changes and generates summaries

### tRPC API Structure

- **Type Safety**: Full end-to-end type safety
- **Authentication**: Built-in auth middleware for protected procedures
- **Error Handling**: Standardized error responses
- **Validation**: Zod schema validation for all inputs

### UI Component System

- **Design System**: Consistent styling with Tailwind CSS
- **Accessibility**: ARIA-compliant components using Radix UI
- **Responsive Design**: Mobile-first responsive layouts
- **Dark Mode**: Built-in dark mode support

## 📊 Performance Considerations

### Database Optimization

- **Vector Indexing**: Optimized pgvector indexes for similarity search
- **Query Optimization**: Efficient Prisma queries with proper includes
- **Connection Pooling**: PostgreSQL connection pooling

### AI Processing

- **Concurrent Processing**: Batch processing for repository indexing
- **Rate Limiting**: Respects API rate limits for external services
- **Caching**: Strategic caching of AI responses and embeddings

### Frontend Performance

- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js Image component for optimized loading
- **Static Generation**: Pre-rendered pages where possible

## 🧪 Testing Strategy

### Unit Tests

- **Business Logic**: Test core functions in `lib/` directory
- **API Endpoints**: Test tRPC procedures and API routes
- **Components**: Test React components with React Testing Library

### Integration Tests

- **Database Operations**: Test Prisma queries and mutations
- **External APIs**: Mock external service calls
- **Authentication Flow**: Test protected routes and procedures

### End-to-End Tests

- **User Workflows**: Test complete user journeys
- **Payment Processing**: Test Stripe integration
- **AI Features**: Test repository analysis and Q&A flows

## 🚨 Common Issues & Solutions

### Database Issues

- **pgvector Extension**: Ensure pgvector is installed in PostgreSQL
- **Connection Limits**: Monitor database connection usage
- **Migration Conflicts**: Use `db:push` for development, `db:migrate` for production

### Authentication Issues

- **Clerk Configuration**: Verify environment variables and domain settings
- **Session Persistence**: Check cookie settings and HTTPS configuration
- **User Synchronization**: Monitor sync-user endpoint for errors

### AI Service Issues

- **Rate Limiting**: Implement exponential backoff for API calls
- **Token Limits**: Monitor token usage and implement chunking
- **Error Handling**: Graceful degradation when AI services are unavailable

## 📈 Monitoring & Observability

### Key Metrics

- **User Engagement**: Track Q&A usage, project creation, meeting uploads
- **System Performance**: Monitor API response times, database query performance
- **Credit Usage**: Track credit consumption patterns and billing metrics
- **Error Rates**: Monitor authentication failures, AI service errors

### Logging

- **Structured Logging**: Use consistent log formats across the application
- **Error Tracking**: Implement error tracking for production issues
- **Performance Monitoring**: Track slow queries and API calls

## 🔮 Future Enhancements

### Planned Features

- **Advanced AI Agents**: Multi-step reasoning and tool use
- **Enhanced Collaboration**: Real-time collaboration features
- **Mobile App**: React Native mobile application
- **API Marketplace**: Third-party integrations and plugins

### Technical Improvements

- **Microservices**: Break down monolith into focused services
- **Event-Driven Architecture**: Implement event sourcing for better scalability
- **Advanced Caching**: Redis-based caching layer
- **GraphQL API**: Alternative API layer for complex queries

## 🤝 Contributing

### Development Workflow

1. Create feature branch from `main`
2. Implement changes with tests
3. Run linting and type checking
4. Submit pull request with description
5. Code review and approval
6. Merge to main and deploy

### Code Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: Enforced code style and best practices
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Structured commit messages

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Maintainers**: Code Raptor Development Team

## 🏢 Organization System

### Organization Structure

Code Raptor implements a multi-level organizational structure that enables team collaboration and project management:

**Core Models**:

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  description String?
  logoUrl     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  ownerId     String
  // Relationships
  members     OrganizationMember[]
  projects    Project[]
}

model OrganizationMember {
  userId         String
  organizationId String
  role           OrganizationRole
  createdAt      DateTime @default(now())
  // Relationships
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([userId, organizationId])
}
```

### Role-Based Access Control

- **OWNER**: Full administrative control (can delete organization)
- **ADMIN**: Can manage members and projects
- **MEMBER**: Basic access to organization resources

### Organization Features

- **Team Management**: Add, remove, and manage team members
- **Project Grouping**: Organize projects under organizations
- **Resource Sharing**: Share resources across team members
- **Centralized Billing**: Organization-level subscription management

## 🔗 Project Invitation System

Code Raptor includes a comprehensive invitation system for project collaboration:

### Invitation Types

1. **Email Invitations**: Direct invitations to specific email addresses
2. **Invitation Links**: Shareable links for joining projects

### Access Levels

- **FULL_ACCESS**: Complete project control including settings
- **EDIT**: Can contribute to project but not change settings
- **VIEW_ONLY**: Read-only access to project resources

### Invitation Flow

1. Admin/Owner sends invitation (email or generates link)
2. Recipient receives notification
3. Recipient accepts or declines invitation
4. On acceptance, user gains appropriate access level

### Implementation Details

```typescript
// Project membership model
model UserToProject {
  userId    String
  projectId String
  access    ProjectAccess
  status    InvitationStatus
  invitedAt DateTime @default(now())
  invitedBy String?
  // Relationships
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@id([userId, projectId])
}
```

## 🔄 Authentication Migration

### Current Authentication System

Code Raptor is transitioning from Clerk to BetterAuth for authentication:

#### BetterAuth Integration

- **Email/Password Authentication**: Traditional login system
- **OAuth Providers**: Google and GitHub social logins
- **Session Management**: Secure session handling with JWT
- **Password Reset**: Email-based password recovery flow

#### Migration Strategy

1. **Parallel Systems**: Both authentication systems running simultaneously
2. **User Migration**: Gradual migration of user accounts
3. **Feature Parity**: Ensuring all Clerk features are available in BetterAuth

#### Implementation Files

- `src/lib/auth.ts`: Core authentication configuration
- `src/lib/auth-client.ts`: Client-side authentication utilities
- `src/components/auth/`: Authentication UI components

## 📱 Responsive Design

Code Raptor implements a fully responsive design approach:

### Mobile-First Strategy

- **Tailwind Breakpoints**: Consistent responsive breakpoints
- **Adaptive Layouts**: Flex and grid layouts that adjust to screen size
- **Touch-Friendly UI**: Larger touch targets on mobile devices

### Component Adaptations

- **Navigation**: Collapsible sidebar on mobile
- **Tables**: Responsive tables that reflow on smaller screens
- **Cards**: Full-width cards on mobile, grid layout on desktop

## 🧠 AI Processing Pipeline

### Enhanced AI Capabilities

#### Code Understanding

- **Semantic Code Analysis**: Understands code structure and relationships
- **Cross-File References**: Tracks dependencies across multiple files
- **Language-Specific Features**: Specialized handling for different programming languages

#### Context-Aware Responses

- **Project History Integration**: Considers previous code changes
- **User Intent Recognition**: Adapts responses based on user's role and history
- **Multi-Turn Conversations**: Maintains context across multiple questions

### Processing Optimization

- **Incremental Processing**: Only processes changed files in repositories
- **Priority Queue**: Critical tasks processed first
- **Background Processing**: Long-running tasks handled asynchronously

## 📊 Analytics & Insights

### User Analytics

- **Usage Patterns**: Tracks feature usage and engagement
- **Retention Metrics**: Measures user retention and churn
- **Conversion Funnel**: Analyzes user journey from signup to paid subscription

### Project Analytics

- **Repository Health**: Code quality metrics and trends
- **Collaboration Metrics**: Team activity and contribution patterns
- **AI Usage**: Question frequency and answer quality metrics

### Implementation

- **Client-Side Tracking**: Anonymous usage data collection
- **Server-Side Analytics**: Detailed system performance metrics
- **Privacy-First Approach**: No personal data in analytics

## 🔮 Component Architecture

### UI Component Hierarchy

Code Raptor follows a modular component architecture with clear separation of concerns:

```
Components/
├── ui/                    # Base UI components (buttons, cards, etc.)
├── auth/                  # Authentication components
├── dashboard/             # Dashboard-specific components
├── project/               # Project management components
├── project-invitation/    # Invitation handling components
├── organization/          # Organization management components
├── layout/                # Layout and structural components
└── [feature]/             # Feature-specific component groups
```

### Component Design Principles

1. **Atomic Design**: Building from atoms to organisms to templates
2. **Composition over Inheritance**: Favoring component composition
3. **Single Responsibility**: Each component has one primary function
4. **Prop Drilling Avoidance**: Using context where appropriate
5. **Consistent API**: Standardized prop patterns across components

### State Management

- **React Context**: For global state (current project, user preferences)
- **React Query**: For server state and data fetching
- **Form State**: Using React Hook Form for form management
- **Local Component State**: For UI-specific state

## 🚀 Deployment Strategy

### Infrastructure

- **Hosting**: Vercel for Next.js application
- **Database**: Managed PostgreSQL with pgvector extension
- **Storage**: Firebase Storage for file uploads
- **CDN**: Vercel Edge Network for static assets

### Deployment Pipeline

1. **CI/CD**: GitHub Actions for continuous integration
2. **Testing**: Automated tests run before deployment
3. **Preview Deployments**: Generated for pull requests
4. **Production Deployment**: Automatic deployment from main branch
5. **Database Migrations**: Run during deployment process

### Environment Configuration

- **Development**: Local environment with development database
- **Staging**: Production-like environment for testing
- **Production**: Live environment with scaled resources

## 🔒 Security Features

### Data Protection

- **Encryption at Rest**: Database encryption for sensitive data
- **Encryption in Transit**: HTTPS for all communications
- **Secure Credentials**: Environment variables for API keys
- **Token Security**: Short-lived JWTs with proper signing

### Access Control

- **Route Protection**: Server-side authentication checks
- **API Security**: tRPC procedures with authentication middleware
- **CORS Policies**: Restricted cross-origin requests
- **Rate Limiting**: Protection against brute force attacks

### Compliance Considerations

- **GDPR Readiness**: User data export and deletion capabilities
- **Data Minimization**: Only collecting necessary user information
- **Audit Logging**: Recording security-relevant events
- **Regular Security Reviews**: Scheduled security assessments

## 🎤 Meeting Analysis System

### Overview

Code Raptor includes a sophisticated meeting analysis system that transcribes and extracts insights from development meetings:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Audio Upload  │    │   Transcription  │    │   AI Analysis   │
│   (Firebase)    │───►│   (AssemblyAI)   │───►│   (Gemini)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Issue         │◄───│   Action Item    │◄───│   Insight       │
│   Tracking      │    │   Extraction     │    │   Generation    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Features

- **Audio Transcription**: Converts meeting recordings to text
- **Speaker Identification**: Distinguishes between different speakers
- **Action Item Detection**: Automatically identifies tasks and assignments
- **Code Discussion Analysis**: Links discussions to relevant code files
- **Meeting Summarization**: Generates concise meeting summaries

### Implementation

**Model**: `Meeting`

```prisma
model Meeting {
  id          String   @id @default(cuid())
  name        String
  meetingUrl  String
  status      MeetingStatus @default(PROCESSING)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  projectId   String
  // Relationships
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  issues      Issue[]
}
```

**Processing Flow**:

1. User uploads audio file to Firebase Storage
2. Backend initiates AssemblyAI transcription
3. Transcription is processed by Gemini AI
4. AI extracts action items and insights
5. Results are stored as Issues linked to the Meeting

## 💻 Detailed Setup Guide

### First-Time Setup

#### Prerequisites Installation

1. **Node.js and npm**

   ```bash
   # For Windows (using Chocolatey)
   choco install nodejs

   # For macOS (using Homebrew)
   brew install node

   # Verify installation
   node --version  # Should be 18.x or higher
   npm --version   # Should be 8.x or higher
   ```

2. **PostgreSQL with pgvector**

   ```bash
   # For Windows (using Chocolatey)
   choco install postgresql

   # For macOS (using Homebrew)
   brew install postgresql

   # Install pgvector extension
   CREATE EXTENSION vector;
   ```

3. **Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

#### Project Configuration

1. **Clone and Install Dependencies**

   ```bash
   git clone https://github.com/aurelionai/coderaptor.git
   cd coderaptor
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file with the following variables:

   ```
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/coderaptor?schema=public"

   # Authentication
   BETTER_AUTH_URL="http://localhost:3000"
   BETTER_AUTH_SECRET="your-secret-key"

   # AI Services
   GEMINI_API_KEY="your-gemini-api-key"
   ASSEMBLYAI_API_KEY="your-assemblyai-key"

   # Firebase
   FIREBASE_PROJECT_ID="your-project-id"
   FIREBASE_PRIVATE_KEY="your-private-key"
   FIREBASE_CLIENT_EMAIL="your-client-email"

   # GitHub
   GITHUB_TOKEN="your-github-token"
   GITHUB_APP_ID="your-github-app-id"
   GITHUB_PRIVATE_KEY="your-github-private-key"

   # Stripe
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   ```

3. **Database Setup**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push
   ```

4. **Firebase Configuration**

   ```bash
   # Initialize Firebase project
   firebase init

   # Select Storage service
   # Configure security rules for Firebase Storage
   ```

### Development Workflow

#### Running the Application

```bash
# Start development server
npm run dev

# Access the application
open http://localhost:3000
```

#### Database Management

```bash
# Open Prisma Studio for database management
npm run db:studio

# Apply database migrations
npm run db:migrate

# Reset database (caution: deletes all data)
npm run db:reset
```

#### Testing Changes

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint

# Format code
npm run format:write
```

### Production Deployment

#### Build and Deploy

```bash
# Build the application
npm run build

# Preview production build locally
npm run preview

# Deploy to Vercel
vercel deploy --prod
```

#### Database Migration

```bash
# Generate migration files
npx prisma migrate dev --name "migration-name"

# Apply migrations to production
npx prisma migrate deploy
```

#### Environment Variables

Ensure all environment variables are configured in your production environment (Vercel dashboard or equivalent).
