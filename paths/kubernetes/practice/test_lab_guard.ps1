# Offline PowerShell behavior checks. This stub function shadows the executable;
# no real kubectl process or cluster connection is used.
$ErrorActionPreference='Stop'
$global:taskCalls=[System.Collections.Generic.List[string]]::new()
$global:taskMockContext='kind-notebook-lab'
$global:taskMockServer='https://127.0.0.1:12345'
$global:taskMockOwner='notebook'
function kubectl {
    [string[]]$TaskMockArgs=@($args)
    $global:LASTEXITCODE=0
    $global:taskCalls.Add(($TaskMockArgs -join ' '))
    if(($TaskMockArgs -join ' ') -eq 'config current-context'){return $global:taskMockContext}
    if($TaskMockArgs[0] -eq 'config' -and $TaskMockArgs[1] -eq 'view'){return $global:taskMockServer}
    if(($TaskMockArgs -join ' ') -match 'get namespace notebook-lab'){return $global:taskMockOwner}
}
function Check-Case([string]$Context,[string]$Server,[string]$Action,[bool]$Reject,[string]$Expected) {
    $global:taskMockContext=$Context;$global:taskMockServer=$Server;$global:taskCalls.Clear()
    $taskFailed=$false
    try { & (Join-Path $PSScriptRoot 'lab.ps1') -Action $Action } catch {$taskFailed=$true; $taskReason=$_.Exception.Message}
    if($taskFailed -ne $Reject){throw "Unexpected guard result for $Action / $Context / $Server : $taskReason"}
    if($Reject -and ($global:taskCalls | Where-Object {$_ -match ' apply | delete | rollout '})){throw 'Rejected case attempted a mutation.'}
    if(-not $Reject -and -not ($global:taskCalls | Where-Object {$_.Contains($Expected)})){throw "Missing expected arguments: $Expected"}
}
Check-Case 'production' 'https://127.0.0.1:12345' 'Apply' $true ''
Check-Case 'kind-notebook-lab' 'https://remote.example:6443' 'Apply' $true ''
Check-Case 'kind-notebook-lab' 'https://127.0.0.1:12345' 'Validate' $false '--context=kind-notebook-lab --namespace=notebook-lab apply --dry-run=server -f'
Check-Case 'kind-notebook-lab' 'https://localhost:12345' 'Bootstrap' $false 'namespace.json'
Check-Case 'kind-notebook-lab' 'https://127.0.0.1:12345' 'Apply' $false 'rollout status deployment/release-demo --timeout=120s'
$global:taskMockOwner='other'
Check-Case 'kind-notebook-lab' 'https://127.0.0.1:12345' 'Cleanup' $true ''
$global:taskMockOwner='notebook'
Check-Case 'kind-notebook-lab' 'https://127.0.0.1:12345' 'Cleanup' $false 'delete namespace notebook-lab'
Write-Output 'PASS: 7 offline PowerShell guard behavior cases; no actual kubectl execution.'
