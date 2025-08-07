export interface RedisConfig {
  socket: {
    host: string;
    port: number;
    connectTimeout: number;
  };
  database: number;
  password?: string;
}
