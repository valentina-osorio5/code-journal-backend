/* eslint-disable @typescript-eslint/no-unused-vars -- Remove me */
import 'dotenv/config';
import pg from 'pg';
import express from 'express';
import { ClientError, errorMiddleware } from './lib/index.js';
import { ClientRequest } from 'http';

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const app = express();
app.use(express.json());

app.get('/api/entries', async (req, res, next) => {
  console.log('/api/entries hit');
  try {
    const sql = `
    select * from "entries" order by "entryId" desc;
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

app.get('api/entries/:entryId', async (req, res, next) => {
  console.log('api/entries/:entryId hit');
  try {
    const { entryId } = req.params;
    console.log(entryId);

    if (!Number.isInteger(+entryId)) {
      throw new ClientError(400, `Non-integer entryId: ${entryId}`);
    }

    const sql = `
    select *
    from "entries"
    where "entryId" = $1
    `;

    const params = [entryId];
    const result = await db.query(sql, params);
    console.log(result.rows);
    const entry = result.rows[0];

    if (!entry) {
      throw new ClientError(400, `entryId ${entryId} not found`);
    }
    res.json(entry);
  } catch (err) {
    next(err);
  }
});

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`express server listening on port ${process.env.PORT}`);
});
