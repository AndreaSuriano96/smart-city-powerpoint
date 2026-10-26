$ErrorActionPreference = 'Stop'
$key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Software\Microsoft\Office\16.0\WEF\Developer',$true)
if ($null -ne $key) { try { $key.DeleteValue('9dd47b1d-7c2f-4cb0-bcb8-8bb9e7f6772a',$false) } finally { $key.Close() } }
Write-Output 'Registrazione di Smart City 3D rimossa. Gli altri componenti e i file sono invariati.'
