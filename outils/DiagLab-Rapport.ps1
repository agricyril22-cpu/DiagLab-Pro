<#
.SYNOPSIS
  DiagLab Pro - Rapport de diagnostic Windows en un clic.

.DESCRIPTION
  Analyse le système, la mémoire, les disques, la batterie, la stabilité,
  les pilotes, la sécurité, Windows Update et le réseau, puis crée un rapport
  HTML (à montrer au client) et un fichier JSON (à importer dans DiagLab Pro).
  Lecture seule : le script ne modifie rien sur la machine.
  Compatible Windows 10 / 11, PowerShell 5.1 et 7.

.PARAMETER Dossier
  Dossier de sortie des rapports. Par défaut : le Bureau.

.PARAMETER Complet
  Ajoute la vérification d'intégrité de Windows (sfc /verifyonly et DISM CheckHealth).
  Plus long (plusieurs minutes). Nécessite les droits administrateur.

.PARAMETER NePasOuvrir
  N'ouvre pas le rapport HTML à la fin.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .\DiagLab-Rapport.ps1 -Complet
#>
[CmdletBinding()]
param(
  [string]$Dossier = [Environment]::GetFolderPath('Desktop'),
  [switch]$Complet,
  [switch]$NePasOuvrir
)

$ErrorActionPreference = 'SilentlyContinue'
$ProgressPreference = 'SilentlyContinue'
$versionScript = '2.0'
$debut = Get-Date
$estAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

$constats = New-Object System.Collections.Generic.List[object]
$sections = New-Object System.Collections.Generic.List[object]

function Ajouter-Constat {
  param(
    [ValidateSet('critique', 'attention', 'info', 'ok')][string]$Niveau,
    [string]$Domaine,
    [string]$Message,
    [string]$Conseil = ''
  )
  $constats.Add([pscustomobject]@{ Niveau = $Niveau; Domaine = $Domaine; Message = $Message; Conseil = $Conseil })
}
function Ajouter-Section([string]$Titre, [object[]]$Lignes) {
  if ($Lignes -and $Lignes.Count -gt 0) { $sections.Add([pscustomobject]@{ Titre = $Titre; Lignes = $Lignes }) }
}
function L([string]$Libelle, $Valeur) { [pscustomobject]@{ K = $Libelle; V = [string]$Valeur } }
function Enc([string]$Texte) { [System.Net.WebUtility]::HtmlEncode($Texte) }
function Go($Octets) { '{0:N1} Go' -f ([double]$Octets / 1GB) }
function Etape([string]$Texte) { Write-Host ('  > ' + $Texte) -ForegroundColor Cyan }
function Compter-Evenements([hashtable]$Filtre) { @(Get-WinEvent -FilterHashtable $Filtre -ErrorAction SilentlyContinue).Count }

Write-Host ''
Write-Host '  DiagLab Pro - Rapport de diagnostic Windows' -ForegroundColor White
Write-Host '  Lecture seule : rien n''est modifié sur ce PC.' -ForegroundColor Gray
if (-not $estAdmin) {
  Write-Host '  Sans droits administrateur : SMART, températures, TPM et BitLocker seront limités.' -ForegroundColor Yellow
}
Write-Host ''

# ---------------------------------------------------------------- 1. Système
Etape 'Système'
$os   = Get-CimInstance Win32_OperatingSystem
$cs   = Get-CimInstance Win32_ComputerSystem
$bios = Get-CimInstance Win32_BIOS
$cpu  = Get-CimInstance Win32_Processor | Select-Object -First 1
$cm   = Get-CimInstance Win32_BaseBoard
$nt   = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion'
$versionWin = $nt.DisplayVersion
if (-not $versionWin) { $versionWin = $nt.ReleaseId }
$edition = [string]$nt.EditionID
$uptime = (Get-Date) - $os.LastBootUpTime
$biosDate = ''
if ($bios.ReleaseDate) { $biosDate = ' (' + $bios.ReleaseDate.ToString('dd/MM/yyyy') + ')' }

Ajouter-Section 'Système' @(
  (L 'Ordinateur' $env:COMPUTERNAME),
  (L 'Fabricant / modèle' ('{0} {1}' -f $cs.Manufacturer, $cs.Model)),
  (L 'Numéro de série' $bios.SerialNumber),
  (L 'Carte mère' ('{0} {1}' -f $cm.Manufacturer, $cm.Product)),
  (L 'BIOS' ($bios.SMBIOSBIOSVersion + $biosDate)),
  (L 'Windows' ('{0} {1} (build {2}.{3})' -f $os.Caption, $versionWin, $nt.CurrentBuild, $nt.UBR)),
  (L 'Processeur' ('{0} - {1} cœurs / {2} threads' -f ([string]$cpu.Name).Trim(), $cpu.NumberOfCores, $cpu.NumberOfLogicalProcessors)),
  (L 'Allumé depuis' ('{0} j {1} h {2} min' -f $uptime.Days, $uptime.Hours, $uptime.Minutes))
)
if ($uptime.TotalDays -gt 14) {
  Ajouter-Constat attention 'Système' ('Pas de redémarrage depuis {0} jours.' -f [int]$uptime.TotalDays) 'Redémarrer pour appliquer les mises à jour et libérer la mémoire.'
}

# Fin de support (à mettre à jour à chaque nouvelle version de Windows)
if ($os.Caption -match 'Windows 10') {
  Ajouter-Constat critique 'Windows' 'Windows 10 n''est plus pris en charge depuis le 14 octobre 2025.' 'Migrer vers Windows 11 si le PC est compatible, sinon souscrire aux mises à jour de sécurité étendues (ESU) ou remplacer le PC.'
}
elseif ($os.Caption -match 'Windows 11') {
  $finies = @('21H2', '22H2', '23H2', '24H2')
  if ($edition -match 'Enterprise|Education') { $finies = @('21H2', '22H2', '23H2') }
  if ($finies -contains $versionWin) {
    Ajouter-Constat attention 'Windows' ('La version {0} de Windows 11 n''est plus prise en charge pour l''édition {1}.' -f $versionWin, $edition) 'Installer la dernière version de Windows 11 via Windows Update.'
  }
}

# ---------------------------------------------------------------- 2. Mémoire
Etape 'Mémoire'
$ramTotale = [double]$cs.TotalPhysicalMemory
$ramLibre = [double]$os.FreePhysicalMemory * 1KB
$pctRam = 0
if ($ramTotale -gt 0) { $pctRam = [math]::Round((1 - $ramLibre / $ramTotale) * 100) }
$barrettes = @(Get-CimInstance Win32_PhysicalMemory)
$detailRam = ($barrettes | ForEach-Object { '{0} à {1} MT/s ({2})' -f (Go $_.Capacity), $_.ConfiguredClockSpeed, ([string]$_.Manufacturer).Trim() }) -join ' | '
Ajouter-Section 'Mémoire vive' @(
  (L 'Installée' (Go $ramTotale)),
  (L 'Utilisée maintenant' ('{0} %' -f $pctRam)),
  (L 'Barrettes' ('{0} : {1}' -f $barrettes.Count, $detailRam))
)
if ($ramTotale -gt 0 -and $ramTotale -lt 7.5GB) {
  Ajouter-Constat attention 'Mémoire' ('Seulement {0} de mémoire vive.' -f (Go $ramTotale)) 'Passer à 16 Go pour Windows 11 (8 Go minimum).'
}
if ($pctRam -ge 90) {
  Ajouter-Constat attention 'Mémoire' ('Mémoire utilisée à {0} %.' -f $pctRam) 'Identifier les programmes gourmands dans le Gestionnaire des tâches, ou ajouter de la mémoire.'
}

# ---------------------------------------------------------------- 3. Disques
Etape 'Disques'
$lignesDisques = @()
$disques = @(Get-PhysicalDisk)
foreach ($d in $disques) {
  $info = '{0} - {1} - {2} - {3}' -f $d.FriendlyName, $d.MediaType, $d.BusType, (Go $d.Size)
  if ($estAdmin) {
    $fiab = $d | Get-StorageReliabilityCounter
    if ($fiab) {
      if ($null -ne $fiab.Wear) { $info += (' - usure {0} %' -f $fiab.Wear) }
      if ($fiab.Temperature) { $info += (' - {0} °C' -f $fiab.Temperature) }
      if ($fiab.Wear -ge 90) {
        Ajouter-Constat critique 'Disque' ('{0} : usure du SSD à {1} %.' -f $d.FriendlyName, $fiab.Wear) 'Sauvegarder et remplacer le SSD.'
      }
      elseif ($fiab.Wear -ge 70) {
        Ajouter-Constat attention 'Disque' ('{0} : usure du SSD à {1} %.' -f $d.FriendlyName, $fiab.Wear) 'Prévoir le remplacement du SSD.'
      }
      if ($fiab.ReadErrorsUncorrected -gt 0) {
        Ajouter-Constat critique 'Disque' ('{0} : {1} erreurs de lecture non corrigées.' -f $d.FriendlyName, $fiab.ReadErrorsUncorrected) 'Sauvegarder immédiatement et contrôler avec CrystalDiskInfo.'
      }
    }
  }
  $lignesDisques += (L $info ('{0} / {1}' -f $d.HealthStatus, $d.OperationalStatus))
  $hs = [string]$d.HealthStatus
  if ($hs -and ($hs -notin @('Healthy', '0'))) {
    Ajouter-Constat critique 'Disque' ('{0} : état {1}.' -f $d.FriendlyName, $d.HealthStatus) 'Sauvegarder les données immédiatement puis remplacer le disque.'
  }
}
if ($estAdmin) {
  foreach ($p in @(Get-CimInstance -Namespace root\wmi -ClassName MSStorageDriver_FailurePredictStatus)) {
    if ($p.PredictFailure) {
      Ajouter-Constat critique 'Disque' 'Le SMART annonce une panne imminente d''un disque.' 'Sauvegarder immédiatement et remplacer le disque.'
    }
  }
}
foreach ($v in @(Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3')) {
  if (-not $v.Size) { continue }
  $pctLibre = [math]::Round([double]$v.FreeSpace / [double]$v.Size * 100)
  $lignesDisques += (L ('Volume {0} {1}' -f $v.DeviceID, $v.VolumeName) ('{0} libres sur {1} ({2} %)' -f (Go $v.FreeSpace), (Go $v.Size), $pctLibre))
  if ($pctLibre -lt 10) {
    Ajouter-Constat critique 'Disque' ('Volume {0} presque plein ({1} % libres).' -f $v.DeviceID, $pctLibre) 'Libérer de la place : Nettoyage de disque, fichiers temporaires, déplacer les fichiers volumineux.'
  }
  elseif ($pctLibre -lt 15) {
    Ajouter-Constat attention 'Disque' ('Volume {0} : {1} % libres.' -f $v.DeviceID, $pctLibre) 'Libérer de la place.'
  }
}
$partSys = Get-Partition -DriveLetter ($env:SystemDrive.TrimEnd(':'))
if ($partSys) {
  $dSys = $disques | Where-Object { [string]$_.DeviceId -eq [string]$partSys.DiskNumber } | Select-Object -First 1
  if ($dSys -and ([string]$dSys.MediaType -in @('HDD', '3'))) {
    Ajouter-Constat attention 'Performance' 'Windows est installé sur un disque dur mécanique.' 'Remplacer par un SSD : gain de vitesse très important.'
  }
}
Ajouter-Section 'Stockage' $lignesDisques

# ---------------------------------------------------------------- 4. Batterie
Etape 'Batterie'
$estPortable = $false
$batterie = Get-CimInstance Win32_Battery | Select-Object -First 1
if ($batterie) {
  $estPortable = $true
  $lignesBat = @((L 'Charge actuelle' ('{0} %' -f $batterie.EstimatedChargeRemaining)))
  $tmpXml = Join-Path $env:TEMP 'diaglab-batterie.xml'
  powercfg /batteryreport /xml /output "$tmpXml" | Out-Null
  if (Test-Path $tmpXml) {
    [xml]$xml = Get-Content $tmpXml -Raw
    $b = @($xml.BatteryReport.Batteries.Battery)[0]
    if ($b -and [double]$b.DesignCapacity -gt 0) {
      $sante = [math]::Round([double]$b.FullChargeCapacity / [double]$b.DesignCapacity * 100)
      $lignesBat += (L 'Modèle' ('{0} {1}' -f $b.Manufacturer, $b.Id))
      $lignesBat += (L 'Capacité d''origine' ('{0:N0} mWh' -f [double]$b.DesignCapacity))
      $lignesBat += (L 'Capacité actuelle' ('{0:N0} mWh' -f [double]$b.FullChargeCapacity))
      $lignesBat += (L 'Santé' ('{0} %' -f $sante))
      if ($b.CycleCount) { $lignesBat += (L 'Cycles' $b.CycleCount) }
      if ($sante -lt 60) {
        Ajouter-Constat critique 'Batterie' ('Batterie à {0} % de sa capacité d''origine.' -f $sante) 'Remplacer la batterie.'
      }
      elseif ($sante -lt 80) {
        Ajouter-Constat attention 'Batterie' ('Batterie à {0} % de sa capacité d''origine.' -f $sante) 'Usure avancée : prévoir le remplacement.'
      }
      else {
        Ajouter-Constat ok 'Batterie' ('Batterie en bon état ({0} % de sa capacité d''origine).' -f $sante)
      }
    }
    Remove-Item $tmpXml -Force
  }
  Ajouter-Section 'Batterie' $lignesBat
}

# ---------------------------------------------------------------- 5. Températures
Etape 'Températures'
if ($estAdmin) {
  $zones = @(Get-CimInstance -Namespace root\wmi -ClassName MSAcpi_ThermalZoneTemperature)
  if ($zones.Count -gt 0) {
    $temps = @($zones | ForEach-Object { [math]::Round($_.CurrentTemperature / 10 - 273.15) })
    $tMax = ($temps | Measure-Object -Maximum).Maximum
    Ajouter-Section 'Températures (ACPI)' @(
      (L 'Zones thermiques' (($temps | ForEach-Object { '{0} °C' -f $_ }) -join ', ')),
      (L 'Remarque' 'Valeurs fournies par la carte mère, parfois approximatives : confirmer avec HWiNFO.')
    )
    if ($tMax -ge 85) {
      Ajouter-Constat critique 'Température' ('Zone thermique à {0} °C.' -f $tMax) 'Dépoussiérer, remplacer la pâte thermique, vérifier le ventilateur.'
    }
    elseif ($tMax -ge 70) {
      Ajouter-Constat attention 'Température' ('Zone thermique à {0} °C.' -f $tMax) 'Vérifier la ventilation.'
    }
  }
}

# ---------------------------------------------------------------- 6. Stabilité
Etape 'Stabilité (30 derniers jours)'
$depuis = (Get-Date).AddDays(-30)
$nbCoupures = Compter-Evenements @{ LogName = 'System'; ProviderName = 'Microsoft-Windows-Kernel-Power'; Id = 41; StartTime = $depuis }
$evBsod = @(Get-WinEvent -FilterHashtable @{ LogName = 'System'; ProviderName = 'Microsoft-Windows-WER-SystemErrorReporting'; Id = 1001; StartTime = $depuis } -ErrorAction SilentlyContinue)
$nbWhea = Compter-Evenements @{ LogName = 'System'; ProviderName = 'Microsoft-Windows-WHEA-Logger'; Level = 2, 3; StartTime = $depuis }
$nbErrDisque = Compter-Evenements @{ LogName = 'System'; ProviderName = 'disk'; Id = 7, 51, 153; StartTime = $depuis }
$nbNtfs = Compter-Evenements @{ LogName = 'System'; ProviderName = 'Ntfs', 'Microsoft-Windows-Ntfs'; Level = 1, 2; StartTime = $depuis }
$nbCrashApp = Compter-Evenements @{ LogName = 'Application'; Id = 1000; StartTime = $depuis }
$minidumps = @(Get-ChildItem (Join-Path $env:SystemRoot 'Minidump') -Filter *.dmp -ErrorAction SilentlyContinue)

$codesBsod = @{
  '0x0000000a' = 'IRQL_NOT_LESS_OR_EQUAL'; '0x00000019' = 'BAD_POOL_HEADER'; '0x0000001a' = 'MEMORY_MANAGEMENT'
  '0x0000001e' = 'KMODE_EXCEPTION_NOT_HANDLED'; '0x0000003b' = 'SYSTEM_SERVICE_EXCEPTION'; '0x00000050' = 'PAGE_FAULT_IN_NONPAGED_AREA'
  '0x0000007a' = 'KERNEL_DATA_INPAGE_ERROR'; '0x0000007b' = 'INACCESSIBLE_BOOT_DEVICE'; '0x0000007e' = 'SYSTEM_THREAD_EXCEPTION_NOT_HANDLED'
  '0x0000009f' = 'DRIVER_POWER_STATE_FAILURE'; '0x000000c2' = 'BAD_POOL_CALLER'; '0x000000d1' = 'DRIVER_IRQL_NOT_LESS_OR_EQUAL'
  '0x000000ea' = 'THREAD_STUCK_IN_DEVICE_DRIVER'; '0x000000ef' = 'CRITICAL_PROCESS_DIED'; '0x00000101' = 'CLOCK_WATCHDOG_TIMEOUT'
  '0x00000116' = 'VIDEO_TDR_FAILURE'; '0x00000124' = 'WHEA_UNCORRECTABLE_ERROR'; '0x00000133' = 'DPC_WATCHDOG_VIOLATION'
  '0x00000139' = 'KERNEL_SECURITY_CHECK_FAILURE'; '0x00000154' = 'UNEXPECTED_STORE_EXCEPTION'
}
$dernierCode = ''
if ($evBsod.Count -gt 0) {
  $m = [regex]::Match([string]$evBsod[0].Message, '0x[0-9a-fA-F]{8}')
  if ($m.Success) {
    $dernierCode = $m.Value.ToLower()
    if ($codesBsod.ContainsKey($dernierCode)) { $dernierCode = '{0} ({1})' -f $dernierCode, $codesBsod[$dernierCode] }
  }
}
$lignesStab = @(
  (L 'Écrans bleus' $evBsod.Count),
  (L 'Arrêts brutaux (Kernel-Power 41)' $nbCoupures),
  (L 'Erreurs matérielles (WHEA)' $nbWhea),
  (L 'Erreurs disque' $nbErrDisque),
  (L 'Erreurs du système de fichiers (NTFS)' $nbNtfs),
  (L 'Plantages d''applications' $nbCrashApp),
  (L 'Fichiers minidump' $minidumps.Count)
)
if ($dernierCode) { $lignesStab += (L 'Dernier code d''arrêt' $dernierCode) }
Ajouter-Section 'Stabilité (30 derniers jours)' $lignesStab

if ($evBsod.Count -ge 3) {
  Ajouter-Constat critique 'Stabilité' ('{0} écrans bleus en 30 jours. Dernier code : {1}.' -f $evBsod.Count, $dernierCode) 'Analyser les minidumps (BlueScreenView), tester la RAM (MemTest86), mettre à jour ou rétrograder le pilote en cause.'
}
elseif ($evBsod.Count -gt 0) {
  Ajouter-Constat attention 'Stabilité' ('{0} écran(s) bleu(s) en 30 jours. Dernier code : {1}.' -f $evBsod.Count, $dernierCode) 'Analyser les minidumps avec BlueScreenView.'
}
if ($nbCoupures -gt 0) {
  Ajouter-Constat attention 'Stabilité' ('{0} arrêt(s) brutal(aux) sans extinction propre.' -f $nbCoupures) 'Causes possibles : coupure de courant, alimentation ou batterie faible, surchauffe, bouton Power maintenu.'
}
if ($nbWhea -gt 0) {
  Ajouter-Constat critique 'Matériel' ('{0} erreur(s) matérielle(s) WHEA.' -f $nbWhea) 'Retirer tout overclocking et le profil XMP/EXPO, mettre à jour le BIOS, tester la RAM et le processeur.'
}
if ($nbErrDisque -gt 0 -or $nbNtfs -gt 0) {
  Ajouter-Constat critique 'Disque' ('{0} erreur(s) disque et {1} erreur(s) NTFS.' -f $nbErrDisque, $nbNtfs) 'Sauvegarder, vérifier le SMART, lancer chkdsk /f /r, contrôler le câble SATA.'
}
if ($nbCrashApp -gt 30) {
  Ajouter-Constat info 'Stabilité' ('{0} plantages d''applications en 30 jours.' -f $nbCrashApp) 'Identifier l''application en cause dans l''Observateur d''événements (journal Application, ID 1000).'
}

# ---------------------------------------------------------------- 7. Périphériques
Etape 'Périphériques et pilotes'
$enErreur = @(Get-CimInstance Win32_PnPEntity | Where-Object { $_.ConfigManagerErrorCode -ne 0 -and $_.ConfigManagerErrorCode -ne 22 })
$lignesPeriph = @((L 'Périphériques en erreur' $enErreur.Count))
foreach ($p in ($enErreur | Select-Object -First 10)) {
  $nom = $p.Name
  if (-not $nom) { $nom = $p.DeviceID }
  $lignesPeriph += (L $nom ('Code {0}' -f $p.ConfigManagerErrorCode))
}
if ($enErreur.Count -gt 0) {
  Ajouter-Constat attention 'Pilotes' ('{0} périphérique(s) en erreur dans le Gestionnaire de périphériques.' -f $enErreur.Count) 'Installer les pilotes du constructeur (code 28 : pilote absent ; code 43 : matériel signalé défaillant).'
}
foreach ($g in @(Get-CimInstance Win32_VideoController)) {
  $dateG = ''
  if ($g.DriverDate) { $dateG = ' (' + $g.DriverDate.ToString('dd/MM/yyyy') + ')' }
  $lignesPeriph += (L 'Carte graphique' ('{0} - pilote {1}{2}' -f $g.Name, $g.DriverVersion, $dateG))
  if ($g.Name -match 'Basic Display|de base Microsoft') {
    Ajouter-Constat attention 'Pilotes' 'Pilote graphique générique Microsoft en place.' 'Installer le pilote Intel, AMD ou NVIDIA.'
  }
}
Ajouter-Section 'Périphériques' $lignesPeriph

# ---------------------------------------------------------------- 8. Sécurité
Etape 'Sécurité'
$lignesSec = @()
$avs = @(Get-CimInstance -Namespace root\SecurityCenter2 -ClassName AntiVirusProduct)
$autresAv = @($avs | Where-Object { $_.displayName -notmatch 'Defender' })
if ($avs.Count -gt 0) { $lignesSec += (L 'Antivirus' (($avs | ForEach-Object { $_.displayName }) -join ', ')) }
$mp = Get-MpComputerStatus
if ($mp) {
  $tr = 'Désactivée'
  if ($mp.RealTimeProtectionEnabled) { $tr = 'Activée' }
  $lignesSec += (L 'Defender : protection en temps réel' $tr)
  $lignesSec += (L 'Defender : âge des signatures' ('{0} jour(s)' -f $mp.AntivirusSignatureAge))
}
if ($os.ProductType -eq 1 -and $autresAv.Count -eq 0) {
  if (-not $mp -or -not $mp.RealTimeProtectionEnabled) {
    Ajouter-Constat critique 'Sécurité' 'Aucune protection antivirus active.' 'Réactiver Microsoft Defender (Sécurité Windows) ou installer un antivirus.'
  }
  elseif ($mp.AntivirusSignatureAge -gt 7) {
    Ajouter-Constat attention 'Sécurité' ('Signatures antivirus vieilles de {0} jours.' -f $mp.AntivirusSignatureAge) 'Lancer Windows Update.'
  }
}
$profils = @(Get-NetFirewallProfile)
if ($profils.Count -gt 0) {
  $lignesSec += (L 'Pare-feu' (($profils | ForEach-Object { if ([string]$_.Enabled -in @('True', '1')) { '{0} : activé' -f $_.Name } else { '{0} : désactivé' -f $_.Name } }) -join ', '))
  $off = @($profils | Where-Object { [string]$_.Enabled -notin @('True', '1') })
  if ($off.Count -gt 0) {
    Ajouter-Constat attention 'Sécurité' ('Pare-feu Windows désactivé : {0}.' -f (($off | ForEach-Object { $_.Name }) -join ', ')) 'Réactiver le pare-feu, sauf si un pare-feu tiers le remplace.'
  }
}
if ($estAdmin) {
  $sb = $null
  try { $sb = Confirm-SecureBootUEFI -ErrorAction Stop } catch { $sb = $null }
  if ($sb -eq $true) { $lignesSec += (L 'Démarrage sécurisé' 'Activé') }
  elseif ($sb -eq $false) { $lignesSec += (L 'Démarrage sécurisé' 'Désactivé') }
  else { $lignesSec += (L 'Démarrage sécurisé' 'Non pris en charge (BIOS en mode hérité)') }

  $tpm = Get-CimInstance -Namespace root\cimv2\Security\MicrosoftTpm -ClassName Win32_Tpm
  if ($tpm) {
    $verTpm = ([string]$tpm.SpecVersion -split ',')[0].Trim()
    $lignesSec += (L 'TPM' ('Présent, version {0}' -f $verTpm))
    if ($verTpm -and $verTpm -notlike '2*') {
      Ajouter-Constat info 'Sécurité' ('TPM en version {0} : Windows 11 exige un TPM 2.0.' -f $verTpm) 'Vérifier les réglages TPM du BIOS.'
    }
  }
  else {
    $lignesSec += (L 'TPM' 'Absent ou désactivé dans le BIOS')
  }

  foreach ($vol in @(Get-BitLockerVolume)) {
    $lignesSec += (L ('BitLocker {0}' -f $vol.MountPoint) ('{0} - {1}' -f $vol.ProtectionStatus, $vol.VolumeStatus))
    if ([string]$vol.ProtectionStatus -in @('On', '1')) {
      Ajouter-Constat info 'BitLocker' ('Le volume {0} est chiffré par BitLocker.' -f $vol.MountPoint) 'Avant toute intervention sur le BIOS, la carte mère ou le disque, vérifier que le client a sa clé de récupération (aka.ms/myrecoverykey).'
    }
  }
}
Ajouter-Section 'Sécurité' $lignesSec

# ---------------------------------------------------------------- 9. Windows
Etape 'Windows (activation et mises à jour)'
$lignesWin = @()
$etatsLicence = @{ 0 = 'Sans licence'; 1 = 'Activé'; 2 = 'Période de grâce initiale'; 3 = 'Période de grâce supplémentaire'; 4 = 'Période de grâce (non authentique)'; 5 = 'Non activé (notifications)'; 6 = 'Période de grâce étendue' }
$licence = Get-CimInstance SoftwareLicensingProduct -Filter "ApplicationID='55c92734-d682-4d71-983e-d6ec3f16059f' AND PartialProductKey IS NOT NULL" | Select-Object -First 1
if ($licence) {
  $etat = $etatsLicence[[int]$licence.LicenseStatus]
  $lignesWin += (L 'Activation' $etat)
  if ([int]$licence.LicenseStatus -ne 1) {
    Ajouter-Constat attention 'Windows' ('Windows n''est pas activé ({0}).' -f $etat) 'Paramètres → Système → Activation. Après un changement de carte mère : Résolution des problèmes avec le compte Microsoft lié.'
  }
}
$majs = @(Get-HotFix | Where-Object { $_.InstalledOn } | Sort-Object InstalledOn -Descending)
if ($majs.Count -gt 0) {
  $derniere = $majs[0]
  $jours = [int]((Get-Date) - $derniere.InstalledOn).TotalDays
  $lignesWin += (L 'Dernière mise à jour' ('{0} le {1} (il y a {2} jours)' -f $derniere.HotFixID, $derniere.InstalledOn.ToString('dd/MM/yyyy'), $jours))
  if ($jours -gt 60) {
    Ajouter-Constat attention 'Windows' ('Aucune mise à jour installée depuis {0} jours.' -f $jours) 'Lancer Windows Update ; si les mises à jour échouent, réinitialiser les composants Windows Update.'
  }
}
$redemarrageEnAttente = (Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending') -or (Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired')
if ($redemarrageEnAttente) {
  $lignesWin += (L 'Redémarrage en attente' 'Oui')
  Ajouter-Constat info 'Windows' 'Un redémarrage est en attente pour terminer des mises à jour.' 'Redémarrer le PC.'
}
$demarrage = @(Get-CimInstance Win32_StartupCommand)
$lignesWin += (L 'Programmes au démarrage' $demarrage.Count)
if ($demarrage.Count -gt 15) {
  Ajouter-Constat attention 'Performance' ('{0} programmes se lancent au démarrage.' -f $demarrage.Count) 'Désactiver les programmes inutiles (Gestionnaire des tâches → Démarrage, ou Autoruns).'
}
Ajouter-Section 'Windows' $lignesWin

# ---------------------------------------------------------------- 10. Réseau
Etape 'Réseau'
$lignesNet = @()
$cartes = @(Get-NetIPConfiguration | Where-Object { $_.NetAdapter.Status -eq 'Up' })
foreach ($c in $cartes) {
  $ip = ($c.IPv4Address | ForEach-Object { $_.IPAddress }) -join ', '
  $passerelle = ($c.IPv4DefaultGateway | ForEach-Object { $_.NextHop }) -join ', '
  $dns = ($c.DNSServer | Where-Object { $_.AddressFamily -eq 2 } | ForEach-Object { $_.ServerAddresses }) -join ', '
  $lignesNet += (L $c.InterfaceAlias ('IP {0} - passerelle {1} - DNS {2} - lien {3}' -f $ip, $passerelle, $dns, $c.NetAdapter.LinkSpeed))
  if ($ip -match '169\.254\.') {
    Ajouter-Constat critique 'Réseau' ('{0} : adresse automatique 169.254.x.x (aucun serveur DHCP).' -f $c.InterfaceAlias) 'Vérifier le câble ou le Wi-Fi et la box ; ipconfig /release puis /renew.'
  }
  if ([string]$c.NetAdapter.PhysicalMediaType -eq '802.3' -and $c.NetAdapter.Speed -gt 0 -and $c.NetAdapter.Speed -le 100000000) {
    Ajouter-Constat attention 'Réseau' ('{0} : lien câblé négocié à 100 Mb/s ou moins.' -f $c.InterfaceAlias) 'Remplacer le câble (paire coupée probable) ou changer de port sur le switch.'
  }
}
if ($cartes.Count -eq 0) {
  Ajouter-Constat critique 'Réseau' 'Aucune carte réseau connectée.' 'Vérifier le câble, le Wi-Fi et les pilotes réseau.'
}

function Tester-Ping([string]$Cible) {
  $res = @(Test-Connection -ComputerName $Cible -Count 4 -ErrorAction SilentlyContinue)
  $ok = @($res | Where-Object { ($null -ne $_.StatusCode -and $_.StatusCode -eq 0) -or ([string]$_.Status -eq 'Success') })
  $moy = $null
  if ($ok.Count -gt 0) {
    $vals = @($ok | ForEach-Object { if ($null -ne $_.ResponseTime) { $_.ResponseTime } else { $_.Latency } })
    $moy = [math]::Round(($vals | Measure-Object -Average).Average)
  }
  [pscustomobject]@{ Recus = $ok.Count; Moyenne = $moy }
}
$gw = @($cartes | ForEach-Object { $_.IPv4DefaultGateway.NextHop } | Where-Object { $_ }) | Select-Object -First 1
if ($gw) {
  $pBox = Tester-Ping $gw
  $pNet = Tester-Ping '8.8.8.8'
  $dnsOk = $false
  try { $dnsOk = [bool](Resolve-DnsName 'www.microsoft.com' -DnsOnly -QuickTimeout -ErrorAction Stop) } catch { $dnsOk = $false }
  $lignesNet += (L ('Ping box ({0})' -f $gw) ('{0}/4 réponses, {1} ms' -f $pBox.Recus, $pBox.Moyenne))
  $lignesNet += (L 'Ping internet (8.8.8.8)' ('{0}/4 réponses, {1} ms' -f $pNet.Recus, $pNet.Moyenne))
  if ($dnsOk) { $lignesNet += (L 'Résolution DNS' 'OK') } else { $lignesNet += (L 'Résolution DNS' 'Échec') }

  if ($pBox.Recus -eq 0) {
    Ajouter-Constat critique 'Réseau' 'La box ou le routeur ne répond pas.' 'Vérifier la connexion locale (câble, Wi-Fi) et redémarrer la box.'
  }
  elseif ($pNet.Recus -eq 0) {
    Ajouter-Constat critique 'Réseau' 'La box répond mais internet est inaccessible.' 'Vérifier les voyants de la box (synchronisation), redémarrer la box, contacter l''opérateur.'
  }
  else {
    if (-not $dnsOk) {
      Ajouter-Constat critique 'Réseau' 'Internet répond mais la résolution DNS échoue.' 'Changer de DNS (1.1.1.1 ou 8.8.8.8) puis ipconfig /flushdns.'
    }
    if ($pNet.Recus -lt 4 -or $pBox.Recus -lt 4) {
      Ajouter-Constat attention 'Réseau' 'Perte de paquets détectée.' 'Wi-Fi faible ou câble défectueux : tester en câble, changer de canal Wi-Fi.'
    }
    if ($pNet.Moyenne -gt 100) {
      Ajouter-Constat attention 'Réseau' ('Latence internet élevée ({0} ms).' -f $pNet.Moyenne) 'Tester en câble, vérifier la charge du réseau et la connexion de la box.'
    }
  }
}
Ajouter-Section 'Réseau' $lignesNet

# ---------------------------------------------------------------- 11. Intégrité (option -Complet)
if ($Complet) {
  Etape 'Intégrité de Windows (plusieurs minutes)'
  if ($estAdmin) {
    $lignesInt = @()
    $img = Repair-WindowsImage -Online -CheckHealth
    if ($img) {
      $lignesInt += (L 'Image Windows (DISM)' $img.ImageHealthState)
      if ([string]$img.ImageHealthState -ne 'Healthy') {
        Ajouter-Constat critique 'Windows' ('Image Windows endommagée ({0}).' -f $img.ImageHealthState) 'DISM /Online /Cleanup-Image /RestoreHealth puis sfc /scannow.'
      }
    }
    $sortieSfc = ((& sfc.exe /verifyonly) -join ' ') -replace "`0", ''
    if ($sortieSfc -match 'aucune violation|did not find any integrity') {
      $lignesInt += (L 'Fichiers système (SFC)' 'Aucune violation d''intégrité')
    }
    elseif ($sortieSfc -match 'violation|corrupt|endommag') {
      $lignesInt += (L 'Fichiers système (SFC)' 'Fichiers endommagés détectés')
      Ajouter-Constat critique 'Windows' 'Des fichiers système sont endommagés.' 'Lancer sfc /scannow (après DISM RestoreHealth).'
    }
    else {
      $lignesInt += (L 'Fichiers système (SFC)' 'Résultat non interprété : relancer sfc /scannow manuellement')
    }
    Ajouter-Section 'Intégrité de Windows' $lignesInt
  }
  else {
    Write-Host '    Ignoré : droits administrateur nécessaires.' -ForegroundColor Yellow
  }
}

# ---------------------------------------------------------------- Synthèse
$nbCrit = @($constats | Where-Object { $_.Niveau -eq 'critique' }).Count
$nbAtt = @($constats | Where-Object { $_.Niveau -eq 'attention' }).Count
$score = [math]::Max(0, 100 - 15 * $nbCrit - 5 * $nbAtt)
if ($nbCrit -gt 0) { $verdict = 'Intervention nécessaire'; $classeVerdict = 'critique' }
elseif ($nbAtt -gt 0) { $verdict = 'À surveiller'; $classeVerdict = 'attention' }
else { $verdict = 'Bon état général'; $classeVerdict = 'ok' }
$duree = [int]((Get-Date) - $debut).TotalSeconds
$horodatage = Get-Date -Format 'yyyy-MM-dd_HHmm'
$dateLisible = Get-Date -Format 'dd/MM/yyyy HH:mm'

# ---------------------------------------------------------------- Rapport HTML
$ordre = @{ critique = 0; attention = 1; info = 2; ok = 3 }
$libelles = @{ critique = 'Critique'; attention = 'Attention'; info = 'Info'; ok = 'OK' }
$constatsTries = @($constats | Sort-Object { $ordre[$_.Niveau] })
if ($constatsTries.Count -gt 0) {
  $htmlConstats = ($constatsTries | ForEach-Object {
      $conseil = ''
      if ($_.Conseil) { $conseil = '<div class="conseil">' + (Enc $_.Conseil) + '</div>' }
      '<tr class="{0}"><td><span class="badge">{1}</span></td><td>{2}</td><td>{3}{4}</td></tr>' -f $_.Niveau, $libelles[$_.Niveau], (Enc $_.Domaine), (Enc $_.Message), $conseil
    }) -join "`n"
}
else {
  $htmlConstats = '<tr class="ok"><td><span class="badge">OK</span></td><td>Global</td><td>Aucun problème détecté.</td></tr>'
}
$htmlSections = ($sections | ForEach-Object {
    $lignes = ($_.Lignes | ForEach-Object { '<tr><th>{0}</th><td>{1}</td></tr>' -f (Enc $_.K), (Enc $_.V) }) -join ''
    '<section><h2>{0}</h2><table>{1}</table></section>' -f (Enc $_.Titre), $lignes
  }) -join "`n"
$noteAdmin = ''
if (-not $estAdmin) { $noteAdmin = '<p class="note">Analyse lancée sans droits administrateur : SMART, températures, TPM et BitLocker non vérifiés. Relancer avec Lancer-DiagLab.bat pour un rapport complet.</p>' }

$html = @"
<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rapport DiagLab - $(Enc $env:COMPUTERNAME)</title>
<style>
:root{--fg:#15202b;--muted:#5a6b7b;--line:#d3dae1;--bg:#f3f5f7;--panel:#fff;--accent:#0a7c86;--crit:#c0392b;--crit-bg:#fbe6e3;--warn:#b26a00;--warn-bg:#fdf0dc;--ok:#1f8a4c;--ok-bg:#e3f4ea;--info:#2d6cb5;--info-bg:#e4eefa}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 "Segoe UI",system-ui,sans-serif}
.wrap{max-width:1000px;margin:0 auto;padding:24px 16px 48px}
header{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-end;border-bottom:2px solid var(--fg);padding-bottom:12px;margin-bottom:18px}
h1{font-size:24px;margin:0}h2{font-size:16px;margin:0 0 8px}
.meta{color:var(--muted);font-size:13px}
.score{display:flex;gap:16px;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 20px;margin-bottom:18px;flex-wrap:wrap}
.score b{font-size:40px;line-height:1;font-variant-numeric:tabular-nums}
.score .v{font-size:18px;font-weight:600}
.score.critique b,.score.critique .v{color:var(--crit)}.score.attention b,.score.attention .v{color:var(--warn)}.score.ok b,.score.ok .v{color:var(--ok)}
.counts{color:var(--muted)}
table{width:100%;border-collapse:collapse;background:var(--panel)}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
section table th{width:34%;color:var(--muted);font-weight:500}
.constats{border:1px solid var(--line);border-radius:12px;overflow:hidden;margin-bottom:22px}
.badge{display:inline-block;font-size:12px;font-weight:600;padding:2px 8px;border-radius:99px;white-space:nowrap}
tr.critique .badge{background:var(--crit-bg);color:var(--crit)}tr.attention .badge{background:var(--warn-bg);color:var(--warn)}
tr.info .badge{background:var(--info-bg);color:var(--info)}tr.ok .badge{background:var(--ok-bg);color:var(--ok)}
.conseil{color:var(--muted);font-size:13px;margin-top:2px}
section{margin-bottom:18px;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel)}
section h2{padding:10px 10px 0}
.note{background:var(--warn-bg);border:1px solid var(--warn);border-radius:8px;padding:10px 12px}
footer{color:var(--muted);font-size:12px;margin-top:24px}
@media print{body{background:#fff}.score,section,.constats{break-inside:avoid}}
</style></head><body><div class="wrap">
<header><div><h1>Rapport de diagnostic</h1><div class="meta">$(Enc ('{0} {1}' -f $cs.Manufacturer, $cs.Model)) · N° de série $(Enc $bios.SerialNumber)</div></div>
<div class="meta">$(Enc $env:COMPUTERNAME)<br>$dateLisible</div></header>
<div class="score $classeVerdict"><b>$score</b><div><div class="v">$verdict</div><div class="counts">Note sur 100 · $nbCrit critique(s) · $nbAtt point(s) d'attention</div></div></div>
$noteAdmin
<div class="constats"><table><thead><tr><th style="width:110px">Niveau</th><th style="width:120px">Domaine</th><th>Constat et conseil</th></tr></thead><tbody>
$htmlConstats
</tbody></table></div>
$htmlSections
<footer>Généré par DiagLab Pro (script $versionScript) en $duree s. Analyse en lecture seule : aucune modification n'a été faite sur ce PC.</footer>
</div></body></html>
"@

# ---------------------------------------------------------------- Enregistrement
if (-not (Test-Path $Dossier)) { New-Item -ItemType Directory -Path $Dossier -Force | Out-Null }
$base = 'DiagLab_{0}_{1}' -f $env:COMPUTERNAME, $horodatage
$cheminHtml = Join-Path $Dossier ($base + '.html')
$cheminJson = Join-Path $Dossier ($base + '.json')
$utf8 = New-Object System.Text.UTF8Encoding $true
[System.IO.File]::WriteAllText($cheminHtml, $html, $utf8)

$donnees = [ordered]@{
  Application = 'DiagLab Pro'
  VersionScript = $versionScript
  Date = $dateLisible
  Ordinateur = $env:COMPUTERNAME
  Fabricant = [string]$cs.Manufacturer
  Modele = [string]$cs.Model
  NumeroSerie = [string]$bios.SerialNumber
  Systeme = ('{0} {1}' -f $os.Caption, $versionWin)
  Portable = $estPortable
  Admin = $estAdmin
  Score = $score
  Verdict = $verdict
  Constats = @($constatsTries | ForEach-Object { [ordered]@{ Niveau = $_.Niveau; Domaine = $_.Domaine; Message = $_.Message; Conseil = $_.Conseil } })
  Sections = @($sections | ForEach-Object { [ordered]@{ Titre = $_.Titre; Lignes = @($_.Lignes | ForEach-Object { [ordered]@{ Libelle = $_.K; Valeur = $_.V } }) } })
}
[System.IO.File]::WriteAllText($cheminJson, ($donnees | ConvertTo-Json -Depth 6), (New-Object System.Text.UTF8Encoding $false))

Write-Host ''
$couleur = 'Green'
if ($nbCrit -gt 0) { $couleur = 'Red' } elseif ($nbAtt -gt 0) { $couleur = 'Yellow' }
Write-Host ('  Note : {0}/100 - {1}' -f $score, $verdict) -ForegroundColor $couleur
foreach ($c in ($constatsTries | Where-Object { $_.Niveau -eq 'critique' -or $_.Niveau -eq 'attention' })) {
  Write-Host ('    [{0}] {1}' -f $libelles[$c.Niveau], $c.Message)
}
Write-Host ''
Write-Host ('  Rapport : {0}' -f $cheminHtml) -ForegroundColor White
Write-Host ('  Données à importer dans DiagLab Pro : {0}' -f $cheminJson) -ForegroundColor Gray
Write-Host ''
if (-not $NePasOuvrir) { Start-Process $cheminHtml }
