import { Client } from 'langsmith';
import { traceable } from 'langsmith/traceable';


let langsmithClient: Client | null = null;

function initializeLangSmith() {
  if (!langsmithClient && process.env.LANGSMITH_API_KEY && process.env.LANGSMITH_TRACING === 'true') {
    try {
      langsmithClient = new Client({
        apiKey: process.env.LANGSMITH_API_KEY,
        apiUrl: process.env.LANGSMITH_ENDPOINT,
      });
      console.log('LangSmith tracing initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize LangSmith:', error);
    }
  }
  return langsmithClient;
}

// making sure tracing is only enabled if the env vars are set
export function isTracingEnabled(): boolean {
  return process.env.LANGSMITH_TRACING === 'true' && !!process.env.LANGSMITH_API_KEY;
}

//function to wrap AI functions and trace them
export function traceAICall<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    name: string;
    runType?: 'llm' | 'chain' | 'tool' | 'retriever' | 'embedding';
    tags?: string[];
    metadata?: Record<string, any>;
  }
): T {
  if (!isTracingEnabled()) {
    return fn; //return original function is langsmith tracing is not enabled
  }

  initializeLangSmith();

  // Create a traceable version of the function
  const tracedFn = traceable(
    fn,
    {
      name: options.name,
      run_type: options.runType || 'llm',
      tags: options.tags,
      metadata: {
        ...options.metadata,
        project: process.env.LANGSMITH_PROJECT,
      },
    }
  );

  return tracedFn as T;
}

//helper function to deal with Q&A function and trace them
export async function createRun<T>(
  operation: () => Promise<T>,
  options: {
    name: string;
    runType?: 'llm' | 'chain' | 'tool' | 'retriever' | 'embedding';
    inputs?: Record<string, any>;
    tags?: string[];
    metadata?: Record<string, any>;
  }
): Promise<T> {
  if (!isTracingEnabled()) {
    return operation();
  }

  const client = initializeLangSmith();
  if (!client) {
    return operation();
  }

  const runId = crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  try {
    await client.createRun({
      id: runId,
      name: options.name,
      run_type: options.runType || 'llm',
      inputs: options.inputs || {},
      start_time: startTime,
      extra: {
        metadata: {
          ...options.metadata,
          project: process.env.LANGSMITH_PROJECT,
          tags: options.tags,
        },
      },
    });

    const result = await operation();


    await client.updateRun(runId, {
      end_time: Date.now(),
      outputs: typeof result === 'string' ? { output: result } : 
                typeof result === 'object' && result !== null ? result : { result },
    });

    return result;
  } catch (error) {
    await client.updateRun(runId, {
      end_time: Date.now(),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
