#Requires -Version 5.1
<#
.SYNOPSIS
  Preflight + emit Release-Owner commands for dual iOS UAT builds (flag-off / flag-on).

.DESCRIPTION
  BUILD-ONLY helper. This script:
  - Does NOT call `eas build`
  - Does NOT call `eas submit` (or any store submission)
  - Does NOT patch ios.buildNumber in app.config.js (build numbers come from committed eas.json env)

  Cursor must not hold founder Expo/Apple/Google credentials. The NZ Release Owner
  copies the printed commands into a founder-controlled environment after founder approval.

.NOTES
  Authority: On-Device UAT preparation only. Separate founder approval required for
  (1) EAS build and (2) ASC/TestFlight or Play submit. Build is not submit.
#>
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host '=== UAT iOS dual-flag PREFLIGHT (build-only; no EAS; no submit) ===' -ForegroundColor Cyan
Write-Host 'GUARD: This script never invokes eas build or eas submit.' -ForegroundColor Yellow
Write-Host 'GUARD: Build numbers must already be committed in eas.json (RVEEL_IOS_BUILD_NUMBER).' -ForegroundColor Yellow
Write-Host ''

$easPath = Join-Path $Root 'eas.json'
if (-not (Test-Path $easPath)) { throw 'eas.json not found' }

$eas = Get-Content -Path $easPath -Raw | ConvertFrom-Json
$off = $eas.build.'uat-ios-flag-off'
$on = $eas.build.'uat-ios-flag-on'
if (-not $off -or -not $on) { throw 'Missing uat-ios-flag-off / uat-ios-flag-on profiles in eas.json' }

$offBn = [string]$off.env.RVEEL_IOS_BUILD_NUMBER
$onBn = [string]$on.env.RVEEL_IOS_BUILD_NUMBER
$offImg = [string]$off.ios.image
$onImg = [string]$on.ios.image
$offFlag = [string]$off.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT
$onFlag = [string]$on.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT

if (-not $offBn -or -not $onBn) {
  throw 'Committed RVEEL_IOS_BUILD_NUMBER missing on one or both UAT profiles'
}
if ($offBn -eq $onBn) {
  throw "Flag-off and flag-on must use distinct build numbers (both are $offBn)"
}
if ($offFlag -ne '0' -or $onFlag -ne '1') {
  throw "Unexpected skeleton flags: off=$offFlag on=$onFlag (expected 0 / 1)"
}
if (-not $offImg -or -not $onImg) {
  throw 'Each UAT profile must pin an explicit ios.image'
}
if ($offImg -eq 'sdk-53' -or $onImg -eq 'sdk-53' -or $offImg -eq 'latest' -or $onImg -eq 'latest') {
  throw "UAT profiles must use an explicit Apple-compliant Xcode 26.x image (got off=$offImg on=$onImg)"
}

Write-Host "Validated flag-off: buildNumber=$offBn flag=$offFlag image=$offImg"
Write-Host "Validated flag-on:  buildNumber=$onBn flag=$onFlag image=$onImg"
Write-Host ''

$runChecks = -not ($args -contains '-SkipChecks')
if ($runChecks) {
  Write-Host 'Running local preflight checks...' -ForegroundColor Cyan
  npm run typecheck
  if ($LASTEXITCODE -ne 0) { throw 'typecheck failed' }
  npm run test:phase6:gate:public
  if ($LASTEXITCODE -ne 0) { throw 'phase6 gate failed' }
  npm run test:workstreamC
  if ($LASTEXITCODE -ne 0) { throw 'workstreamC tests failed' }
  npm run uat:prevalidate-retail
  if ($LASTEXITCODE -ne 0) { throw 'uat retail prevalidate failed' }
  Write-Host 'Local preflight checks PASSED.' -ForegroundColor Green
} else {
  Write-Host 'Skipped npm checks (-SkipChecks).' -ForegroundColor Yellow
}

Write-Host ''
Write-Host '=== Commands for NZ Release Owner (founder-controlled env only) ===' -ForegroundColor Cyan
Write-Host 'Requires recorded founder approval of the build packet before running.'
Write-Host 'Do NOT run eas submit until a separate founder submit approval is recorded.'
Write-Host ''
Write-Host "# 1) Flag-off UAT (Skeleton OFF) - iOS buildNumber $offBn"
Write-Host "eas build --platform ios --profile uat-ios-flag-off --non-interactive"
Write-Host ''
Write-Host "# 2) Flag-on UAT (Skeleton ON) - iOS buildNumber $onBn"
Write-Host "eas build --platform ios --profile uat-ios-flag-on --non-interactive"
Write-Host ''
Write-Host 'Submit is intentionally omitted from this script. Separate approval + Release Owner only.'
Write-Host 'Done (no cloud actions taken).' -ForegroundColor Green
