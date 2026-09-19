# render_all_tabs.py
import subprocess

ps = '''
Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase
$reader = [System.Xml.XmlReader]::Create("C:\\temp\\extracted.xaml")
$w = [System.Windows.Markup.XamlReader]::Load($reader)

function Find-TabControl($parent) {
    if ($parent -is [System.Windows.Controls.TabControl]) { return $parent }
    if ($parent.Content) {
        $found = Find-TabControl $parent.Content
        if ($found) { return $found }
    }
    if ($parent.Children) {
        foreach ($c in $parent.Children) {
            $found = Find-TabControl $c
            if ($found) { return $found }
        }
    }
    return $null
}

$tc = Find-TabControl $w
Write-Host "Found TabControl with $($tc.Items.Count) items"

$w.Show()
for ($i = 0; $i -lt $tc.Items.Count; $i++) {
    $tc.SelectedIndex = $i
    $w.UpdateLayout()
    $rtb = [System.Windows.Media.Imaging.RenderTargetBitmap]::new([int]$w.ActualWidth, [int]$w.ActualHeight, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
    $rtb.Render($w)
    $enc = [System.Windows.Media.Imaging.PngBitmapEncoder]::new()
    $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
    $fs = [System.IO.FileStream]::new("C:\\temp\\tab_$i.png", [System.IO.FileMode]::Create)
    $enc.Save($fs)
    $fs.Close()
}
$w.Close()
Write-Host "TABS_RENDERED_SUCCESS"
'''

with open('C:\\temp\\render_tabs.ps1', 'w', encoding='utf-8') as f:
    f.write(ps)

res = subprocess.run(['powershell.exe', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-STA', '-File', 'C:\\temp\\render_tabs.ps1'], capture_output=True, text=True)
print(res.stdout)
print(res.stderr)
