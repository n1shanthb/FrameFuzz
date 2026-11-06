import {replayRegression} from './experiment.mjs';
let input='';try{for await(const chunk of process.stdin){input+=chunk;if(input.length>65536)throw new Error('Descriptor too large');}console.log(JSON.stringify(await replayRegression(JSON.parse(input))));}
catch{console.error('Independent replay failed schema, source or semantic verification');process.exitCode=1;}
