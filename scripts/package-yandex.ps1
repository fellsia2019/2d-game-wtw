$ErrorActionPreference = 'Stop'
function Get-Sha256([string]$Path) {
  $stream = [System.IO.File]::OpenRead($Path)
  $hasher = [System.Security.Cryptography.SHA256]::Create()
  try { return [BitConverter]::ToString($hasher.ComputeHash($stream)).Replace('-', '').ToLowerInvariant() }
  finally { $hasher.Dispose(); $stream.Dispose() }
}
$projectPath = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$buildPath = (Resolve-Path -LiteralPath (Join-Path $projectPath 'dist-yandex')).Path
$outputPath = Join-Path $projectPath 'artifacts'
New-Item -ItemType Directory -Path $outputPath -Force | Out-Null
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archivePath = Join-Path $outputPath 'znamyona-epoh-yandex.zip'
if (Test-Path -LiteralPath $archivePath) { Remove-Item -LiteralPath $archivePath }
$writer = [System.IO.Compression.ZipFile]::Open($archivePath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($file in Get-ChildItem -LiteralPath $buildPath -Recurse -File | Sort-Object FullName) {
    $name = $file.FullName.Substring($buildPath.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($writer, $file.FullName, $name, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally { $writer.Dispose() }
$archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
try {
  if (@($archive.Entries | Where-Object { $_.FullName -eq 'index.html' }).Count -ne 1) {
    throw 'index.html is not at the archive root'
  }
  $unpackedBytes = 0L
  foreach ($entry in $archive.Entries) {
    if ($entry.FullName.EndsWith('/')) { continue }
    if ($entry.FullName -match '[\\\s\u0400-\u04ff]' -or $entry.FullName.Split('/') -contains '..') { throw "Invalid archive path: $($entry.FullName)" }
    $sourcePath = Join-Path $buildPath $entry.FullName
    $stream = $entry.Open()
    $hasher = [System.Security.Cryptography.SHA256]::Create()
    try {
      $hash = [BitConverter]::ToString($hasher.ComputeHash($stream)).Replace('-', '').ToLowerInvariant()
      if ($hash -ne (Get-Sha256 $sourcePath)) { throw "ZIP content mismatch: $($entry.FullName)" }
    } finally { $hasher.Dispose(); $stream.Dispose() }
    $unpackedBytes += $entry.Length
  }
  if ($unpackedBytes -gt 100000000) { throw 'Unpacked ZIP exceeds 100 MB' }
  $fileCount = @($archive.Entries | Where-Object { -not $_.FullName.EndsWith('/') }).Count
  if ($fileCount -ne @(Get-ChildItem -LiteralPath $buildPath -Recurse -File).Count) { throw 'ZIP file count mismatch' }
} finally { $archive.Dispose() }
$archiveHash = Get-Sha256 $archivePath
$previewPath = Join-Path $outputPath ('yandex-preview-' + $archiveHash.Substring(0, 12))
if (-not (Test-Path -LiteralPath $previewPath)) { [System.IO.Compression.ZipFile]::ExtractToDirectory($archivePath, $previewPath) }
$package = Get-Content -LiteralPath (Join-Path $projectPath 'package.json') -Raw | ConvertFrom-Json
$revision = git -C $projectPath rev-parse HEAD
$dirty = [bool](git -C $projectPath status --porcelain)
$manifest = [ordered]@{
  version = $package.version; revision = $revision; workingTreeModified = $dirty
  createdAt = [DateTime]::UtcNow.ToString('o'); archive = 'znamyona-epoh-yandex.zip'
  sha256 = $archiveHash; zipBytes = (Get-Item -LiteralPath $archivePath).Length
  unpackedBytes = $unpackedBytes; fileCount = $fileCount; previewDirectory = (Split-Path -Leaf $previewPath)
}
$manifest | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $outputPath 'yandex-release.json') -Encoding UTF8
Write-Output "Archive: $archivePath"
Write-Output "ZIP bytes: $((Get-Item -LiteralPath $archivePath).Length)"
Write-Output "SHA256: $archiveHash"
Write-Output "Extracted preview: $previewPath"
