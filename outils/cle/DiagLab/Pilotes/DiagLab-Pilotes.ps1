<#
.SYNOPSIS
  DiagLab Pro - Pilotes hors connexion.
.DESCRIPTION
  1. Liste les périphériques sans pilote ou en erreur, avec leur identifiant matériel.
  2. Installe tous les pilotes (.inf) du dossier PILOTES de la clé, sans internet.
  3. Sauvegarde les pilotes de ce PC sur la clé (pour un PC identique plus tard).
  4. Ouvre Windows Update sur les pilotes facultatifs (avec internet).
  Compatible Windows 10 et 11. Se relance en administrateur si nécessaire.
#>
[CmdletBinding()]
param([string]$Dossier)

$ErrorActionPreference = 'Continue'
$estAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $estAdmin) {
  Start-Process powershell.exe -Verb RunAs -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"{0}"' -f $PSCommandPath))
  exit
}

$cle = Split-Path -Qualifier $PSScriptRoot
if (-not $Dossier) { $Dossier = Join-Path $cle 'PILOTES' }
$fabricants = @{
  '8086' = 'Intel'; '1022' = 'AMD'; '1002' = 'AMD Radeon'; '10DE' = 'NVIDIA'; '10EC' = 'Realtek'; '0BDA' = 'Realtek'
  '14E4' = 'Broadcom'; '168C' = 'Qualcomm Atheros'; '17CB' = 'Qualcomm'; '14C3' = 'MediaTek'; '0E8D' = 'MediaTek'; '1B21' = 'ASMedia'
  '06CB' = 'Synaptics'; '04F3' = 'ELAN'; '27C6' = 'Goodix'; '8087' = 'Intel'; '0CF3' = 'Qualcomm Atheros'; '13D3' = 'AzureWave'
}
$codes = @{ 1 = 'mal configuré'; 10 = 'ne peut pas démarrer'; 28 = 'pilote non installé'; 31 = 'pilote inadapté'; 39 = 'pilote endommagé'; 43 = 'signalé défaillant'; 52 = 'signature invalide' }

function Lister {
  $liste = @(Get-CimInstance Win32_PnPEntity | Where-Object { $_.ConfigManagerErrorCode -ne 0 -and $_.ConfigManagerErrorCode -ne 22 })
  if ($liste.Count -eq 0) { Write-Host "`n  Tous les périphériques ont un pilote fonctionnel." -ForegroundColor Green; return }
  $lignes = foreach ($p in $liste) {
    $id = @($p.HardwareID)[0]
    $fab = ''
    if ($id -match '(VEN|VID)_([0-9A-Fa-f]{4})') { $fab = $fabricants[$Matches[2].ToUpper()] }
    $nom = $p.Name; if (-not $nom) { $nom = 'Périphérique inconnu' }
    $code = [int]$p.ConfigManagerErrorCode; $libelle = $codes[$code]; if (-not $libelle) { $libelle = 'erreur' }
    [pscustomobject]@{ Nom = $nom; Fabricant = $fab; Code = ('{0} ({1})' -f $code, $libelle); ID = $id }
  }
  Write-Host ''
  $lignes | Format-Table -AutoSize -Wrap | Out-Host
  $fichier = Join-Path $cle ('DiagLab\Pilotes\Manquants_{0}.txt' -f $env:COMPUTERNAME)
  try {
    $lignes | Format-Table -AutoSize -Wrap | Out-String -Width 300 | Set-Content -Path $fichier -Encoding UTF8
    Write-Host ('  Liste enregistrée : {0}' -f $fichier) -ForegroundColor Gray
  } catch { }
  Write-Host '  Recherchez chaque ID sur https://www.catalog.update.microsoft.com depuis un autre appareil,' -ForegroundColor Gray
  Write-Host '  ou dans DiagLab Pro, rubrique Pilotes. Copiez les pilotes trouvés dans le dossier PILOTES.' -ForegroundColor Gray
}

function Installer {
  if (-not (Test-Path $Dossier)) { Write-Host ("`n  Dossier introuvable : {0}" -f $Dossier) -ForegroundColor Yellow; return }
  # Les .cab du Catalogue Microsoft sont décompressés d'abord.
  foreach ($cab in @(Get-ChildItem $Dossier -Recurse -Filter *.cab -ErrorAction SilentlyContinue)) {
    $dest = Join-Path $cab.DirectoryName ($cab.BaseName + '_extrait')
    if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null; & expand.exe -F:* $cab.FullName $dest | Out-Null }
  }
  $nb = @(Get-ChildItem $Dossier -Recurse -Filter *.inf -ErrorAction SilentlyContinue).Count
  if ($nb -eq 0) { Write-Host "`n  Aucun fichier .inf dans le dossier." -ForegroundColor Yellow; return }
  Write-Host ("`n  Installation de {0} pilote(s) depuis {1}…" -f $nb, $Dossier) -ForegroundColor Cyan
  & pnputil.exe /add-driver (Join-Path $Dossier '*.inf') /subdirs /install
  & pnputil.exe /scan-devices | Out-Null
  Write-Host "`n  Terminé. Les périphériques restants :" -ForegroundColor Green
  Lister
}

function Sauvegarder {
  $modele = (Get-CimInstance Win32_ComputerSystem).Model -replace '[\\/:*?"<>|]', '_'
  $dest = Join-Path $Dossier ('{0}_{1}' -f $modele.Trim(), (Get-Date -Format 'yyyy-MM-dd'))
  New-Item -ItemType Directory -Path $dest -Force | Out-Null
  Write-Host ("`n  Export des pilotes tiers vers {0}…" -f $dest) -ForegroundColor Cyan
  & pnputil.exe /export-driver * $dest | Out-Null
  $nb = @(Get-ChildItem $dest -Recurse -Filter *.inf -ErrorAction SilentlyContinue).Count
  Write-Host ('  {0} pilote(s) sauvegardé(s). Réutilisables sur un PC du même modèle avec l''option 2.' -f $nb) -ForegroundColor Green
}

do {
  Clear-Host
  Write-Host ''
  Write-Host '  DiagLab Pro - Pilotes hors connexion' -ForegroundColor White
  Write-Host ('  Dossier de pilotes : {0}' -f $Dossier) -ForegroundColor Gray
  Write-Host ''
  Write-Host '  1. Lister les périphériques sans pilote'
  Write-Host '  2. Installer les pilotes du dossier PILOTES (sans internet)'
  Write-Host '  3. Sauvegarder les pilotes de ce PC sur la clé'
  Write-Host '  4. Windows Update : pilotes facultatifs (internet)'
  Write-Host '  0. Quitter'
  $c = Read-Host "`n  Votre choix"
  switch ($c) {
    '1' { Lister; Read-Host "`n  Entrée pour continuer" | Out-Null }
    '2' { Installer; Read-Host "`n  Entrée pour continuer" | Out-Null }
    '3' { Sauvegarder; Read-Host "`n  Entrée pour continuer" | Out-Null }
    '4' { Start-Process 'ms-settings:windowsupdate-optionalupdates' }
  }
} while ($c -ne '0')
