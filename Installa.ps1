$ErrorActionPreference = 'Stop'
$manifestPath = Join-Path $PSScriptRoot 'docs\manifest.xml'
[xml]$manifest = Get-Content -LiteralPath $manifestPath -Raw
$ns = New-Object System.Xml.XmlNamespaceManager($manifest.NameTable)
$ns.AddNamespace('o','http://schemas.microsoft.com/office/appforoffice/1.1')
$addinId = $manifest.SelectSingleNode('/o:OfficeApp/o:Id',$ns).InnerText
$sourceUrl = $manifest.SelectSingleNode('/o:OfficeApp/o:DefaultSettings/o:SourceLocation',$ns).GetAttribute('DefaultValue')
if ($addinId -ne '9dd47b1d-7c2f-4cb0-bcb8-8bb9e7f6772a' -or $sourceUrl -ne 'https://andreasuriano96.github.io/smart-city-powerpoint/index.html') { throw 'Manifest non riconosciuto: installazione annullata.' }
$key = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('Software\Microsoft\Office\16.0\WEF\Developer')
try { $key.SetValue($addinId,[IO.Path]::GetFullPath($manifestPath),[Microsoft.Win32.RegistryValueKind]::String) } finally { $key.Close() }
Write-Output 'Smart City 3D registrato per questo utente. Apri la presentazione V1.4 con PowerPoint. Serve Internet.'
