
$path = "c:\S\Spensmer\frontend\src\pages\public\Home.js"
$lines = Get-Content $path

# Verification
$line708 = $lines[707].Trim()
$line849 = $lines[848].Trim()

Write-Host "L708: $line708"
Write-Host "L849: $line849"

if ($line708 -ne "</motion.div>" -or $line849 -ne "</motion.div>") {
    Write-Error "Mismatch in line verification. Aborting."
    exit 1
}

$part1 = $lines[0..706]
$part2 = $lines[849..($lines.Count-1)]
$newLines = $part1 + $part2

for ($i=0; $i -lt $newLines.Count; $i++) {
    if ($newLines[$i] -match "</section >") {
        $newLines[$i] = $newLines[$i] -replace "</section >", "      </section>"
    }
    if ($newLines[$i] -match "onClick=\{scrollToBooking\}") {
        $newLines[$i] = $newLines[$i].Replace("onClick={scrollToBooking}", "onClick={() => setShowSearchModal(true)}")
    }
    if ($newLines[$i].Contains('className="bg-white text-emerald-800 hover:bg-emerald-100"') -and -not $newLines[$i].Contains('onClick')) {
         $newLines[$i] = $newLines[$i].Replace('className="bg-white text-emerald-800 hover:bg-emerald-100"', 'onClick={() => setShowSearchModal(true)} className="bg-white text-emerald-800 hover:bg-emerald-100"')
    }
}

$newLines | Set-Content $path -Encoding UTF8
Write-Host "Home.js updated successfully."
