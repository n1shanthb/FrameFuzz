#!/usr/bin/env node
/** Resolves the exact EF funding intent with read-only calls. Never signs or broadcasts. */
import {mkdir,writeFile} from 'node:fs/promises';
import {prepareEfFundingPacket} from '../src/adapters/ef-funding.mjs';
const packet=await prepareEfFundingPacket();
await mkdir('runs',{recursive:true});
await writeFile('runs/step2b-ef-funding-packet.json',JSON.stringify(packet,null,2)+'\n');
console.log(JSON.stringify(packet,null,2));
