param(
  [Parameter(Mandatory = $true)][string]$RemoteHost,
  [string]$RemoteUser = 'ubuntu',
  [string]$LocalEnv = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path '.env'),
  [string]$RemoteEnvPath = '/etc/framefuzz/framefuzz.env'
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path $LocalEnv)) { throw "Local env file not found: $LocalEnv" }

$wanted = @(
  'OPENROUTER_API_KEY',
  'ARKIV_PRIVATE_KEY',
  'ARKIV_ACCESS_KEY',
  'ARKIV_READER_ADDRESS',
  'FRAMEFUZZ_OWNER_KEY',
  'FRAMEFUZZ_SENDER_KEY',
  'FRAMEFUZZ_RPC',
  'FRAMEFUZZ_PUBLIC_RPC',
  'FRAMEFUZZ_ALT_RPC',
  'FRAMEFUZZ_LIVE_CONFIG'
)

$map = @{}
Get-Content $LocalEnv | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $name, $value = $_.Split('=', 2)
  $name = $name.Trim()
  if ($wanted -contains $name) { $map[$name] = $value }
}

# Prefer owner key alias for playground live writes
if (-not $map.ContainsKey('FRAMEFUZZ_OWNER_KEY') -and $map.ContainsKey('FRAMEFUZZ_SENDER_KEY')) {
  $map['FRAMEFUZZ_OWNER_KEY'] = $map['FRAMEFUZZ_SENDER_KEY']
}
if (-not $map.ContainsKey('FRAMEFUZZ_RPC')) { $map['FRAMEFUZZ_RPC'] = 'https://altmempool.forshtat.com/rpc' }
if (-not $map.ContainsKey('FRAMEFUZZ_PUBLIC_RPC')) { $map['FRAMEFUZZ_PUBLIC_RPC'] = 'https://altmempool.forshtat.com' }
if (-not $map.ContainsKey('FRAMEFUZZ_ALT_RPC')) { $map['FRAMEFUZZ_ALT_RPC'] = 'https://altmempool.forshtat.com/rpc/' }

$lines = @(
  'FRAMEFUZZ_ALLOW_PUBLIC_HOST=1',
  'FRAMEFUZZ_BIND=0.0.0.0',
  'FRAMEFUZZ_MODE=LIVE_AUTHORIZED',
  'FRAMEFUZZ_ALLOW_CHAIN=1337',
  'FRAMEFUZZ_CORS_ORIGINS=https://frame-fuzz.vercel.app,https://frame-fuzz-nishanthcr7777s-projects.vercel.app'
)
foreach ($key in ($map.Keys | Sort-Object)) {
  $lines += "$key=$($map[$key])"
}

$tmp = Join-Path $env:TEMP ("framefuzz-oci-env-{0}.env" -f [guid]::NewGuid().ToString('n'))
Set-Content -Path $tmp -Value ($lines -join "`n") -Encoding ascii
try {
  Write-Host "Uploading env ($($map.Count) secret/config keys) to ${RemoteUser}@${RemoteHost}:${RemoteEnvPath}"
  ssh "${RemoteUser}@${RemoteHost}" "sudo mkdir -p /etc/framefuzz /var/lib/framefuzz/runs && sudo install -m 600 /dev/null $RemoteEnvPath"
  Get-Content $tmp | ssh "${RemoteUser}@${RemoteHost}" "sudo tee $RemoteEnvPath > /dev/null && sudo chmod 600 $RemoteEnvPath"
  ssh "${RemoteUser}@${RemoteHost}" "sudo systemctl restart framefuzz || true; curl -sS http://127.0.0.1:4190/api/readiness | head -c 240; echo"
  Write-Host "Done. Set Vercel FRAMEFUZZ_BACKEND_URL=http://${RemoteHost}:4190 and redeploy."
}
finally {
  Remove-Item -Force $tmp -ErrorAction SilentlyContinue
}
