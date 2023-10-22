const { randomBytes } = require("crypto");
const { default: migrate } = require("node-pg-migrate");
const format = require("pg-format");

const pool = require("../pool");

DETAULT_OPTS = {
  host: "localhost",
  port: 5432,
  database: "socialnetwork-test",
  user: "postgres",
  password: "postgres",
};

class Context {
  static async build() {
    const roleName = "a" + randomBytes(4).toString("hex");

    await pool.connect(DETAULT_OPTS);

    await pool.query(`
    CREATE ROLE ${roleName} WITH LOGIN PASSWORD '${roleName}';
  `);

    await pool.query(`
    CREATE SCHEMA ${roleName} AUTHORIZATION ${roleName};
  `);

    await pool.close();

    await migrate({
      schema: roleName,
      dir: "migrations",
      direction: "up",
      noLock: true,
      //log: () => {},
      databaseUrl: {
        host: "localhost",
        port: 5432,
        database: "socialnetwork-test",
        user: roleName,
        password: roleName,
      },
    });

    await pool.connect({
      host: "localhost",
      port: 5432,
      database: "socialnetwork-test",
      user: roleName,
      password: roleName,
    });

    return new Context(roleName);
  }

  constructor(roleName) {
    this.roleName = roleName;
  }

  async close() {
    await pool.close();

    await pool.connect(DETAULT_OPTS);

    await pool.query(`
      DROP SCHEMA ${this.roleName} CASCADE 
    `);

    await pool.query(`
    DROP ROLE ${this.roleName} 
  `);

    await pool.close();
  }
}

module.exports = Context;
