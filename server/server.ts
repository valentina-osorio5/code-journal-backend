/* eslint-disable @typescript-eslint/no-unused-vars -- Remove me */
import 'dotenv/config';
import pg from 'pg';
import express from 'express';
import { ClientError, errorMiddleware } from './lib/index.js';

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const app = express();
app.use(express.json());

app.get('/', async (req, res, next) => {
  console.log('/api/entries hit');
  try {
    const sql = `
    select "entryId", "notes", "title", "photoUrl"
    from "entries"
    `;

    const result = await db.query(sql);
    console.log(result.rows);
    const entries = result.rows;

    if (!entries) {
      throw new ClientError(400, `No entries found`);
    }
    res.json(entries);
  } catch (err) {
    next(err);
  }
});

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`express server listening on port ${process.env.PORT}`);
});
