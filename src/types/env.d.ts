// Environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    ADMIN_PASSWORD: string;
    CLIENT_PASSWORDS: string; // JSON string of client passwords
    NODE_ENV: 'development' | 'production' | 'test';
  }
}