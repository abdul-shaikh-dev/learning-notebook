param([ValidateSet('Bootstrap','Validate','Apply','Status','Cleanup')][string]$Action='Validate')
$ErrorActionPreference='Stop'
$taskContext=& kubectl config current-context
if($LASTEXITCODE -ne 0 -or $taskContext -ne 'kind-notebook-lab'){throw 'Refusing: select the dedicated kind-notebook-lab context.'}
$taskServer=& kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}'
if($LASTEXITCODE -ne 0 -or $taskServer -notmatch '^https://(127\.0\.0\.1|localhost):[0-9]+$'){throw 'Refusing: cluster API must use a loopback endpoint.'}
function Invoke-LabKubectl([string[]]$TaskArgs){& kubectl --context=kind-notebook-lab --namespace=notebook-lab @TaskArgs;if($LASTEXITCODE -ne 0){throw 'kubectl failed; no later step will run.'}}
if($Action -eq 'Bootstrap'){Invoke-LabKubectl -TaskArgs @('apply','-f',(Join-Path $PSScriptRoot 'namespace.json'));return}
if($Action -eq 'Validate'){Invoke-LabKubectl -TaskArgs @('apply','--dry-run=server','-f',(Join-Path $PSScriptRoot 'workload.json'));return}
if($Action -eq 'Apply'){Invoke-LabKubectl -TaskArgs @('apply','-f',(Join-Path $PSScriptRoot 'workload.json'));Invoke-LabKubectl -TaskArgs @('rollout','status','deployment/release-demo','--timeout=120s');return}
if($Action -eq 'Status'){Invoke-LabKubectl -TaskArgs @('get','pods,svc,deploy');return}
$taskOwner=& kubectl --context=kind-notebook-lab get namespace notebook-lab -o jsonpath='{.metadata.labels.training-owner}'
if($LASTEXITCODE -ne 0 -or $taskOwner -ne 'notebook'){throw 'Refusing cleanup: dedicated namespace marker not found.'}
Invoke-LabKubectl -TaskArgs @('delete','namespace','notebook-lab')
