
const fs = require('fs');

const filePath = 'c:/S/Spensmer/frontend/src/pages/public/Home.js';
const content = fs.readFileSync(filePath, 'utf8');
let lines = content.split(/\r?\n/);

console.log(`Total lines: ${lines.length}`);

// Lines to delete: 708 to 849 (1-based) => indices 707 to 848
// Line 708 should be "</motion.div>"
// Line 849 should be "</motion.div>"

let startIdx = 707;
let endIdx = 849;

// Verification
const line708 = lines[startIdx] ? lines[startIdx].trim() : '';
const line849 = lines[endIdx - 1] ? lines[endIdx - 1].trim() : '';

console.log(`L708: ${line708}`);
console.log(`L849: ${line849}`);

let newLines = [];

if (line708 === '</motion.div>' && line849 === '</motion.div>') {
    console.log("Found exact block to delete.");
    newLines = lines.slice(0, startIdx).concat(lines.slice(endIdx));
} else {
    console.log("WARNING: Indices mismatch. Attempting dynamic find.");
    // Heuristic:
    // Find first </Dialog> around 707
    // Find </section > around 850
    let dialogIdx = -1;
    let sectionIdx = -1;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('</Dialog>')) dialogIdx = i;
        if (lines[i].includes('</section >')) sectionIdx = i;
    }

    if (dialogIdx !== -1 && sectionIdx !== -1 && sectionIdx > dialogIdx) {
        startIdx = dialogIdx + 1; // Start deleting AFTER </Dialog>
        endIdx = sectionIdx; // Stop deleting BEFORE </section > (so keeping 850)
        console.log(`Dynamic range: Deleting indices ${startIdx} to ${endIdx - 1}`);
        newLines = lines.slice(0, startIdx).concat(lines.slice(endIdx));
    } else {
        console.log("Dynamic find failed. Aborting delete.");
        newLines = lines;
    }
}

// Replacements
const finalLines = newLines.map(line => {
    // 1. Fix </section >
    if (line.includes('</section >')) {
        return line.replace('</section >', '      </section>');
    }
    // 2. Update Special Offers link
    if (line.includes('onClick={scrollToBooking}')) {
        return line.replace('onClick={scrollToBooking}', 'onClick={() => setShowSearchModal(true)}');
    }
    // 3. Update Promo Banner button
    if (line.includes('className="bg-white text-emerald-800 hover:bg-emerald-100"') && !line.includes('onClick')) {
        return line.replace('className="bg-white text-emerald-800 hover:bg-emerald-100"',
            'onClick={() => setShowSearchModal(true)} className="bg-white text-emerald-800 hover:bg-emerald-100"');
    }
    return line;
});

fs.writeFileSync(filePath, finalLines.join('\n'), 'utf8');
console.log("Home.js updated.");
