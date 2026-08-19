Add-Type -AssemblyName System.Drawing

function Create-AppIcon {
    param(
        [int]$Dimension,
        [string]$FilePath
    )
    $bmp = New-Object System.Drawing.Bitmap($Dimension, $Dimension)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    # Background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(21, 128, 61))
    $g.FillRectangle($bgBrush, 0, 0, $Dimension, $Dimension)

    # Sun
    $sunBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 240, 138))
    $g.FillEllipse($sunBrush, [int]($Dimension * 0.65), [int]($Dimension * 0.15), [int]($Dimension * 0.22), [int]($Dimension * 0.22))

    # Mountain
    $mountBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(2, 44, 34))
    $p1 = New-Object System.Drawing.Point([int]($Dimension * 0.05), [int]($Dimension * 0.85))
    $p2 = New-Object System.Drawing.Point([int]($Dimension * 0.5), [int]($Dimension * 0.2))
    $p3 = New-Object System.Drawing.Point([int]($Dimension * 0.95), [int]($Dimension * 0.85))
    $pts = [System.Drawing.Point[]]@($p1, $p2, $p3)
    $g.FillPolygon($mountBrush, $pts)

    # Snow cap
    $snowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $sp1 = New-Object System.Drawing.Point([int]($Dimension * 0.5), [int]($Dimension * 0.2))
    $sp2 = New-Object System.Drawing.Point([int]($Dimension * 0.62), [int]($Dimension * 0.38))
    $sp3 = New-Object System.Drawing.Point([int]($Dimension * 0.38), [int]($Dimension * 0.38))
    $snowPts = [System.Drawing.Point[]]@($sp1, $sp2, $sp3)
    $g.FillPolygon($snowBrush, $snowPts)

    $bmp.Save($FilePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

$dir = "C:\Users\SAURAV SINGH NEGI\.gemini\antigravity\scratch\uk-exam-prep\icons"
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }

Create-AppIcon -Dimension 192 -FilePath "$dir\icon-192.png"
Create-AppIcon -Dimension 512 -FilePath "$dir\icon-512.png"
Write-Host "Created icons successfully in $dir"
