param(
  [string]$ProjectId = "bloomx-core-infra-26"
)

$ErrorActionPreference = "Stop"

function Get-FirebaseAccessToken {
  $assertion = npx tsx scripts/firebase-assertion.ts
  $tokenResponse = Invoke-RestMethod `
    -Uri "https://oauth2.googleapis.com/token" `
    -Method Post `
    -ContentType "application/x-www-form-urlencoded" `
    -Body @{
      grant_type = "urn:ietf:params:oauth:grant-type:jwt-bearer"
      assertion = $assertion
    }

  return $tokenResponse.access_token
}

function ConvertTo-FirestoreValue($Value) {
  if ($null -eq $Value) {
    return @{ nullValue = $null }
  }

  if ($Value -is [bool]) {
    return @{ booleanValue = $Value }
  }

  if ($Value -is [int] -or $Value -is [long]) {
    return @{ integerValue = "$Value" }
  }

  if ($Value -is [double] -or $Value -is [decimal] -or $Value -is [single]) {
    return @{ doubleValue = [double]$Value }
  }

  if ($Value -is [datetime]) {
    return @{ timestampValue = $Value.ToUniversalTime().ToString("o") }
  }

  if ($Value -is [array]) {
    return @{
      arrayValue = @{
        values = @($Value | ForEach-Object { ConvertTo-FirestoreValue $_ })
      }
    }
  }

  if ($Value -is [System.Collections.IDictionary]) {
    $fields = [ordered]@{}
    foreach ($key in $Value.Keys) {
      $fields[$key] = ConvertTo-FirestoreValue $Value[$key]
    }
    return @{ mapValue = @{ fields = $fields } }
  }

  return @{ stringValue = "$Value" }
}

function ConvertTo-FirestoreDocument($Data) {
  $fields = [ordered]@{}
  foreach ($key in $Data.Keys) {
    $fields[$key] = ConvertTo-FirestoreValue $Data[$key]
  }
  return @{ fields = $fields } | ConvertTo-Json -Depth 50
}

function Set-FirestoreDocument($Token, $Path, $Data) {
  $url = "https://firestore.googleapis.com/v1/projects/$ProjectId/databases/(default)/documents/$Path"
  $body = ConvertTo-FirestoreDocument $Data
  Invoke-RestMethod `
    -Uri $url `
    -Method Patch `
    -Headers @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" } `
    -Body $body | Out-Null
}

$now = (Get-Date).ToUniversalTime()
$reviewId = "review-" + $now.ToString("yyyyMMdd-HHmmss")
$token = Get-FirebaseAccessToken

$counts = [ordered]@{
  users = 3
  products = 0
  sellers = 0
  seller_applications = 0
  credit_packages = 0
  credit_orders = 0
  usage_logs = 0
  seller_earnings = 0
  subscriptions = 0
  sellerProfiles = 0
  apiOffers = 0
  apiOfferStats = 0
  apiCallRecords = 0
  verification_codes = 0
}

$blockers = @(
  "Functions build fails and blocks deployment.",
  "Credits fields are split between credits_balance and credits.",
  "Marketplace business collections are empty in real Firestore.",
  "There are two competing seller/product data models.",
  "Firestore rules contain duplicate users rules and permissive verification_codes rules.",
  "Docs were stale/mojibake and needed refresh.",
  "npm audit reports high/critical dependency risk."
)

$nextSteps = @(
  "Unify the credits field and migrate runtime/gateway usage.",
  "Choose one seller/product data model.",
  "Initialize minimal real marketplace data in Firestore.",
  "Fix Functions dependencies and TypeScript errors.",
  "Clean Firestore rules and add indexes for selected collections.",
  "Remove production debug surfaces and upgrade high-risk dependencies."
)

$current = [ordered]@{
  projectId = $ProjectId
  updatedAt = $now
  source = "project_review_2026_04_27"
  developmentStatus = "in_progress"
  productionReadinessPercent = 35
  developmentCompletionPercent = 55
  frontendBuild = "pass"
  functionsBuild = "fail"
  realFirebaseConnected = $true
  firestoreRootCollections = @("users")
  firestoreCounts = $counts
  userRoleCounts = [ordered]@{ buyer = 2; admin = 1 }
  blockers = $blockers
  nextSteps = $nextSteps
  localReports = @(
    "PROJECT_PROGRESS_REVIEW.md",
    "NEXT_STEPS_ACTION_PLAN.md",
    "TODO.md"
  )
}

$review = [ordered]@{
  reviewId = $reviewId
  reviewedAt = $now
  projectId = $ProjectId
  summary = "Whole-project progress review completed. Frontend builds, real Firebase is connected, but business data is empty and Functions/security/model alignment are P0 blockers."
  productionReadinessPercent = 35
  developmentCompletionPercent = 55
  firestoreCounts = $counts
  userRoleCounts = [ordered]@{ buyer = 2; admin = 1 }
  blockers = $blockers
  nextSteps = $nextSteps
  verification = [ordered]@{
    appBuild = "passed"
    functionsBuild = "failed"
    firebaseWrite = "pending"
  }
}

Set-FirestoreDocument $token "projectProgress/current" $current
$review.verification.firebaseWrite = "passed"
Set-FirestoreDocument $token "projectProgressReviews/$reviewId" $review

Write-Output "Wrote projectProgress/current"
Write-Output "Wrote projectProgressReviews/$reviewId"
