export function assertSwarmEnabled(env=process.env){
  if(env.FRAMEFUZZ_SWARM!=='on')throw new Error('Swarm disabled: set FRAMEFUZZ_SWARM=on explicitly');
}
export function rejectNetworkWrites(options={}){
  if(options.submit||options.deploy||options.publish)throw new Error('Milestones 1–2 are read-only. Separate human approval is required for deployment, broadcast and Arkiv writes.');
}
