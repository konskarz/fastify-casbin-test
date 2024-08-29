'use strict'

/** @param {import('fastify').FastifyInstance} app */
export default async function index(app, opts) {
  app.register(import('@fastify/jwt'), { secret: process.env.JWT_SECRET })
  await app.register(import('fastify-casbin'), {
    model: 'rest_model.conf',
    adapter: 'rest_policy.csv'
  })
  app.casbin.addFunction('timeMatch', (startTime, endTime) => {
    const now = new Date()
    if (startTime !== '_') {
      const start = new Date(startTime)
      if (isNaN(start.getTime()) || !(now > start)) return false
    }
    if (endTime !== '_') {
      const end = new Date(endTime)
      if (isNaN(end.getTime()) || !(now < end)) return false
    }
    return true
  })
  app.register(import('fastify-casbin-rest'), {
    getSub: (r) => r.user.payload.username
  })
  app.post('/login', async (request, reply) => {
    return app.jwt.sign({ payload: { username: 'alice' } })
  })
  app.register(async function authenticated(app, opts) {
    app.addHook('onRequest', (request) => request.jwtVerify())
    app.get(
      '/alice_data',
      { casbin: { rest: true } },
      async (request) => `You're in ${request.routerPath}!`
    )
  })
}
