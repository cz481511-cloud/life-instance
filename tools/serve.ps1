# Local static server: powershell -ExecutionPolicy Bypass -File tools\serve.ps1
param([int]$Port = 8080)
$root = Split-Path -Parent $PSScriptRoot
$mime = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='application/javascript; charset=utf-8';
           '.png'='image/png'; '.jpg'='image/jpeg'; '.json'='application/json'; '.md'='text/plain; charset=utf-8'; '.ico'='image/x-icon' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "Delivery game running at http://localhost:$Port/  (Ctrl+C to stop)"
while ($l.IsListening) {
  $c = $l.GetContext()
  $path = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath.TrimStart('/'))
  # dev-only: save a recorded trailer (PUT /tools/out/<name>.mp4|.webm), localhost listener only
  if ($c.Request.HttpMethod -eq 'PUT') {
    if ($path -match '^tools/out/(frames/)?[A-Za-z0-9_.-]+\.(mp4|webm|jpg|wav)$') {
      $dst = [IO.Path]::GetFullPath((Join-Path $root $path))
      New-Item -ItemType Directory -Force (Split-Path $dst) | Out-Null
      $fs = [IO.File]::Create($dst); $c.Request.InputStream.CopyTo($fs); $fs.Close()
      $c.Response.StatusCode = 201
    } else { $c.Response.StatusCode = 403 }
    $c.Response.Close(); continue
  }
  if ($path -eq '') { $path = 'index.html' }
  $file = Join-Path $root $path
  $full = [IO.Path]::GetFullPath($file)
  if ($full.StartsWith($root) -and (Test-Path $full -PathType Leaf)) {
    $bytes = [IO.File]::ReadAllBytes($full)
    $ext = [IO.Path]::GetExtension($full).ToLower()
    $c.Response.ContentType = $(if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' })
    $c.Response.Headers.Add('Cache-Control', 'no-store')
    $c.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else { $c.Response.StatusCode = 404 }
  $c.Response.Close()
}
