const fs = require('fs');
const { ethers } = require('ethers');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

if (fs.existsSync('.env.local')) {
  require('dotenv').config({path: '.env.local'});
} else {
  console.warn('[!] No .env.local found, quitting.');
  process.exit();
}

const assetsBase = 'https://art101-assets.s3.us-west-2.amazonaws.com';

async function postDiscord(_q) {
  if (process.env.DISCORD_ACTIVE == 0) return
  try {
    const title = `Sale of token ${_q.tokenId} for ${_q.contractName}!`;
    const desc = `Purchased by ${shortenAddress(_q.targetOwner)} at <t:${Number(_q.txDate.getTime()) / 1000}> for ${ethers.utils.formatEther(_q.amount.toString())}Ξ on ${camelCase(_q.eventSource)}. [Etherscan](https://etherscan.io/tx/${_q.txHash})`;
    const url = `${assetsBase}/${_q.contractAddress}/${_q.tokenId.toString()}.json`;
    const metadata = await fetch(url)
      .then((r) => r.json());
    const imageURL = metadata.image.replace('ipfs://', `${assetsBase}/${_q.contractAddress}/`) + '.fullsize.png';
    const res = await fetch(process.env.DISCORD_WEBHOOK, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [
          {
            title: title,
            description: desc,
            image: {
              url: imageURL
            },
            url: `https://gallery.art101.io/collection/${_q.contractName}/${_q.tokenId}`
          }
        ]
      })
    });
    return `posted sale info to Discord: ${title} - ${desc} - ${imageURL}`;
  } catch(err) {
    throw new Error(`[!] Failed to post to Discord: ${err}`);
  }
}

function camelCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function shortenAddress(address) {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(address.length - 4, address.length)}`;
  if (address.startsWith('0x')) return shortAddress;
  return address;
}

module.exports = { postDiscord }
