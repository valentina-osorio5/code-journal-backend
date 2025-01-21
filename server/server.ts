/* eslint-disable @typescript-eslint/no-unused-vars -- Remove me */
import 'dotenv/config';
import pg from 'pg';
import express from 'express';
import { ClientError, errorMiddleware } from './lib/index.js';
import { ClientRequest } from 'http';
import { Entry } from '../client/src/data.js';
import argon2 from 'argon2';
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const hashKey = process.env.TOKEN_SECRET;
if (!hashKey) throw new Error('TOKEN_SECRET not found in .env');

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

app.get('/api/entries/:entryId', async (req, res, next) => {
  console.log('/api/entries/:entryId hit');
  try {
    const entryId = Number(req.params.entryId);
    console.log(entryId);
    if (!Number.isInteger(+entryId)) {
      throw new ClientError(400, `Non-integer entryId: ${entryId}`);
    }

    const sql = `
    select *
    from "entries"
    where "entryId" = $1;
    `;

    const params = [entryId];
    const result = await db.query(sql, params);
    console.log(result.rows);
    const [entry] = result.rows;

    if (!entry) {
      throw new ClientError(400, `entryId ${entryId} not found`);
    }
    res.json(entry);
  } catch (err) {
    next(err);
  }
});

app.post('/api/new-entry', async (req, res, next) => {
  console.log('/api/new-entry endpoint hit');
  try {
    const { title, notes, photoUrl } = req.body;
    if (!title || !notes || !photoUrl) {
      throw new ClientError(400, 'Missing title, notes, or photoUrl');
    }
    const sql = `
      insert into "entries" ("title", "notes", "photoUrl")
        values ($1, $2, $3)
        returning *;
    `;
    const params = [title, notes, photoUrl];
    const result = await db.query<Entry>(sql, params);
    const newEntry = result.rows[0];
    res.json(newEntry);
  } catch (err) {
    next(err);
  }
});

app.put('/api/entries/:entryId', async (req, res, next) => {
  console.log('/api/entries/:entryId update hit!');
  try {
    const { entryId } = req.params;
    if (!Number.isInteger(+entryId)) {
      throw new ClientError(400, `Non-integer entryId: ${entryId}`);
    }

    const { title, notes, photoUrl } = req.body;
    const sql = `
    update "entries"
    set "title" = $1, "notes" = $2, "photoUrl" = $3
    where "entryId" = $4
    returning *;
    `;

    const params = [title, notes, photoUrl, entryId];
    const result = await db.query(sql, params);
    console.log(result.rows);
    const updateEntry = result.rows[0];
    if (!updateEntry) {
      throw new ClientError(404, ` ${entryId} doesn't exist`);
    }
    res.json(updateEntry);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/entries/:entryId', async (req, res, next) => {
  console.log('/api/entries/:entryId delete hit');

  try {
    const { entryId } = req.params;
    if (!Number.isInteger(+entryId)) {
      throw new ClientError(400, `Non-integer entryId: ${entryId}`);
    }
    const sql = `
    delete from "entries" where "entryId" = $1 returning *;
    `;
    const params = [entryId];
    const result = await db.query(sql, params);
    console.log(result.rows);
    const deleteEntry = result.rows[0];
    if (!deleteEntry) {
      throw new ClientError(404, `entry ${entryId} doesn't exist!`);
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

// User Auth or Registration methods

app.post('/api/auth/sign-up', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ClientError(400, 'Username and Password are required.');
    }
    const hashedPassword = argon2.hash(password);
    const sql = `
      insert into "users" ("username","hashedPassword")
        values ($1,$2)
      returning "userId", "username", "createdAt";
    `;
    const params = [username, hashedPassword];
    const result = await db.query(sql, params);
    const newUser = result.rows[0];
    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
});

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`express server listening on port ${process.env.PORT}`);
});
