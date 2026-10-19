import fastify, { initPromise } from './index';

export default async function handler(req: any, res: any) {
  await initPromise;
  await fastify.ready();
  fastify.server.emit('request', req, res);
}
