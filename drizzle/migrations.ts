const migrations = {
  journal: {
    entries: [
      {
        idx: 0,
        version: "1",
        when: 0,
        tag: "0000_milky_bushwacker",
      },
    ],
  },
  migrations: {
    "0000_milky_bushwacker": {
      sql: `CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` text PRIMARY KEY NOT NULL,
        \`email\` text NOT NULL,
        \`name\` text NOT NULL,
        \`avatar_url\` text,
        \`timezone\` text NOT NULL
      );`,
    },
  },
};

export default migrations;