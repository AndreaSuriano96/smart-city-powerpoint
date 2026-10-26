$ErrorActionPreference = 'Stop'
$catalog = '\\NOTEBOOK-AS\SmartCityAddins'
$manifestPath = Join-Path $PSScriptRoot 'docs\manifest.xml'
if (-not (Test-Path -LiteralPath $manifestPath)) { throw 'Manifest non trovato.' }
Write-Output 'Questo script non cambia le impostazioni di sicurezza di Office.'
Write-Output "1. Condividi la cartella '$PSScriptRoot\docs' con il nome SmartCityAddins; il percorso deve essere $catalog."
Write-Output '2. In PowerPoint: File > Opzioni > Centro protezione > Impostazioni Centro protezione > Cataloghi di componenti aggiuntivi attendibili; aggiungi il percorso e abilita Mostra nel menu.'
Write-Output '3. Chiudi e riapri PowerPoint. Poi apri la presentazione più recente. Serve Internet per caricare la simulazione da GitHub Pages.'
