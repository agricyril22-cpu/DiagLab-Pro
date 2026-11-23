<#
.SYNOPSIS
  DiagLab Pro - Disques internes et externes : analyse, SMART, tests et réparation.
.DESCRIPTION
  Sans paramètre : menu interactif (se relance en administrateur).
  Avec -Action : utilisé par l'application DiagLab Pro.
    Analyse  -Out fichier.json            état de tous les disques (santé, SMART, volumes)
    Surface  -Disk N -Mode quick|full -Out progression.json -Stop fichier   test de lecture non destructif
    Chkdsk   -Letter X [-Fix] [-Scan]      vérification (lecture seule) ou réparation d'un volume
    Speed    -Letter X                     débit séquentiel et aléatoire (winsat)
    Online   -Disk N                       remettre un disque hors ligne en ligne
    ReadWrite -Disk N                      retirer l'attribut lecture seule
    Letter   -Disk N -Partition P          attribuer une lettre à un volume
    Format   -Letter X -FileSystem exFAT|NTFS|FAT32 -Label NOM   formatage (efface tout)
  Les opérations de lecture ne modifient rien. Compatible Windows 10 / 11, PowerShell 5.1.
#>
[CmdletBinding()]
param(
  [ValidateSet('Menu', 'Analyse', 'Surface', 'Chkdsk', 'Speed', 'Online', 'ReadWrite', 'Letter', 'Format')][string]$Action = 'Menu',
  [int]$Disk = -1,
  [int]$Partition = -1,
  [string]$Letter = '',
  [ValidateSet('quick', 'full')][string]$Mode = 'quick',
  [switch]$Fix,
  [switch]$Scan,
  [ValidateSet('exFAT', 'NTFS', 'FAT32')][string]$FileSystem = 'exFAT',
  [string]$Label = 'DONNEES',
  [string]$Out = '',
  [string]$Stop = ''
)

$ErrorActionPreference = 'Continue'
$estAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $estAdmin) {
  if ($Action -eq 'Menu') {
    Start-Process powershell.exe -Verb RunAs -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"{0}"' -f $PSCommandPath))
    exit
  }
  Write-Output 'ERREUR : droits administrateur requis.'
  exit 1
}
# Sorties des outils Windows (chkdsk, winsat) dans la page de code de la console
try { [Console]::OutputEncoding = [Text.Encoding]::GetEncoding([Globalization.CultureInfo]::CurrentCulture.TextInfo.OEMCodePage) } catch { }
$Letter = ([string]$Letter).Trim().TrimEnd(':').ToUpper()
$utf8 = New-Object Text.UTF8Encoding $false

function Write-Json($objet, [string]$chemin) {
  $json = $objet | ConvertTo-Json -Depth 6
  if ($chemin) { [IO.File]::WriteAllText($chemin, $json, $utf8) } else { $json }
}

function Find-Smartctl {
  foreach ($p in @("$env:ProgramFiles\smartmontools\bin\smartctl.exe", "${env:ProgramFiles(x86)}\smartmontools\bin\smartctl.exe", (Join-Path $PSScriptRoot 'smartctl.exe'))) {
    if ($p -and (Test-Path -LiteralPath $p)) { return $p }
  }
  $c = Get-Command smartctl.exe -ErrorAction SilentlyContinue
  if ($c) { return $c.Source }
  return $null
}

function Get-SmartSummary([int]$numero, [string]$smartctl) {
  if (-not $smartctl) { return $null }
  $sm = $null
  foreach ($extra in @(@(), @('-d', 'sat'), @('-d', 'nvme'))) {
    $args2 = @('-a', '-j') + $extra + @(('/dev/pd{0}' -f $numero))
    $raw = (& $smartctl @args2 2>$null) | Out-String
    if ($raw -match '"smart_status"' -or $raw -match '"nvme_smart_health_information_log"' -or $raw -match '"ata_smart_attributes"') {
      try { $sm = $raw | ConvertFrom-Json; break } catch { $sm = $null }
    }
  }
  if (-not $sm) { return $null }
  $s = [ordered]@{ Passed = $null; Temp = $null; Hours = $null; Realloc = $null; Pending = $null; Uncorr = $null; Crc = $null; Used = $null; MediaErr = $null; Spare = $null; Attrs = @() }
  if ($sm.smart_status) { $s.Passed = [bool]$sm.smart_status.passed }
  if ($sm.temperature) { $s.Temp = $sm.temperature.current }
  if ($sm.power_on_time) { $s.Hours = $sm.power_on_time.hours }
  if ($sm.ata_smart_attributes) {
    foreach ($a in @($sm.ata_smart_attributes.table)) {
      if (-not $a) { continue }
      $raw = [int64]$a.raw.value
      $s.Attrs += [pscustomobject]@{ Id = [int]$a.id; Name = [string]$a.name; Value = [int]$a.value; Worst = [int]$a.worst; Thresh = [int]$a.thresh; Raw = $raw }
      switch ([int]$a.id) { 5 { $s.Realloc = $raw } 197 { $s.Pending = $raw } 198 { $s.Uncorr = $raw } 199 { $s.Crc = $raw } }
    }
  }
  $n = $sm.nvme_smart_health_information_log
  if ($n) { $s.Used = $n.percentage_used; $s.MediaErr = $n.media_errors; $s.Spare = $n.available_spare; if ($null -eq $s.Temp) { $s.Temp = $n.temperature } }
  return [pscustomobject]$s
}

function Get-DiskReport {
  $smartctl = Find-Smartctl
  $physiques = @(Get-PhysicalDisk)
  $liste = @()
  foreach ($d in @(Get-Disk | Sort-Object Number)) {
    $pd = $physiques | Where-Object { [string]$_.DeviceId -eq [string]$d.Number } | Select-Object -First 1
    $rc = $null
    if ($pd) { $rc = $pd | Get-StorageReliabilityCounter -ErrorAction SilentlyContinue }
    $volumes = @()
    foreach ($pa in @(Get-Partition -DiskNumber $d.Number -ErrorAction SilentlyContinue)) {
      $v = $pa | Get-Volume -ErrorAction SilentlyContinue
      $l = [string]$pa.DriveLetter
      if ($l -notmatch '^[A-Za-z]$') { $l = '' }
      $volumes += [pscustomobject]@{
        Partition = [int]$pa.PartitionNumber; Letter = $l.ToUpper(); Size = [int64]$pa.Size; Type = [string]$pa.Type
        FS = [string]$v.FileSystem; Label = [string]$v.FileSystemLabel; Free = [int64]$v.SizeRemaining; Health = [string]$v.HealthStatus
        Hidden = [bool]($pa.IsHidden -or $pa.IsSystem -or [string]$pa.Type -in @('Reserved', 'Recovery', 'System'))
      }
    }
    $liste += [pscustomobject]@{
      Number = [int]$d.Number; Model = [string]$d.FriendlyName; Serial = ([string]$d.SerialNumber).Trim(); Bus = [string]$d.BusType
      Size = [int64]$d.Size; Style = [string]$d.PartitionStyle; Offline = [bool]$d.IsOffline; ReadOnly = [bool]$d.IsReadOnly
      System = [bool]($d.IsSystem -or $d.IsBoot); Media = [string]$pd.MediaType; Health = [string]$d.HealthStatus; Op = [string]$d.OperationalStatus
      Temp = $rc.Temperature; Wear = $rc.Wear; Hours = $rc.PowerOnHours; ReadErr = $rc.ReadErrorsUncorrected
      Volumes = $volumes; Smart = (Get-SmartSummary $d.Number $smartctl)
    }
  }
  [pscustomobject]@{ Smartctl = [bool]$smartctl; Computer = $env:COMPUTERNAME; Date = (Get-Date -Format 'dd/MM/yyyy HH:mm'); Disks = $liste }
}

# Lecture brute du disque (le .NET de PowerShell 5.1 refuse d'ouvrir \\.\PhysicalDriveN directement)
$rawDiskType = @'
using System; using System.Runtime.InteropServices; using Microsoft.Win32.SafeHandles;
public static class DiagLabRawDisk {
  [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
  public static extern SafeFileHandle CreateFile(string name, uint access, uint share, IntPtr sa, uint disposition, uint flags, IntPtr template);
}
'@

function Invoke-Surface([int]$numero, [string]$mode, [string]$progression, [string]$arret) {
  if (-not ('DiagLabRawDisk' -as [type])) { Add-Type -TypeDefinition $rawDiskType }
  $taille = [int64](Get-Disk -Number $numero).Size
  $h = [DiagLabRawDisk]::CreateFile(('\\.\PhysicalDrive{0}' -f $numero), [uint32]2147483648, 3, [IntPtr]::Zero, 3, [uint32]134217728, [IntPtr]::Zero)
  if ($h.IsInvalid) { Write-Output ('ERREUR : ouverture du disque {0} impossible (code {1}).' -f $numero, [Runtime.InteropServices.Marshal]::GetLastWin32Error()); return }
  $fs = New-Object IO.FileStream($h, [IO.FileAccess]::Read, 4096, $false)
  $bloc = if ($mode -eq 'full') { 4MB } else { 1MB }
  $nbBlocs = [int64][math]::Ceiling($taille / $bloc)
  if ($mode -eq 'full') { $positions = $null; $total = $nbBlocs } else { $total = [int64][math]::Min(2048, $nbBlocs) }
  $buf = New-Object byte[] $bloc
  $st = @{ ok = 0; lent = 0; tresLent = 0; erreurs = 0; lus = [int64]0; zones = @() }
  $chrono = [Diagnostics.Stopwatch]::StartNew(); $dernier = -1000
  for ($i = [int64]0; $i -lt $total; $i++) {
    if ($arret -and (Test-Path -LiteralPath $arret)) { $st.arrete = $true; break }
    if ($mode -eq 'full') { $k = $i } else { $k = [int64][math]::Floor($i * ($nbBlocs - 1) / [math]::Max(1, $total - 1)) }
    $offset = $k * $bloc
    $longueur = [int][math]::Min($bloc, $taille - $offset)
    if ($longueur -le 0) { continue }
    $t = [Diagnostics.Stopwatch]::StartNew()
    try {
      [void]$fs.Seek($offset, [IO.SeekOrigin]::Begin)
      $lu = $fs.Read($buf, 0, $longueur)
      $st.lus += $lu
      $ms = $t.Elapsed.TotalMilliseconds
      if ($ms -lt 150) { $st.ok++ } elseif ($ms -lt 500) { $st.lent++ } else { $st.tresLent++; if ($st.zones.Count -lt 30) { $st.zones += ('{0:N0} Mo : {1:N0} ms' -f ($offset / 1MB), $ms) } }
    } catch {
      $st.erreurs++
      if ($st.zones.Count -lt 30) { $st.zones += ('{0:N0} Mo : erreur de lecture' -f ($offset / 1MB)) }
    }
    if ($progression -and ($chrono.ElapsedMilliseconds - $dernier -ge 1000 -or $i -eq $total - 1)) {
      $dernier = $chrono.ElapsedMilliseconds
      $vitesse = if ($chrono.Elapsed.TotalSeconds -gt 0) { [math]::Round($st.lus / 1MB / $chrono.Elapsed.TotalSeconds, 1) } else { 0 }
      Write-Json ([pscustomobject]@{ Done = $i + 1; Total = $total; Pct = [math]::Round(($i + 1) / $total * 100, 1); Ok = $st.ok; Slow = $st.lent; VerySlow = $st.tresLent; Errors = $st.erreurs; Speed = $vitesse; Zones = $st.zones; Finished = $false }) $progression
    }
  }
  $fs.Dispose()
  $fin = [pscustomobject]@{ Done = $i; Total = $total; Pct = [math]::Round($i / [math]::Max(1, $total) * 100, 1); Ok = $st.ok; Slow = $st.lent; VerySlow = $st.tresLent; Errors = $st.erreurs
    Speed = [math]::Round($st.lus / 1MB / [math]::Max(0.001, $chrono.Elapsed.TotalSeconds), 1); Zones = $st.zones; Finished = $true; Stopped = [bool]$st.arrete; Seconds = [int]$chrono.Elapsed.TotalSeconds }
  if ($progression) { Write-Json $fin $progression }
  return $fin
}

function Test-DisqueSysteme([string]$lettre) {
  if ($lettre -eq $env:SystemDrive.TrimEnd(':').ToUpper()) { return $true }
  $p = Get-Partition -DriveLetter $lettre -ErrorAction SilentlyContinue
  if (-not $p) { return $false }
  $d = Get-Disk -Number $p.DiskNumber
  return [bool]($d.IsSystem -or $d.IsBoot)
}

function Invoke-Chkdsk([string]$lettre, [bool]$reparer, [bool]$surface) {
  if ($lettre -notmatch '^[A-Z]$') { Write-Output 'ERREUR : lettre de lecteur invalide.'; return }
  if ($reparer -and (Test-DisqueSysteme $lettre)) { Write-Output 'ERREUR : réparation refusée sur le disque système depuis Windows. Utilisez la clé de secours (menu Réparation, option 3).'; return }
  $cmd = @(('{0}:' -f $lettre))
  if ($reparer) { $cmd += '/f'; if ($surface) { $cmd += '/r' }; $cmd += '/x' } elseif ($surface) { $cmd += '/scan' }
  Write-Output ('> chkdsk {0}' -f ($cmd -join ' '))
  'N' | & chkdsk.exe @cmd 2>&1 | ForEach-Object { $_ }
  Write-Output ('CODE={0}' -f $LASTEXITCODE)
}

function Invoke-Speed([string]$lettre) {
  if ($lettre -notmatch '^[A-Z]$') { Write-Output 'ERREUR : lettre de lecteur invalide.'; return }
  foreach ($t in @(@('SEQREAD', '-seq', '-read'), @('SEQWRITE', '-seq', '-write'), @('RANREAD', '-ran', '-read'))) {
    $sortie = (& winsat.exe disk $t[1] $t[2] -drive $lettre.ToLower() 2>&1) | Out-String
    $m = [regex]::Match($sortie, '([\d]+[.,]?[\d]*)\s*MB/s')
    if ($m.Success) { Write-Output ('{0}={1}' -f $t[0], $m.Groups[1].Value.Replace(',', '.')) } else { Write-Output ('{0}=?' -f $t[0]); Write-Output $sortie }
  }
}

function Get-Verdict($d) {
  $msg = @(); $niveau = 'OK'
  $s = $d.Smart
  if ($d.Health -and $d.Health -ne 'Healthy') { $niveau = 'CRITIQUE'; $msg += "Windows signale l'état « $($d.Health) »" }
  if ($s) {
    if ($s.Passed -eq $false) { $niveau = 'CRITIQUE'; $msg += 'SMART : échec' }
    if ($s.Pending -gt 0 -or $s.Uncorr -gt 0) { $niveau = 'CRITIQUE'; $msg += ('{0} secteur(s) instable(s)' -f ([int64]$s.Pending + [int64]$s.Uncorr)) }
    if ($s.Realloc -gt 0) { if ($niveau -eq 'OK') { $niveau = 'ATTENTION' }; $msg += ('{0} secteur(s) réalloué(s)' -f $s.Realloc) }
    if ($s.Crc -gt 0) { if ($niveau -eq 'OK') { $niveau = 'ATTENTION' }; $msg += ('{0} erreur(s) de transmission (câble, boîtier USB)' -f $s.Crc) }
    if ($s.Used -ge 70) { if ($niveau -eq 'OK') { $niveau = 'ATTENTION' }; $msg += ('usure SSD {0} %' -f $s.Used) }
  }
  if ($d.ReadErr -gt 0) { $niveau = 'CRITIQUE'; $msg += ('{0} erreur(s) de lecture' -f $d.ReadErr) }
  if ($d.Offline) { $msg += 'disque hors ligne' }
  if ($d.ReadOnly) { $msg += 'lecture seule' }
  [pscustomobject]@{ Niveau = $niveau; Messages = ($msg -join ' ; ') }
}

function Show-Menu {
  do {
    Clear-Host
    Write-Host ''
    Write-Host '  DiagLab Pro - Disques internes et externes' -ForegroundColor White
    Write-Host ''
    Write-Host '  1. Analyser tous les disques (santé, SMART, volumes)'
    Write-Host '  2. Test de surface rapide (lecture seule)'
    Write-Host '  3. Test de surface complet (lecture seule, long)'
    Write-Host "  4. Vérifier un volume (CHKDSK, sans modification)"
    Write-Host '  5. Réparer un volume (CHKDSK /f)'
    Write-Host '  6. Remettre un disque en ligne / retirer la lecture seule'
    Write-Host '  7. Attribuer une lettre à un volume'
    Write-Host '  8. Mesurer la vitesse d''un volume'
    Write-Host '  0. Quitter'
    $c = Read-Host "`n  Votre choix"
    switch ($c) {
      '1' {
        $r = Get-DiskReport
        foreach ($d in $r.Disks) {
          $v = Get-Verdict $d
          $couleur = 'Green'; if ($v.Niveau -eq 'ATTENTION') { $couleur = 'Yellow' } elseif ($v.Niveau -eq 'CRITIQUE') { $couleur = 'Red' }
          Write-Host ''
          Write-Host ('  Disque {0} : {1} ({2}, {3:N0} Go) - {4}' -f $d.Number, $d.Model, $d.Bus, ($d.Size / 1GB), $v.Niveau) -ForegroundColor $couleur
          if ($v.Messages) { Write-Host ('    {0}' -f $v.Messages) }
          foreach ($vo in ($d.Volumes | Where-Object { -not $_.Hidden })) { Write-Host ('    {0}: {1} {2} - {3:N1} Go libres sur {4:N1}' -f $(if ($vo.Letter) { $vo.Letter } else { '?' }), $vo.FS, $vo.Label, ($vo.Free / 1GB), ($vo.Size / 1GB)) }
        }
        if (-not $r.Smartctl) { Write-Host "`n  Astuce : installez smartmontools pour lire le SMART complet, y compris sur la plupart des boîtiers USB." -ForegroundColor Gray }
        Read-Host "`n  Entrée pour continuer" | Out-Null
      }
      { $_ -in '2', '3' } {
        Get-Disk | Format-Table Number, FriendlyName, BusType, @{ n = 'Go'; e = { [int]($_.Size / 1GB) } } -AutoSize | Out-Host
        $n = Read-Host '  Numéro du disque'
        if ($n -match '^\d+$') {
          $m = 'quick'; if ($c -eq '3') { $m = 'full' }
          Write-Host '  Lecture en cours… (Ctrl + C pour arrêter)' -ForegroundColor Cyan
          $f = Invoke-Surface ([int]$n) $m '' ''
          if ($f) { Write-Host ('  Terminé : {0} bloc(s) normaux, {1} lents, {2} très lents, {3} erreur(s), {4} Mo/s.' -f $f.Ok, $f.Slow, $f.VerySlow, $f.Errors, $f.Speed); $f.Zones | ForEach-Object { Write-Host ('    {0}' -f $_) } }
        }
        Read-Host "`n  Entrée pour continuer" | Out-Null
      }
      { $_ -in '4', '5' } {
        $l = (Read-Host '  Lettre du volume (ex. E)').Trim().TrimEnd(':').ToUpper()
        Invoke-Chkdsk $l ($c -eq '5') $false | Out-Host
        Read-Host "`n  Entrée pour continuer" | Out-Null
      }
      '6' {
        Get-Disk | Format-Table Number, FriendlyName, IsOffline, IsReadOnly -AutoSize | Out-Host
        $n = Read-Host '  Numéro du disque'
        if ($n -match '^\d+$') { Set-Disk -Number ([int]$n) -IsOffline $false; Set-Disk -Number ([int]$n) -IsReadOnly $false; Write-Host '  Fait.' -ForegroundColor Green }
        Read-Host "`n  Entrée pour continuer" | Out-Null
      }
      '7' {
        Get-Partition | Where-Object { -not $_.DriveLetter -or [string]$_.DriveLetter -notmatch '^[A-Za-z]$' } | Format-Table DiskNumber, PartitionNumber, Type, @{ n = 'Go'; e = { [math]::Round($_.Size / 1GB, 1) } } -AutoSize | Out-Host
        $n = Read-Host '  Numéro du disque'; $p = Read-Host '  Numéro de partition'
        if ($n -match '^\d+$' -and $p -match '^\d+$') { Add-PartitionAccessPath -DiskNumber ([int]$n) -PartitionNumber ([int]$p) -AssignDriveLetter; Get-Partition -DiskNumber ([int]$n) -PartitionNumber ([int]$p) | Format-Table DriveLetter -AutoSize | Out-Host }
        Read-Host "`n  Entrée pour continuer" | Out-Null
      }
      '8' {
        $l = (Read-Host '  Lettre du volume (ex. E)').Trim().TrimEnd(':').ToUpper()
        Invoke-Speed $l | Out-Host
        Read-Host "`n  Entrée pour continuer" | Out-Null
      }
    }
  } while ($c -ne '0')
}

switch ($Action) {
  'Menu' { Show-Menu }
  'Analyse' { Write-Json (Get-DiskReport) $Out }
  'Surface' { if ($Disk -lt 0) { Write-Output 'ERREUR : numéro de disque manquant.'; exit 1 }; [void](Invoke-Surface $Disk $Mode $Out $Stop) }
  'Chkdsk' { Invoke-Chkdsk $Letter ([bool]$Fix) ([bool]$Scan) }
  'Speed' { Invoke-Speed $Letter }
  'Online' { Set-Disk -Number $Disk -IsOffline $false; Write-Output ('Disque {0} en ligne.' -f $Disk) }
  'ReadWrite' { Set-Disk -Number $Disk -IsReadOnly $false; Write-Output ('Disque {0} : lecture seule retirée.' -f $Disk) }
  'Letter' {
    Add-PartitionAccessPath -DiskNumber $Disk -PartitionNumber $Partition -AssignDriveLetter
    $l = [string](Get-Partition -DiskNumber $Disk -PartitionNumber $Partition).DriveLetter
    Write-Output ('LETTRE={0}' -f $l)
  }
  'Format' {
    if ($Letter -notmatch '^[A-Z]$') { Write-Output 'ERREUR : lettre de lecteur invalide.'; exit 1 }
    if (Test-DisqueSysteme $Letter) { Write-Output 'ERREUR : formatage refusé sur le disque système.'; exit 1 }
    $nom = ($Label -replace '[^\w \-]', '').Trim(); if (-not $nom) { $nom = 'DONNEES' }
    Format-Volume -DriveLetter $Letter -FileSystem $FileSystem -NewFileSystemLabel $nom -Confirm:$false -Force | Out-Null
    Write-Output ('Volume {0}: formaté en {1} ({2}).' -f $Letter, $FileSystem, $nom)
  }
}
