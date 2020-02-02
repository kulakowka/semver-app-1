const fastify = require("fastify")({ logger: true });

const schema = {
  type: "object",
  required: ["PORT"],
  properties: {
    PORT: {
      type: "string",
      default: 3000
    }
  }
};

const options = {
  // confKey: "config", // optional, default: 'config'
  schema: schema
  // data: data // optional, default: process.env
};

fastify.register(require("fastify-env"), options).ready(err => {
  if (err) console.error(err);

  console.log(fastify.config); // or fastify[options.confKey]
  // output: { PORT: 3000 }
});

fastify.register(require("fastify-sensible"));

fastify.register(require("fastify-jwt"), {
  secret: "supersecret"
});

fastify.register(require("fastify-cookie"), {
  secret: "my-secret", // for cookies signature
  parseOptions: {} // options for parsing cookies
});

fastify.get("/cookie", (req, reply) => {
  const aCookieValue = req.cookies.cookieName;
  const bCookieValue = reply.unsignCookie(req.cookies.cookieSigned);
  reply.setCookie("foo", "foo", {
    domain: "example.com",
    path: "/"
  });
  setCookie("bar", "bar", {
    path: "/",
    signed: true
  }).send({ hello: "world" });
});

fastify.register(require("fastify-rate-limit"), {
  // global: true, // default true
  // max: 3, // default 1000
  // ban: 2, // default null
  // timeWindow: 5000, // default 1000 * 60
  // cache: 10000, // default 5000
  // whitelist: ["127.0.0.1"], // default []
  // redis: new Redis({ host: "127.0.0.1" }), // default null
  // skipOnError: true, // default false
  // keyGenerator: function(req) {
  //   /* ... */
  // }, // default (req) => req.raw.ip
  // errorResponseBuilder: function(req, context) {
  //   /* ... */
  // },
  addHeaders: {
    // default show all the response headers when rate limit is reached
    "x-ratelimit-limit": true,
    "x-ratelimit-remaining": true,
    "x-ratelimit-reset": true,
    "retry-after": true
  }
});

fastify.register(require("fastify-swagger"), {
  routePrefix: "/documentation",
  swagger: {
    info: {
      title: "Test swagger",
      description: "testing the fastify swagger api",
      version: "0.1.0"
    },
    externalDocs: {
      url: "https://swagger.io",
      description: "Find more info here"
    },
    host: "localhost",
    schemes: ["http"],
    consumes: ["application/json"],
    produces: ["application/json"],
    tags: [
      { name: "user", description: "User related end-points" },
      { name: "code", description: "Code related end-points" }
    ],
    securityDefinitions: {
      apiKey: {
        type: "apiKey",
        name: "apiKey",
        in: "header"
      }
    }
  },
  exposeRoute: true
});

fastify.put(
  "/some-route/:id",
  {
    schema: {
      description: "post some data",
      tags: ["user", "code"],
      summary: "qwerty",
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "user id"
          }
        }
      },
      body: {
        type: "object",
        properties: {
          hello: { type: "string" },
          obj: {
            type: "object",
            properties: {
              some: { type: "string" }
            }
          }
        }
      },
      response: {
        201: {
          description: "Successful response",
          type: "object",
          properties: {
            hello: { type: "string" }
          }
        }
      },
      security: [
        {
          apiKey: []
        }
      ]
    }
  },
  (req, reply) => {}
);

fastify.route({
  method: "GET",
  url: "/",
  schema: {
    querystring: {
      name: { type: "string" }
    },
    response: {
      200: {
        type: "object",
        properties: {
          hello: { type: "string" }
        }
      }
    }
  },
  // preHandler: async (request, reply) => {
  //   // E.g. check authentication
  // },
  handler: async (request, reply) => {
    return { hello: "world" };
  }
});

fastify.get("/404", (req, reply) => {
  reply.notFound();
});

fastify.get("/async", async (req, reply) => {
  throw fastify.httpErrors.notFound();
});

fastify.post("/signup", (req, reply) => {
  const payload = "123";
  const token = fastify.jwt.sign({ payload });

  reply.send({ token });
});

const start = async () => {
  try {
    await fastify.listen(3000);
    fastify.log.info(`server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
