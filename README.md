# Code Raptor - AI-Powered Code Analysis Platform

Code Raptor is a comprehensive SaaS application that provides AI-powered code analysis, documentation generation, Q&A capabilities, and team collaboration tools for software development teams.

## 🏗️ Architecture Overview ✨

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
    .input(z.object({ 
      name: z.string(),
      githubUrl: z.string() 
    }))
    .mutation(async ({ ctx, input }) => {
      // Input is automatically typed and validated
      return await ctx.db.project.create(/* ... */);
    })
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
      transformer: SuperJSON,  // Handles Date, BigInt, etc.
      url: getBaseUrl() + "/api/trpc"
    })
  ]
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
  { enabled: !!projectId }  // Only fetch when projectId exists
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
  }
});

// Usage with full type safety
const handleSubmit = (data: { name: string; githubUrl: string }) => {
  createProject.mutate(data);  // Fully typed input
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
    utils.project.getMeetings.setData(
      { projectId },
      (old) => old?.filter(m => m.id !== meetingId)
    );
    
    return { previousMeetings };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    utils.project.getMeetings.setData(
      { projectId },
      context?.previousMeetings
    );
  }
});
```

### Authentication Integration

**Middleware Protection**:
```typescript
// All procedures use protectedProcedure for auth
export const protectedProcedure = t.procedure
  .use(isAuthenticated)  // Clerk auth validation
  .use(timing);          // Performance monitoring

// Context automatically includes authenticated user
const createProject = protectedProcedure
  .mutation(async ({ ctx }) => {
    const userId = ctx.user.userId;  // Always available and typed
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
  githubToken: z.string().optional()
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
type Project = RouterOutputs['project']['getProjects'][0];
type CreateProjectData = RouterInputs['project']['createProject'];
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
  staleTime: 5 * 60 * 1000,        // 5 minutes
  refetchOnWindowFocus: false,      // Customize behavior
  retry: (failureCount, error) => {
    // Custom retry logic
    return failureCount < 3 && error.data?.code !== 'UNAUTHORIZED';
  }
});
```

### Error Handling Patterns

**Typed Error Responses**:
```typescript
// Server-side error throwing
if (currentCredits < fileCount) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Insufficient credits',
    cause: { required: fileCount, available: currentCredits }
  });
}

// Client-side error handling
const { error } = api.project.createProject.useMutation();
if (error?.data?.code === 'BAD_REQUEST') {
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
    (op.direction === "down" && op.result instanceof Error)
})
```

**Testing Integration**:
```typescript
// Easy procedure testing
const caller = appRouter.createCaller({
  db: mockDb,
  user: { userId: 'test-user' }
});

const result = await caller.project.createProject({
  name: 'Test Project',
  githubUrl: 'https://github.com/test/repo'
});
```

### Best Practices in Code Raptor

1. **Procedure Organization**: Related operations grouped in routers (project, user, etc.)
2. **Input Validation**: All inputs validated with Zod schemas
3. **Error Boundaries**: Graceful error handling with user-friendly messages
4. **Optimistic Updates**: Immediate UI feedback for better UX
5. **Cache Management**: Strategic invalidation and background refetching
6. **Type Safety**: Full end-to-end typing from database to UI

## 🏗️ Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (protected)/             # Authentication-required routes
│   │   ├── dashboard/           # Main dashboard interface
│   │   ├── project/[id]/        # Individual project pages
│   │   ├── join/[projectId]/    # Project invitation handling
│   │   ├── settings/            # User settings and billing
│   │   └── layout.tsx           # Protected routes layout with UserButton
│   ├── sign-in/[[...sign-in]]/  # Clerk authentication pages
│   ├── sign-up/[[...sign-up]]/  # Clerk authentication pages
│   ├── sync-user/               # User synchronization endpoint
│   ├── api/                     # API routes and webhooks
│   │   ├── process-meeting/     # Meeting processing endpoint
│   │   └── stripe/              # Stripe webhook handlers
│   ├── layout.tsx               # Root layout with ClerkProvider
│   └── page.tsx                 # Landing page
├── components/
│   ├── ui/                      # Reusable UI components (Radix-based)
│   └── [feature-components]     # Feature-specific components
├── lib/                         # Core business logic
│   ├── github-loader.ts         # Repository indexing and embedding generation
│   ├── github.ts                # Commit tracking and summarization
│   ├── gemini.ts                # AI model configuration and utilities
│   ├── stripe.ts                # Payment processing and subscriptions
│   ├── firebase.ts              # Meeting recording storage
│   └── utils.ts                 # Shared utilities
├── server/                      # Backend logic
│   ├── api/                     # tRPC router definitions
│   │   └── routers/
│   │       ├── project.ts       # Main project operations
│   │       └── user.ts          # User management and billing
│   ├── db.ts                    # Prisma client configuration
│   └── uploadthing.ts           # File upload configuration
├── hooks/                       # Custom React hooks
├── styles/                      # Global styles and Tailwind config
└── middleware.ts                # Clerk authentication middleware
```

## 🗄️ Database Schema

### Core Models

**User Model**
```prisma
model User {
  id             String          @id @default(cuid())
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  imageUrl       String?
  firstName      String?
  lastName       String?
  credits        Int             @default(150)
  emailAddress   String          @unique
  // Relationships
  userToProjects userToProject[]
  questionsAsked Question[]
  stripeTransactions StripeTransaction[]
}
```

**Project Model**
```prisma
model Project {
  id             String          @id @default(cuid())
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  name           String
  githubUrl      String
  deletedAt      DateTime?
  // Relationships
  commits        Commit[]
  userToProjects userToProject[]
  sourceCodeEmbeddings SourceCodeEmbedding[]
  savedQuestions      Question[]
  meetings Meeting[]
}
```

**Key Relationships**
- Users ↔ Projects (many-to-many via `userToProject`)
- Projects → SourceCodeEmbeddings (one-to-many)
- Projects → Questions (one-to-many)
- Projects → Meetings (one-to-many)
- Projects → Commits (one-to-many)

### Vector Storage
- **SourceCodeEmbedding**: Stores AI-generated embeddings for semantic code search
- **PostgreSQL + pgvector**: Enables efficient similarity search for Q&A

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
  - Input: `{ name: string, githubUrl: string, githubToken?: string }`
  - Validates user credits before creation
  - Deducts credits based on file count
  - Triggers repository indexing and commit polling

- `getProjects` - Retrieves user's projects
  - Returns: Array of projects where user is a member
  - Excludes soft-deleted projects

- `archiveProject` - Soft deletes a project
  - Input: `{ projectId: string }`
  - Sets `deletedAt` timestamp instead of hard deletion

**Repository & Commit Management**
- `getCommits` - Retrieves project commits with AI summaries
  - Input: `{ projectId: string }`
  - Triggers background commit polling
  - Returns: Array of commits with metadata and AI summaries

- `checkCredits` - Validates user credits against repository size
  - Input: `{ githubUrl: string, githubToken?: string }`
  - Returns: `{ fileCount: number, userCredits: number }`

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

**Team & User Management**
- `getTeamMembers` - Retrieves project team members
  - Input: `{ projectId: string }`
  - Returns: User-to-project relationships with user details

- `getMyCredits` - Gets current user's credit balance
  - Returns: `{ credits: number }`

### REST API Routes

Located in `src/app/api/` directory.

#### Meeting Processing (`POST /api/process-meeting`)
**Purpose**: Processes uploaded meeting audio files using AssemblyAI

**Authentication**: Required (Clerk)

**Request Body**:
```json
{
  "meetingUrl": "string",     // Firebase storage URL
  "projectId": "string",     // Associated project ID
  "meetingId": "string"      // Meeting record ID
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
