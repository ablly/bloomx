param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$FirebaseArgs = @("login", "--no-localhost", "--reauth")
)

$ErrorActionPreference = "Stop"

function Get-SystemProxy {
  $settings = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
  if ($settings.ProxyEnable -ne 1 -or [string]::IsNullOrWhiteSpace($settings.ProxyServer)) {
    return $null
  }

  $proxy = [string]$settings.ProxyServer
  if ($proxy -match "=") {
    $parts = $proxy -split ";"
    $https = $parts | Where-Object { $_ -like "https=*" } | Select-Object -First 1
    $http = $parts | Where-Object { $_ -like "http=*" } | Select-Object -First 1
    $proxy = if ($https) { $https -replace "^https=", "" } else { $http -replace "^http=", "" }
  }

  if ($proxy -notmatch "^https?://") {
    $proxy = "http://$proxy"
  }

  return $proxy
}

$proxyUrl = $env:FIREBASE_CLI_PROXY
if ([string]::IsNullOrWhiteSpace($proxyUrl)) {
  $proxyUrl = Get-SystemProxy
}

if ([string]::IsNullOrWhiteSpace($proxyUrl)) {
  Write-Error "No system proxy detected. Start your proxy app or set FIREBASE_CLI_PROXY=http://127.0.0.1:7890."
}

$env:HTTP_PROXY = $proxyUrl
$env:HTTPS_PROXY = $proxyUrl
$env:http_proxy = $proxyUrl
$env:https_proxy = $proxyUrl
$env:NO_PROXY = "localhost,127.0.0.1,::1"
$env:no_proxy = $env:NO_PROXY

Write-Host "Running Firebase CLI via proxy: $proxyUrl"
& firebase @FirebaseArgs
exit $LASTEXITCODE
