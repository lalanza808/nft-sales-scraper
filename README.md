# NFT Sales Scraper

This repo contains JavaScript code to scrape the Ethereum chain for sales for any number of ERC-721 or ERC-1155 compliant tokens. It also provides a simple website and API for visualizing sales and querying information across contracts and tokens, as well as posts notifications to Discord (and eventually Twitter).

## How It Works

`scraper.js` parses a list of contracts in [data/contracts.json](data/contracts.json.sample) with some user provided metadata (if ERC-1155, contract deployed block, contract address, etc) and begins an asynchronous loop to start scraping the chain at the last checked block. The script contains topic strings for relevant transfer events for ERC-721 and ERC-1155, as well as sales events from OpenSea (Wyvern and Seaport), LooksRare, and X2Y2 exchange contracts.

When the script finds a transfer event it stores the relevant transfer data (from, to, txHash, log index, contract, etc) in a SQLite database, in addition, it checks the transaction in which a transfer event occurred and parses the event logs for any sales that may have taken place.

A record of the block numbers checked is stored locally in `./storage` so that scanning resumes

## Data

The extracted data is structured the following way in the SQLite database:

```
------------------
events
------------------
contract    TEXT
event_type  TEXT
from_wallet TEXT
to_wallet   TEXT
token_id    NUMBER
amount      NUMBER
tx_date     TEXT
tx          TEXT
platform    TEXT
```

## Setup

### Secrets

Copy the `.env` file to `.env.local` to setup your local configuration, you'll need a geth node (Infura and Alchemy provide this with good free tiers). You can optionally provide a Discord webhook URL and turn on Discord posting.

### Contracts

Copy `data/contracts.json.sample` to `data/contracts.json` and modify it for the contracts you want to scrape. Be sure to define if the contract is ERC-721 or ERC-1155 to use the proper ABI and event source. Check Etherscan or some transaction explorer to get the block number in which the contract was deployed so your scraping can start at the beginning of that contract's existence.

## API

An API that serves the scraped data is implemented in the `src/server.js` file, for now, it serves a few endpoints:
* `/api/contracts` - parses the `data/contracts.json` file to return stored contract details.
* `/api/token/:contractAddress/:tokenId/history` - queries the SQLite database to return events for ${tokenId} in ${contractAddress} passed in the URL.
* `/api/latest` - queries the SQLite database to return the latest event (limited to 1).
* `/api/:contractAddress/data` - queries the SQLite database to return sales events from ${contractAddress} passed in the URL.
* `/api/:contractAddress/platforms` - queries the SQLite database to return sales events based upon the platform where the sale took place from ${contractAddress} passed in the URL.

You can start it using `npm run serve` or `npm start`, the latter of which will concurrently start the scraping processes as well as the web server.

The root of the web service is a simple representation of the sales events using [chart.js](https://chartjs.org/) and the above API.
