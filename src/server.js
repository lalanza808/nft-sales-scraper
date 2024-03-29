const express = require('express');
const Database = require('better-sqlite3');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  require('dotenv').config({path: '.env.local'});
} else {
  console.warn('[!] No .env.local found, quitting.');
  process.exit();
}

const ALL_CONTRACTS = require('../data/contracts');
const db = new Database('./storage/sqlite.db', {readonly: true});
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use('/', express.static('public'));

app.use('/app', express.static('public'));

app.get('/api/contracts', (req, res) => {
  res.status(200).json(ALL_CONTRACTS)
})

app.get('/api/:contractAddress/events', (req, res) => {
  const results = [];
  const stmt = db.prepare(`select *
    from events
    where contract = '${req.params.contractAddress}'
    collate nocase
    and event_type == 'sale' or event_type == 'transfer'
    order by tx_date desc
    limit 100
    `);
  for (const entry of stmt.iterate()) {
    results.push(entry);
  }
  res.status(200).json(results);
});

app.get('/api/token/:contractAddress/:tokenId/history', (req, res) => {
  const results = [];
  const stmt = db.prepare(`select *
    from events
    where token_id = ${req.params.tokenId}
    and contract = '${req.params.contractAddress}'
    collate nocase
    order by tx_date desc
    `);
  for (const entry of stmt.iterate()) {
    results.push(entry);
  }
  res.status(200).json(results);
});

app.get('/api/latest', (req, res) => {
  const stmt = db.prepare(`select *
    from events
    order by tx_date desc
    limit 1
    `);
  res.status(200).json(stmt.get());
});

app.get('/api/:contractAddress/data', (req, res) => {
  const results = [];
  const stmt = db.prepare(`select
        date(tx_date) date,
        sum(amount/1000000000000000000.0) volume,
        avg(amount/1000000000000000000.0) average_price,
        (select avg(amount/1000000000000000000.0) from (select * from events
          where event_type == 'sale'
          and contract = '${req.params.contractAddress}'
          collate nocase
          and date(tx_date) = date(ev.tx_date)
          order by amount
          limit 10)) floor_price,
        count(*) sales
    from events ev
    where event_type == 'sale'
    and contract = '${req.params.contractAddress}'
    collate nocase
    group by date(tx_date)
    order by date(tx_date)
    `);
  for (const entry of stmt.iterate()) {
    results.push(entry);
  }
  res.status(200).json(results);
});

app.get('/api/:contractAddress/platforms', (req, res) => {
  const results = [];
  const stmt = db.prepare(`select platform,
    sum(amount/1000000000000000000.0) volume,
    count(*) sales
    from events
    where event_type = 'sale'
    and contract = '${req.params.contractAddress}'
    collate nocase
    group by platform
    order by sum(amount/1000000000000000000.0) desc
  `);
  for (const entry of stmt.iterate()) {
    results.push(entry);
  }
  res.status(200).json(results);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
