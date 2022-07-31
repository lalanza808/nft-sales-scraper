const Database = require('better-sqlite3');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  require('dotenv').config({path: '.env.local'});
} else {
  console.warn('[!] No .env.local found, quitting.');
  process.exit();
}

const db = new Database('./storage/sqlite.db');
const backupPath = './storage/backup.json';

let l = process.argv.filter((val, idx, arr) => idx == 2)[0]
if (l == 'backup') {
  console.log(`performing backup of SQLite data to ${backupPath}`);
  const results = [];
  const stmt = db.prepare(`SELECT * FROM events ORDER BY tx_date DESC`);
  for (const entry of stmt.iterate()) {
    results.push(entry);
  }
  fs.writeFileSync(backupPath, JSON.stringify(results));
  console.log(`[+] Wrote ${results.length} records to ${backupPath}`);
} else if (l == 'restore') {
  console.log(`restoring backup of SQLite data from ${backupPath}`);
  const backupData = require('../storage/backup.json');
  console.log(`deleting old data first`);
  const deleteEvents = db.prepare(`DELETE FROM events where event_type != 'yolo'`);
  deleteEvents.run();
  console.log(`inserting new data from backup file`)
  const insertEvent = db.prepare('INSERT INTO events (contract, event_type, from_wallet, to_wallet, token_id, amount, tx_date, tx, log_index, platform, discord_sent, twitter_sent) VALUES (@contract, @event_type, @from_wallet, @to_wallet, @token_id, @amount, @tx_date, @tx, @log_index, @platform, @discord_sent, @twitter_sent)');
  const insertEvents = db.transaction((events) => {
    for (let ev of events) {
      if (!ev.discord_sent) {
        ev.discord_sent = 0;
      }
      if (!ev.twitter_sent) {
        ev.twitter_sent = 0;
      }
      insertEvent.run(ev)
    };
  });
  insertEvents(backupData);
} else {
  console.log(`[!] Invalid arguments provided, quitting!`)
  process.exit();
}
