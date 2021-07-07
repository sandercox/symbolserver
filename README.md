# Symbol Server
A Simple Symbol Server Docker project that can import and serve symbols from a path.

# Environment

| Variable | Meaning | Default |
| ---- | ----- | ---- |
| PORT | Port the server listens on | `3000` |
| STORAGE_ROOT | Location where files are stored / located | `../storage` |
| DB_CONN | Sequelize database connection string | `sqlite:${storageRoot}/symbolstore.db`
