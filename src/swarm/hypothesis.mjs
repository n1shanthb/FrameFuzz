const text={type:'string',minLength:1,maxLength:600};
export const HYPOTHESIS_SCHEMA={type:'object',additionalProperties:false,required:['suite','assumption','change','operation','parameter','unsafePrediction','safePrediction','falsifier','revision'],properties:{
 suite:{type:'string',enum:['frame-authorization','verification-gas','uniswap-storage']},assumption:text,change:{type:'string',enum:['operation','parameter','both']},
 operation:{type:'integer',minimum:0,maximum:65535},parameter:{type:'integer',minimum:0,maximum:1000000},
 unsafePrediction:{type:'string',enum:['OWNER_RECOVERED','OWNER_NOT_RECOVERED']},safePrediction:{type:'string',enum:['OWNER_RECOVERED','OWNER_NOT_RECOVERED']},falsifier:text,revision:text,
}};
export function validateHypothesis(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==HYPOTHESIS_SCHEMA.required.length||Object.keys(value).some(k=>!HYPOTHESIS_SCHEMA.required.includes(k)))throw new Error('Hypothesis must match the strict field allowlist');
 for(const [key,s]of Object.entries(HYPOTHESIS_SCHEMA.properties)){const x=value[key];if(s.type==='string'&&(typeof x!=='string'||x.length<1||x.length>(s.maxLength??100)||s.enum&&!s.enum.includes(x)))throw new Error('Invalid hypothesis '+key);if(s.type==='integer'&&(!Number.isSafeInteger(x)||x<s.minimum||x>s.maximum))throw new Error('Out-of-range hypothesis '+key);}
 if(value.operation===1&&value.parameter===10)throw new Error('Hypothesis must mutate the authorized action');
 const change=value.operation===1?'parameter':value.parameter===10?'operation':'both';if(change!==value.change)throw new Error('Declared mutation fields do not match actual values');
 return structuredClone(value);
}
export const hypothesisKey=h=>`${h.operation}:${h.parameter}`;
export const PERSPECTIVES=[
 {id:'validation',name:'Validation Researcher',focus:'Inspect signature commitment, omitted calldata, execution approval and frame layout.'},
 {id:'state',name:'State Researcher',focus:'Inspect nonce isolation, immutable context, payer scope and state-drift limitations. Stay within executable calldata tests.'},
 {id:'differential',name:'Differential Researcher',focus:'Compare safe/unsafe authorization and distinguish hash-profile compatibility, policy claims and actual offline evidence.'},
];
