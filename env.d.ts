declare namespace NodeJS {
  interface ProcessEnv {
    GEMINI_API_KEY?: string;
    NETLIFY_FUNCTION_SECRET?: string;
    NODE_VERSION?: string;
  }
}

declare var process: {
  env: NodeJS.ProcessEnv;
};
