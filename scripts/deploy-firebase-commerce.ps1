param(
  [string]$ProjectId = ""
)

$ErrorActionPreference = "Stop"

if (-not $ProjectId) {
  Write-Host "Usage: .\scripts\deploy-firebase-commerce.ps1 -ProjectId <firebase-project-id>"
  exit 1
}

firebase use $ProjectId
firebase deploy --only firestore:rules
firebase deploy --only functions:invokeMerchantModel

Write-Host ""
Write-Host "Set VITE_INVOKE_MERCHANT_MODEL_URL to the deployed HTTPS function URL."
Write-Host "Then rebuild and deploy the frontend:"
Write-Host "  npm run build"
