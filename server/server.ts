/* eslint-disable @typescript-eslint/no-unused-vars -- Remove me */
import 'dotenv/config';
import pg, { Client } from 'pg';
import express from 'express';
import { authMiddleware, ClientError, errorMiddleware } from './lib/index.js';
import argon2, { hash } from 'argon2';
import jwt from 'jsonwebtoken';

type User = {
  userId: number;
  username: string;
  hashedPassword: string;
};
type Auth = {
  username: string;
  password: string;
};
type Entry = {
  entryId: number;
  title: string;
  notes: string;
  photoUrl: string;
};

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

app.get('/api/entries', authMiddleware, async (req, res, next) => {
  console.log('/api/entries hit');
  try {
    const sql = `
    select * from "entries"
    where "userId" = $1
    order by "entryId" desc;
    `;

    const result = await db.query(sql, [req.user?.userId]);
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

app.get('/api/entries/:entryId', authMiddleware, async (req, res, next) => {
  console.log('/api/entries/:entryId hit');
  try {
    const entryId = Number(req.params.entryId);
    validateEntryId(entryId);
    console.log(entryId);
    if (!Number.isInteger(+entryId)) {
      throw new ClientError(400, `Non-integer entryId: ${entryId}`);
    }

    const sql = `
    select *
    from "entries"
    where "entryId" = $1 and "userId" = $2;
    `;

    // const params = [entryId];
    const result = await db.query(sql, [entryId, req.user?.userId]);
    console.log(result.rows);
    const [entry] = result.rows;
    // validateFound(entry, entryId);
    if (!entry) {
      throw new ClientError(400, `entryId ${entryId} not found`);
    }
    res.status(200).json(entry);
  } catch (err) {
    next(err);
  }
});

app.post('/api/new-entry', authMiddleware, async (req, res, next) => {
  console.log('/api/new-entry endpoint hit');
  try {
    const { title, notes, photoUrl } = req.body;
    if (!title || !notes || !photoUrl) {
      throw new ClientError(400, 'Missing title, notes, or photoUrl');
    }
    const sql = `
      insert into "entries" ("userId","title", "notes", "photoUrl")
        values ($1, $2, $3, $4)
        returning *;
    `;
    const params = [req.user?.userId, title, notes, photoUrl];
    const result = await db.query<Entry>(sql, params);
    const newEntry = result.rows[0];
    res.status(201).json(newEntry);
  } catch (err) {
    next(err);
  }
});

app.put('/api/entries/:entryId', authMiddleware, async (req, res, next) => {
  console.log('/api/entries/:entryId update hit!');
  try {
    const { entryId } = req.params;
    if (!Number.isInteger(+entryId)) {
      throw new ClientError(400, `Non-integer entryId: ${entryId}`);
    }

    const { title, notes, photoUrl } = req.body;
    if (!title || !notes || !photoUrl) {
      throw new ClientError(400, `Title, notes and photoUrl are required`);
    }

    const sql = `
    update "entries"
    set "title" = $1,
        "notes" = $2,
        "photoUrl" = $3
    where "entryId" = $4 and "userId" = $5
    returning *;
    `;

    const params = [title, notes, photoUrl, entryId, req.user?.userId];
    const result = await db.query<Entry>(sql, params);
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

app.delete('/api/entries/:entryId', authMiddleware, async (req, res, next) => {
  console.log('/api/entries/:entryId delete hit');

  try {
    const { entryId } = req.params;
    // validateEntryId(entryId);
    if (!Number.isInteger(+entryId)) {
      throw new ClientError(400, `Non-integer entryId: ${entryId}`);
    }
    const sql = `
    delete from "entries" where "entryId" = $1 and "userId" = $2
    returning *;
    `;
    const params = [entryId, req.user?.userId];
    const result = await db.query<Entry>(sql, params);
    console.log(result.rows);
    const deleteEntry = result.rows[0];
    if (!deleteEntry) {
      throw new ClientError(404, `entry ${entryId} doesn't exist!`);
    }
    // validateFound(deleteEntry, entryId);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

// User Auth or Registration methods

app.post('/api/auth/sign-up', async (req, res, next) => {
  console.log('/api/auth/sign-up endpoint hit!');
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ClientError(400, 'Username and Password are required.');
    }
    const hashedPassword = await argon2.hash(password);
    console.log(hashedPassword);
    const sql = `
      insert into "users" ("username","hashedPassword")
        values ($1,$2)
      returning "userId", "username", "createdAt";
    `;
    const params = [username, hashedPassword];
    const result = await db.query<User>(sql, params);
    const newUser = result.rows;
    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/sign-in', async (req, res, next) => {
  console.log('/api/auth/sign-in endpoint hit!');

  try {
    const { username, password } = req.body as Partial<Auth>;
    if (!username || !password) {
      throw new ClientError(401, `Invalid login!`);
    }

    const sql = `
    select "userId", "hashedPassword"
      from "users"
      where "username" = $1
    `;
    const params = [username];
    const result = await db.query<User>(sql, params);
    const [user] = result.rows;
    if (!user) {
      throw new ClientError(401, `Invalid login!`);
    }
    const { userId, hashedPassword } = user;
    if (!(await argon2.verify(hashedPassword, password))) {
      throw new ClientError(401, `Invalid login!`);
    }
    const payload = { userId, username };
    const token = jwt.sign(payload, hashKey);
    res.json({ token, user: payload });
  } catch (err) {
    next(err);
  }
});

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`express server listening on port ${process.env.PORT}`);
});

function validateEntryId(entryId: number): void {
  if (!Number.isInteger(entryId) || entryId <= 0) {
    throw new ClientError(400, '"entryId" must be a postive integer');
  }
}

function validateEntry(entry: Entry): void {
  const { title, notes, photoUrl } = entry;
  if (!title || !notes || !photoUrl) {
    throw new ClientError(
      400,
      '"title", "notes", and "photoUrl" are required fields'
    );
  }
}

function validateFound(entry: Entry, entryId: number): void {
  if (!entry) {
    throw new ClientError(404, `Entry with id ${entryId} not found`);
  }
}
