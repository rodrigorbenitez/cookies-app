import { describe, expect, it } from 'vitest';
import { cleanDatabaseUrl } from './url.js';

describe('cleanDatabaseUrl', () => {
  it('removes channel_binding but keeps sslmode', () => {
    const out = cleanDatabaseUrl('postgresql://u:p@ep-x.eu-central-1.aws.neon.tech/db?sslmode=require&channel_binding=require');
    expect(out).toBe('postgresql://u:p@ep-x.eu-central-1.aws.neon.tech/db?sslmode=require');
  });

  it('leaves plain URLs unchanged', () => {
    expect(cleanDatabaseUrl('postgresql://user:password@localhost:5432/cookbook')).toBe(
      'postgresql://user:password@localhost:5432/cookbook',
    );
  });
});
