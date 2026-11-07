export class ApiError extends Error {
  constructor(status,code,message){super(message);this.status=status;this.code=code;}
}
export async function readJsonObject(req,allowed,maxBytes=4096){
  return readDeadline(async()=>{
  let size=0;const chunks=[];
  for await(const chunk of req){size+=chunk.length;if(size>maxBytes)throw new ApiError(413,'INPUT_TOO_LARGE','Selection too large');chunks.push(chunk);}
  let value;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new ApiError(400,'INVALID_JSON','Invalid JSON selection');}
  if(!value||Array.isArray(value)||typeof value!=='object'||Object.keys(value).some(k=>!allowed.includes(k)))throw new ApiError(400,'INVALID_SELECTION','Expected an object with supported selection fields only');
  return value;
  },5000,new ApiError(408,'BODY_TIMEOUT','Selection body deadline exceeded'));
}
export async function readDeadline(operation,timeoutMs,error=new ApiError(504,'READ_TIMEOUT','Read deadline exceeded; no admission decision or broadcast is implied')){
  let timer;
  try{return await Promise.race([Promise.resolve().then(operation),new Promise((_,reject)=>{timer=setTimeout(()=>reject(error),timeoutMs);})]);}
  finally{clearTimeout(timer);}
}
