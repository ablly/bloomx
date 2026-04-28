param(
  [string]$ProjectName = "bloomx",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

if (-not $env:CLOUDFLARE_API_TOKEN) {
  throw "Missing CLOUDFLARE_API_TOKEN. Set it before running this script."
}

if (-not $env:CLOUDFLARE_ACCOUNT_ID) {
  throw "Missing CLOUDFLARE_ACCOUNT_ID. Set it before running this script."
}

npm run build

$deployCwd = Join-Path (Get-Location) ".cloudflare-pages-deploy"
if (-not (Test-Path $deployCwd)) {
  New-Item -ItemType Directory -Path $deployCwd | Out-Null
}

$deployConfig = @"
name = "$ProjectName"
compatibility_date = "2024-01-01"
pages_build_output_dir = "../dist"
"@

Set-Content -LiteralPath (Join-Path $deployCwd "wrangler.toml") -Value $deployConfig -Encoding ASCII

npx wrangler pages deploy ..\dist `
  --cwd .cloudflare-pages-deploy `
  --project-name $ProjectName `
  --branch $Branch `
  --no-bundle `
  --commit-dirty=true
