param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

function Read-SecretPlainText {
  param([string]$Prompt)

  $secure = Read-Host -Prompt $Prompt -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

function Invoke-StripePost {
  param(
    [string]$Path,
    [hashtable]$Body,
    [string]$SecretKey
  )

  $authBytes = [Text.Encoding]::ASCII.GetBytes("${SecretKey}:")
  $auth = [Convert]::ToBase64String($authBytes)
  return Invoke-RestMethod `
    -Method Post `
    -Uri "https://api.stripe.com/v1/$Path" `
    -Headers @{ Authorization = "Basic $auth" } `
    -Body $Body `
    -ContentType 'application/x-www-form-urlencoded'
}

function Upsert-EnvValue {
  param(
    [string[]]$Lines,
    [string]$Key,
    [string]$Value
  )

  $found = $false
  $next = foreach ($line in $Lines) {
    if ($line -match "^$([Regex]::Escape($Key))=") {
      $found = $true
      "$Key=$Value"
    } else {
      $line
    }
  }

  if (-not $found) {
    $next += "$Key=$Value"
  }

  return $next
}

Write-Host ''
Write-Host 'BloomX Stripe test price setup'
Write-Host 'Paste the sk_test_... for the CURRENT Stripe test account.'
Write-Host 'Input is hidden. Do not share this key or commit it.'
Write-Host ''

$secretKey = Read-SecretPlainText -Prompt 'Stripe Secret Key'
if (-not $secretKey.StartsWith('sk_test_')) {
  throw 'Secret key must be a test key that starts with sk_test_.'
}

$packages = @(
  @{ Key = 'STARTER'; Name = 'BloomX STARTER Credits Pack'; Description = '1000 BloomX platform credits'; Amount = 1000 },
  @{ Key = 'CREATOR'; Name = 'BloomX CREATOR Credits Pack'; Description = '12000 BloomX platform credits'; Amount = 10000 },
  @{ Key = 'PRO'; Name = 'BloomX PRO Credits Pack'; Description = '60000 BloomX platform credits'; Amount = 50000 }
)

$priceIds = @{}

foreach ($package in $packages) {
  Write-Host "Creating product: $($package.Name)"
  $product = Invoke-StripePost -Path 'products' -SecretKey $secretKey -Body @{
    name = $package.Name
    description = $package.Description
  }

  Write-Host "Creating one-time price: $($package.Key)"
  $price = Invoke-StripePost -Path 'prices' -SecretKey $secretKey -Body @{
    product = $product.id
    currency = 'usd'
    unit_amount = [string]$package.Amount
  }

  $priceIds[$package.Key] = $price.id
}

$functionsEnv = Join-Path $ProjectRoot 'functions\.env'
$lines = if (Test-Path $functionsEnv) { Get-Content $functionsEnv } else { @() }
$lines = Upsert-EnvValue -Lines $lines -Key 'STRIPE_ENVIRONMENT' -Value 'test'
$lines = Upsert-EnvValue -Lines $lines -Key 'STRIPE_PRICE_STARTER' -Value $priceIds.STARTER
$lines = Upsert-EnvValue -Lines $lines -Key 'STRIPE_PRICE_CREATOR' -Value $priceIds.CREATOR
$lines = Upsert-EnvValue -Lines $lines -Key 'STRIPE_PRICE_PRO' -Value $priceIds.PRO
Set-Content -Path $functionsEnv -Value $lines -Encoding UTF8

Write-Host ''
Write-Host 'Done. Wrote these values to functions\.env:'
Write-Host "STRIPE_PRICE_STARTER=$($priceIds.STARTER)"
Write-Host "STRIPE_PRICE_CREATOR=$($priceIds.CREATOR)"
Write-Host "STRIPE_PRICE_PRO=$($priceIds.PRO)"
Write-Host ''
Write-Host 'Next command:'
Write-Host 'firebase deploy --only functions'
