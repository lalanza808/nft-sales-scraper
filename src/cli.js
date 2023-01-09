const fs = require('fs');

const ALL_CONTRACTS = require('../data/contracts');
const BLOCKS_PER_HOUR = 300;
const ARGS = process.argv.slice(2);

switch (ARGS[0]) {
    case 'rewind':
        if (isNaN(ARGS[1])) {
          console.log('Invalid argument passed. Provide the number of hours you would like to rewind syncing to.');
          break;
        }
        const rewindBlocks = BLOCKS_PER_HOUR * Number(ARGS[1]);
        for(const key in ALL_CONTRACTS) {
            if (process.env.ONLY && process.env.ONLY != key) continue
            const lastFile = `./storage/lastBlock.${key}.txt`;
            const currentBlock = fs.readFileSync(lastFile);
            const newBlock = Number(currentBlock) - rewindBlocks;
            console.log(`Rewinding ${lastFile} ${rewindBlocks} blocks (${newBlock})`);
            fs.writeFileSync(lastFile, newBlock.toString());
        }
        break;
}