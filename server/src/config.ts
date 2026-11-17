import path from 'node:path';

/** All configuration comes from environment variables. Values are never logged. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export const config = {
  get databaseUrl() {
    return required('DATABASE_URL');
  },
  port: Number(process.env.PORT ?? 3000),
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? './data/uploads'),
  // Safe default: hide error details unless explicitly running in development or test.
  isProduction: !['development', 'test'].includes(process.env.NODE_ENV ?? ''),
};
