import { createClient } from 'redis';
import config from './index';
import logger from '../utils/logger';

const redisClient = createClient({
  url: config.redis.url,
  password: config.redis.password,
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

redisClient.on('ready', () => {
  logger.info('Redis Client Ready');
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis Client Reconnecting');
});

// Connect to Redis
export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redisClient.quit();
  logger.info('Redis connection closed');
});

export default redisClient;
