const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");
const { databasePath } = require("./config");

const dir = path.dirname(databasePath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

let initPromise;

async function getDb() {
  if (!initPromise) {
    console.log("getDb - initializing sql.js for the first time...");
    initPromise = (async () => {
      try {
        console.log("getDb - calling initSqlJs...");
        const SQL = await initSqlJs({
          locateFile: (file) => {
            const resolved = require.resolve(`sql.js/dist/${file}`);
            console.log("getDb - locateFile:", file, "->", resolved);
            return resolved;
          },
        });
        console.log("getDb - sql.js initialized");
        let db;
        if (fs.existsSync(databasePath)) {
          console.log("getDb - loading existing DB from:", databasePath);
          const fileData = fs.readFileSync(databasePath);
          db = new SQL.Database(new Uint8Array(fileData));
        } else {
          console.log("getDb - creating new DB in memory");
          db = new SQL.Database();
        }
        console.log("getDb - creating accounts table if not exists...");
        db.run(`
          CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            imap_host TEXT NOT NULL,
            imap_port INTEGER NOT NULL,
            imap_secure INTEGER NOT NULL,
            smtp_host TEXT NOT NULL,
            smtp_port INTEGER NOT NULL,
            smtp_secure INTEGER NOT NULL,
            enc_creds TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
        console.log("getDb - DB ready");
        return { SQL, db };
      } catch (err) {
        console.error("Failed to init sql.js DB", err);
        throw err;
      }
    })();
  }
  return initPromise;
}

function persist(db) {
  const data = db.export();
  fs.writeFileSync(databasePath, Buffer.from(data));
}

async function insertAccount(payload) {
  console.log("insertAccount - getting DB...");
  const { db } = await getDb();
  console.log("insertAccount - DB obtained");
  const timestamp = new Date().toISOString();
  console.log("insertAccount - preparing statement...");
  const stmt = db.prepare(
    `INSERT INTO accounts (username, imap_host, imap_port, imap_secure, smtp_host, smtp_port, smtp_secure, enc_creds, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  console.log("insertAccount - running insert...");
  stmt.run([
    payload.username,
    payload.imap_host,
    payload.imap_port,
    payload.imap_secure,
    payload.smtp_host,
    payload.smtp_port,
    payload.smtp_secure,
    payload.enc_creds,
    timestamp,
    timestamp,
  ]);
  stmt.free();
  console.log("insertAccount - fetching last insert ID...");
  const idStmt = db.prepare("SELECT last_insert_rowid() AS id");
  idStmt.step();
  const row = idStmt.getAsObject();
  console.log("insertAccount - last_insert_rowid result:", row);
  const cols = idStmt.getColumnNames();
  console.log("insertAccount - column names:", cols);
  idStmt.free();
  console.log("insertAccount - persisting DB...");
  persist(db);
  console.log("insertAccount - DB persisted");
  const idValue = row.id ?? row["last_insert_rowid()"] ?? row[cols[0]];
  console.log("insertAccount - returning ID:", idValue);
  return Number(idValue);
}

async function getAccount(id) {
  const { db } = await getDb();
  const stmt = db.prepare("SELECT * FROM accounts WHERE id = ?");
  stmt.bind([id]);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

async function updateAccountCreds(id, encCreds) {
  const { db } = await getDb();
  const stmt = db.prepare("UPDATE accounts SET enc_creds = ?, updated_at = ? WHERE id = ?");
  const timestamp = new Date().toISOString();
  stmt.run([encCreds, timestamp, id]);
  stmt.free();
  persist(db);
}

module.exports = {
  insertAccount,
  getAccount,
  updateAccountCreds,
};

