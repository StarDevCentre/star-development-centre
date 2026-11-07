const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '..', 'app/api/player-invitation/route.ts'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
const validId = '11111111-2222-4333-8444-555555555555';

function harness(options = {}) {
  const calls = [];
  const apiResponse = (body, options = {}) => ({body, status: options.status ?? 200});
  const client = {
    auth: {getUser: async token => {
      calls.push(['getUser', token]);
      return options.authError ? {data: {user: null}, error: Error('bad session')} : {data: {user: {id: 'guardian-1', is_anonymous: false}}, error: null};
    }},
    from: () => ({select() {return this;}, eq() {return this;}, async maybeSingle() {
      return {data: options.intakeDenied ? null : {guardian_id: 'guardian-1'}, error: null};
    }}),
    rpc: async (name, args) => {
      calls.push(['rpc', name, args]);
      return {error: options.rpcError ? Error('Parent permission required.') : null};
    }
  };
  const env = options.emailConfigured === false ? {NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-test-key'} : {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-test-key',
    RESEND_API_KEY: 'test-key', STAR_ENQUIRY_FROM: 'STAR <noreply@example.invalid>'
  };
  const module = {exports: {}};
  const requireMock = name => {
    if (name === 'next/server') return {NextResponse: {json: apiResponse}};
    if (name === '@supabase/supabase-js') return {createClient: () => client};
    throw Error('Unexpected import: ' + name);
  };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, require: requireMock,
    process: {env}, Buffer, Date, AbortSignal,
    fetch: async (url, init) => {
      calls.push(['email', url, init]);
      return options.emailFailed ? {ok: false, json: async () => ({})} : {ok: true, json: async () => ({id: options.noReceipt ? '' : 'email-provider-receipt'})};
    }
  }, {filename: 'route.ts'});
  async function post(body = {type: 'player', id: validId, email: 'player@example.invalid'}, overrides = {}) {
    return module.exports.POST({
      nextUrl: {origin: 'https://starfootball.uk'},
      headers: {get: name => ({
        origin: overrides.origin || 'https://starfootball.uk',
        'content-type': 'application/json',
        authorization: overrides.authorization === undefined ? 'Bearer test-parent-token' : overrides.authorization
      })[name.toLowerCase()] || null},
      text: async () => JSON.stringify(body)
    });
  }
  return {post, calls};
}

test('verified parent invitation creates its database link before requesting email delivery', async () => {
  const h = harness();
  const res = await h.post();
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.emailSubmitted, true);
  assert.equal(h.calls[0][0], 'getUser');
  assert.equal(h.calls[1][1], 'request_player_link');
  assert.equal(h.calls[2][0], 'email');
  assert.equal(h.calls[2][2].body.includes('"to":["player@example.invalid"]'), true);
  assert.match(h.calls[2][2].body, /https:\/\/starfootball\.uk\/player-portal/);
  assert.doesNotMatch(h.calls[2][2].body, /service_role|token_hash|invitation code:/i);
});

test('parent onboarding uses guardian-scoped intake and sends the same email', async () => {
  const h = harness();
  const res = await h.post({type: 'intake', id: validId, email: 'player@example.invalid'});
  assert.equal(res.body.emailSubmitted, true);
  assert.equal(h.calls.find(c => c[0] === 'rpc')[1], 'request_intake_link');
});

test('unapproved intake access never creates or emails an invitation', async () => {
  const h = harness({intakeDenied: true});
  const res = await h.post({type: 'intake', id: validId, email: 'player@example.invalid'});
  assert.equal(res.status, 403);
  assert.equal(h.calls.some(c => c[0] === 'rpc'), false);
  assert.equal(h.calls.some(c => c[0] === 'email'), false);
});

test('invalid session, origin and malformed player details do not send email', async () => {
  const untrusted = harness({authError: true});
  assert.equal((await untrusted.post()).status, 401);
  const invalid = harness();
  assert.equal((await invalid.post(undefined, {origin: 'https://bad.example'})).status, 403);
  assert.equal((await invalid.post({type: 'player', id: validId, email: 'bad\naddress@example.invalid'})).status, 400);
  assert.equal((await invalid.post(undefined, {authorization: ''})).status, 401);
  assert.equal(invalid.calls.some(c => c[0] === 'email'), false);
});

test('database authorization failure never sends email', async () => {
  const h = harness({rpcError: true});
  const res = await h.post();
  assert.equal(res.status, 400);
  assert.equal(h.calls.some(c => c[0] === 'email'), false);
});

test('provider failure or missing configuration honestly reports saved invitation but not email', async () => {
  for (const options of [{emailFailed: true}, {emailConfigured: false}, {noReceipt: true}]) {
    const h = harness(options);
    const res = await h.post();
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.emailSubmitted, false);
    assert.equal(h.calls.some(c => c[0] === 'rpc'), true);
  }
});

test('both guardian player-invitation surfaces use the authenticated email helper', () => {
  const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  assert.match(read('components/PlayerAccountSetup.tsx'), /sendPlayerInvitation\(\{type:'player'/);
  assert.match(read('components/PlayerOnboarding.tsx'), /sendPlayerInvitation\(\{type:'intake'/);
  assert.match(read('lib/playerInvitation.ts'), /\/api\/player-invitation/);
});
