# Capture README screenshots with headless Chrome via the DevTools Protocol.
# Needs the local server running (tools/serve.ps1 on port 8080). Output: docs/screenshots/<name>.png
# Usage: powershell -ExecutionPolicy Bypass -File tools\screenshots.ps1 [-Shots title,select,...]
param([string[]]$Shots = @('title', 'select', 'order', 'ride', 'pcreate', 'plan', 'school', 'night', 'fight'),
      [int]$Width = 1440, [int]$Height = 900, [string]$Angle = 'swiftshader')
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'docs\screenshots'
New-Item -ItemType Directory -Force $outDir | Out-Null
$chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw 'Chrome or Edge not found' }

function Send-Cdp($ws, [int]$id, [string]$method, $params) {
  $msg = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Compress -Depth 5
  $bytes = [Text.Encoding]::UTF8.GetBytes($msg)
  $ws.SendAsync([ArraySegment[byte]]::new($bytes), 'Text', $true, [Threading.CancellationToken]::None).Wait()
  $buf = New-Object byte[] 65536
  while ($true) {
    $ms = New-Object IO.MemoryStream
    do {
      $t = $ws.ReceiveAsync([ArraySegment[byte]]::new($buf), [Threading.CancellationToken]::None); if (-not $t.Wait(60000)) { throw "CDP timeout" }; $r = $t.Result
      $ms.Write($buf, 0, $r.Count)
    } while (-not $r.EndOfMessage)
    $obj = [Text.Encoding]::UTF8.GetString($ms.ToArray()) | ConvertFrom-Json
    if ($obj.id -eq $id) { return $obj }
  }
}

$port = 9333
$angleArg = if ($Angle -eq 'swiftshader') { '--use-angle=swiftshader --enable-unsafe-swiftshader' } else { "--use-angle=$Angle" }
foreach ($s in $Shots) {
  $prof = Join-Path $env:TEMP ("life-shot-profile-" + [guid]::NewGuid().ToString("N"))
  $p = Start-Process $chrome -PassThru -ArgumentList @('--headless=new', "--remote-debugging-port=$port", "--user-data-dir=$prof",
    $angleArg, '--hide-scrollbars', '--mute-audio', '--no-first-run',
    "--window-size=$Width,$Height", "http://localhost:8080/?shot=$s")
  try {
    $page = $null
    for ($i = 0; $i -lt 300; $i++) {
      Start-Sleep -Milliseconds 1000
      try { $tabs = Invoke-RestMethod "http://127.0.0.1:$port/json" -TimeoutSec 3 } catch { continue }
      $page = $tabs | Where-Object { $_.type -eq 'page' -and $_.url -like '*shot=*' } | Select-Object -First 1
      if ($page -and $page.title -eq 'SHOT-READY') { break }
    }
    if (-not $page -or $page.title -ne 'SHOT-READY') { Write-Warning "$s : page never became ready"; continue }
    Start-Sleep -Milliseconds 800
    $ws = New-Object Net.WebSockets.ClientWebSocket
    $ws.Options.SetBuffer(65536, 65536)
    $ws.ConnectAsync([Uri]$page.webSocketDebuggerUrl, [Threading.CancellationToken]::None).Wait()
    $res = Send-Cdp $ws 1 'Page.captureScreenshot' @{ format = 'png' }
    $file = Join-Path $outDir "$s.png"
    [IO.File]::WriteAllBytes($file, [Convert]::FromBase64String($res.result.data))
    Write-Host "saved $file"
    $err = Send-Cdp $ws 2 'Runtime.evaluate' @{ expression = 'window.__shotErr || ""'; returnByValue = $true }
    if ($err.result.result.value) { Write-Warning "$s : script error: $($err.result.result.value)" }
    $ws.Dispose()
  } finally {
    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    Get-CimInstance Win32_Process -Filter "Name='chrome.exe' OR Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*life-shot-profile*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 800
    Remove-Item $prof -Recurse -Force -ErrorAction SilentlyContinue
  }
}



