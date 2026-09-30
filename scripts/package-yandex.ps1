$ErrorActionPreference = 'Stop'
$projectPath = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$buildPath = (Resolve-Path -LiteralPath (Join-Path $projectPath 'dist-yandex')).Path
$outputPath = Join-Path $projectPath 'artifacts'
New-Item -ItemType Directory -Path $outputPath -Force | Out-Null
$archivePath = Join-Path $outputPath 'znamyona-epoh-yandex.zip'
Compress-Archive -Path (Join-Path $buildPath '*') -DestinationPath $archivePath -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
try {
  if (-not ($archive.Entries | Where-Object { $_.FullName -eq 'index.html' })) {
    throw 'index.html is not at the archive root'
  }
} finally { $archive.Dispose() }
Write-Output "Archive: $archivePath"
Write-Output "ZIP bytes: $((Get-Item -LiteralPath $archivePath).Length)"
