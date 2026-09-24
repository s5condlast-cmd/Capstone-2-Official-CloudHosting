import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import express from 'express';

process.env.SUPABASE_URL = 'https://auth-test.invalid';
process.env.SUPABASE_ANON_KEY = 'test-anon';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service';
process.env.APP_URL = 'http://localhost:3000';
const networkFetch = globalThis.fetch;
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
let role = 'admin';
let active = true;
let needsPassword = false;
let sessionValid = true;
let rpcFailure = false;
let writes: string[] = [];
let authCreateFailure = false;
let profileWriteFailure = false;
let createdPasswords: string[] = [];
let authUpdateFailure = false;
let updatedPasswords: string[] = [];
let profileUpdates: Record<string,unknown>[] = [];
let mfaFactors: {id:string;status:string;factor_type:string}[] = [];
let mfaDeleteFailure = false;
const createdId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const token = (aal = 'aal2') => `header.${Buffer.from(JSON.stringify({sub:id,aal,role:'admin',session_id:id})).toString('base64url')}.signature`;
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  assert.equal(url.hostname, 'auth-test.invalid', 'No real provider calls are allowed in these tests');
  const json = (body: unknown, status=200) => new Response(JSON.stringify(body), {status,headers:{'Content-Type':'application/json'}});
  if (url.pathname === '/auth/v1/user') {
    if (request.headers.get('authorization') === 'Bearer invalid') return json({message:'Invalid JWT'},401);
    return json({id,email:'test@example.invalid',aud:'authenticated',app_metadata:{},user_metadata:{},created_at:new Date().toISOString()});
  }
  if (url.pathname === '/rest/v1/rpc/current_session_is_valid') return rpcFailure ? json({message:'Unavailable'},500) : json(sessionValid);
  if (url.pathname === '/rest/v1/profiles') {
    if (request.method !== 'GET') {
      writes.push('profile-write');
      profileUpdates.push(await request.json() as Record<string,unknown>);
      if (profileWriteFailure) return json({message:'Write denied'},503);
      return json(request.method === 'PATCH' ? {id:createdId} : [], request.method === 'POST' ? 201 : 200);
    }
    if (url.searchParams.has('email')) return json(null);
    return json({id,email:'test@example.invalid',full_name:'Test',role,status:active?'Active':'Suspended',is_activated:active,requires_password_change:needsPassword});
  }
  if (url.pathname === '/rest/v1/security_audit_log') return json([],201);
  if (url.pathname === '/auth/v1/admin/users' && request.method === 'POST') {
    writes.push('create-user');
    const payload = await request.json() as {email:string;password:string};
    createdPasswords.push(payload.password);
    if (authCreateFailure) return json({message:'Account creation unavailable'},503);
    return json({id:createdId,email:payload.email,user_metadata:{},app_metadata:{},created_at:new Date().toISOString()});
  }
  const factorPath = /^\/auth\/v1\/admin\/users\/([^/]+)\/factors(?:\/([^/]+))?$/.exec(url.pathname);
  if (factorPath) {
    if (request.method === 'GET') return json(mfaFactors);
    if (request.method === 'DELETE') {
      writes.push('delete-factor');
      if (mfaDeleteFailure) return json({message:'Factor removal unavailable'},503);
      mfaFactors=mfaFactors.filter(f=>f.id!==factorPath[2]); return json({});
    }
  }
  if (url.pathname.startsWith('/auth/v1/admin/users/')) {
    const targetId=url.pathname.split('/').at(-1)!;
    if (request.method === 'GET') return json({id:targetId,email:'target@example.invalid',user_metadata:{},app_metadata:{},created_at:new Date().toISOString()});
    if (request.method === 'PUT') {
      writes.push('update-user');
      const payload=await request.json() as {password:string}; updatedPasswords.push(payload.password);
      return authUpdateFailure ? json({message:'Password update unavailable'},503)
        : json({id:targetId,email:'target@example.invalid',user_metadata:{},app_metadata:{},created_at:new Date().toISOString()});
    }
    if (request.method === 'DELETE') { writes.push('delete-user'); return json({user:null}); }
  }
  if (url.pathname === '/auth/v1/token' && request.method === 'POST') return json({access_token:'reauth-token',refresh_token:'refresh-token',expires_in:3600,
    token_type:'bearer',user:{id,email:'test@example.invalid',aud:'authenticated',app_metadata:{},user_metadata:{},created_at:new Date().toISOString()}});
  if (url.pathname === '/auth/v1/logout' && request.method === 'POST') return json({});
  throw new Error(`Unexpected mocked request: ${request.method} ${url.pathname}`);
};
const { default: authRouter, generateTemporaryPassword } = await import('../backend/routes/auth');
const { default: templatesRouter, isValidTemplateId } = await import('../backend/routes/templates');
const { default: analyzeRouter } = await import('../backend/routes/analyze');
const { default: oneDriveRouter } = await import('../backend/routes/onedrive');
const { default: attendanceRouter } = await import('../backend/routes/attendance');
const app=express(); app.use(express.json());
app.use('/api',authRouter,templatesRouter,analyzeRouter,oneDriveRouter,attendanceRouter);
const server=app.listen(0,'127.0.0.1');
await new Promise<void>(resolve=>server.once('listening',resolve));
const address=server.address();
if (!address || typeof address==='string') throw new Error('Missing listener');
const base=`http://127.0.0.1:${address.port}/api`;
after(async()=>{globalThis.fetch=networkFetch; await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));});
beforeEach(()=>{role='admin';active=true;needsPassword=false;sessionValid=true;rpcFailure=false;writes=[];
  authCreateFailure=false;profileWriteFailure=false;createdPasswords=[];authUpdateFailure=false;updatedPasswords=[];profileUpdates=[];
  mfaFactors=[];mfaDeleteFailure=false;});
function call(path:string, method='GET', bearer?:string, body?:unknown) {
  return networkFetch(base+path,{method,headers:{'Content-Type':'application/json',...(bearer?{Authorization:`Bearer ${bearer}`}:{})},body:body?JSON.stringify(body):undefined,redirect:'manual'});
}
for(const path of ['login','send-otp','verify-otp','verify-totp','enroll-mfa','register-student','reset-password']) {
  test(`legacy ${path} cannot authenticate or modify an account`,async()=>{
    const response=await call(`/auth/${path}`,'POST',undefined,{email:'test@example.invalid',password:'123',otp:'123456',code:'123456'});
    assert.equal(response.status,410); assert.deepEqual(writes,[]);
  });
}
test('protected APIs reject anonymous access',async()=>{
  for(const [path,method] of [['/users','GET'],['/users','POST'],['/templates/upload','POST'],['/analyze','POST'],['/onedrive/files','GET'],['/onedrive/auth/login','GET'],['/attendance','GET'],['/attendance/time-in','POST']])
    assert.equal((await call(path,method)).status,401,path);
});
test('invalid token cannot read account information',async()=>assert.equal((await call('/auth/me','GET','invalid')).status,401));
test('verified identity can see its pending MFA step but cannot use admin APIs',async()=>{
  const me=await call('/auth/me','GET',token('aal1'));
  assert.equal(me.status,200); assert.equal((await me.json()).portalReady,false);
  assert.equal((await call('/users','GET',token('aal1'))).status,403);
});
test('role comes from database, not caller JWT role',async()=>{role='student';assert.equal((await call('/users','GET',token())).status,403);});
test('suspended accounts fail closed',async()=>{active=false;assert.equal((await call('/auth/me','GET',token())).status,403);});
test('required password change blocks portal APIs',async()=>{needsPassword=true;assert.equal((await call('/users','GET',token())).status,403);});
test('revoked session cannot access account',async()=>{sessionValid=false;assert.equal((await call('/auth/me','GET',token())).status,401);});
test('missing migration does not fall back to demo access',async()=>{rpcFailure=true;assert.equal((await call('/auth/me','GET',token())).status,503);});
test('authorized administrator reaches portal',async()=>{const response=await call('/auth/me','GET',token());assert.equal((await response.json()).portalReady,true);});
test('direct account creation returns one unique strong temporary password without sending an invitation',async()=>{
  const response=await call('/users','POST',token(),{email:'new@example.invalid',name:'New User',role:'Student'});
  assert.equal(response.status,201); assert.equal(response.headers.get('cache-control'),'no-store');
  const body=await response.json();
  assert.equal(body.temporaryPassword,createdPasswords[0]);
  assert.match(body.temporaryPassword,/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/);
  assert.deepEqual(writes,['create-user','profile-write']);
});
test('temporary password generation is unique and policy compliant',()=>{
  const passwords=new Set(Array.from({length:100},()=>generateTemporaryPassword()));
  assert.equal(passwords.size,100);
  for(const password of passwords) assert.match(password,/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{20}$/);
});
test('authentication creation failures are not reported as success',async()=>{
  authCreateFailure=true;
  const response=await call('/users','POST',token(),{email:'new@example.invalid',name:'New User',role:'Student'});
  assert.equal(response.status,400);assert.deepEqual(writes,['create-user']);
});
test('profile provisioning failure removes the incomplete authentication account',async()=>{
  profileWriteFailure=true;
  const response=await call('/users','POST',token(),{email:'new@example.invalid',name:'New User',role:'Student'});
  assert.equal(response.status,503);assert.equal((await response.json()).temporaryPassword,undefined);
  assert.deepEqual(writes,['create-user','profile-write','delete-user']);
});
test('administrator password reset blocks the profile, revokes sessions, and returns one credential',async()=>{
  const response=await call(`/users/${createdId}/reset-password`,'POST',token());
  assert.equal(response.status,200); assert.equal(response.headers.get('cache-control'),'no-store');
  const body=await response.json(); assert.equal(body.temporaryPassword,updatedPasswords[0]);
  assert.equal(profileUpdates.length,2);
  for(const update of profileUpdates) {
    assert.equal(update.requires_password_change,true); assert.equal(typeof update.sessions_revoked_before,'string');
  }
  assert.deepEqual(writes,['profile-write','update-user','profile-write']);
});
test('failed authentication password reset leaves the profile blocked and does not disclose a credential',async()=>{
  authUpdateFailure=true;
  const response=await call(`/users/${createdId}/reset-password`,'POST',token());
  assert.equal(response.status,400); assert.equal((await response.json()).temporaryPassword,undefined);
  assert.equal(profileUpdates[0].requires_password_change,true);
  assert.deepEqual(writes,['profile-write','update-user']);
});
test('administrator cannot use the directory reset route on their own account',async()=>{
  const response=await call(`/users/${id}/reset-password`,'POST',token());
  assert.equal(response.status,400); assert.deepEqual(writes,[]);
});
test('verified temporary password change clears the requirement explicitly and revokes the old session',async()=>{
  needsPassword=true;
  const newPassword='New@Pass26';
  const response=await call('/auth/update-initial-password','POST',token('aal1'),{currentPassword:'Temporary@Password1',newPassword});
  assert.equal(response.status,200); assert.equal(response.headers.get('cache-control'),'no-store');
  assert.deepEqual(updatedPasswords,[newPassword]);
  assert.equal(profileUpdates.at(-1)?.requires_password_change,false);
  assert.equal(profileUpdates.at(-1)?.temporary_password_issued_at,null);
  assert.equal(typeof profileUpdates.at(-1)?.sessions_revoked_before,'string');
});
test('initial password endpoint rejects weak and reused passwords',async()=>{
  needsPassword=true;
  assert.equal((await call('/auth/update-initial-password','POST',token('aal1'),{currentPassword:'same',newPassword:'same'})).status,400);
  const reused='Reuse@12';
  assert.equal((await call('/auth/update-initial-password','POST',token('aal1'),{currentPassword:reused,newPassword:reused})).status,400);
  assert.deepEqual(writes,[]);
});
test('user-selected password policy accepts 6–12 characters only',async()=>{
  needsPassword=true;
  for (const newPassword of ['Aa1!bc','Aa1!bcdefghi']) {
    assert.equal((await call('/auth/update-initial-password','POST',token('aal1'),{currentPassword:'Temporary@Password1',newPassword})).status,200);
  }
  for (const newPassword of ['Aa1!b','Aa1!bcdefghij']) {
    assert.equal((await call('/auth/update-initial-password','POST',token('aal1'),{currentPassword:'Temporary@Password1',newPassword})).status,400);
  }
  assert.deepEqual(updatedPasswords,['Aa1!bc','Aa1!bcdefghi']);
});
test('administrator MFA reset revokes sessions, removes every factor, and verifies removal',async()=>{
  mfaFactors=[
    {id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',status:'verified',factor_type:'totp'},
    {id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',status:'unverified',factor_type:'totp'},
  ];
  const response=await call(`/users/${createdId}/reset-mfa`,'POST',token());
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.removedFactors,2); assert.equal(body.requiresReEnrollment,true);
  assert.deepEqual(mfaFactors,[]); assert.equal(profileUpdates[0].sessions_revoked_before === undefined,false);
  assert.deepEqual(writes,['profile-write','delete-factor','delete-factor']);
});
test('AAL2 administrator can reset their own MFA and is told the session is revoked',async()=>{
  mfaFactors=[{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',status:'verified',factor_type:'totp'}];
  const response=await call(`/users/${id}/reset-mfa`,'POST',token());
  assert.equal(response.status,200); assert.equal(mfaFactors.length,0);
  assert.equal((await response.json()).signedOut,true);
  assert.deepEqual(writes,['profile-write','delete-factor']);
});
test('password-only administrator cannot reset their own MFA',async()=>{
  mfaFactors=[{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',status:'verified',factor_type:'totp'}];
  const response=await call(`/users/${id}/reset-mfa`,'POST',token('aal1'));
  assert.equal(response.status,403); assert.equal(mfaFactors.length,1); assert.deepEqual(writes,[]);
});
test('failed MFA removal leaves the account sessions revoked and reports failure',async()=>{
  mfaFactors=[{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',status:'verified',factor_type:'totp'}];
  mfaDeleteFailure=true;
  const response=await call(`/users/${createdId}/reset-mfa`,'POST',token());
  assert.equal(response.status,503); assert.equal(mfaFactors.length,1);
  assert.equal(profileUpdates[0].sessions_revoked_before === undefined,false);
});
test('template paths reject traversal before storage access',async()=>{
  for (const value of ['../outside','..\\outside','',[],'.env']) assert.equal(isValidTemplateId(value),false);
  assert.equal(isValidTemplateId('h5_pdf_backup'),true);
  assert.equal((await call('/templates/..%5C..%5Cpackage.json','GET',token())).status,400);
  assert.equal((await call('/templates/..%5C..%5Cpackage.json','DELETE',token())).status,400);
});
test('OAuth callback without bound state cannot exchange a code',async()=>{
  const response=await call('/onedrive/auth/callback?code=untrusted'); assert.equal(response.status,400);assert.deepEqual(writes,[]);
});
