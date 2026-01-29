
import os

file_path = r"c:\S\Spensmer\frontend\src\pages\public\Home.js"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Lines to delete: 708 to 849 (1-based) => indices 707 to 848
# However, let's verify content to be safe.
# Line 708 should be "</motion.div>"
# Line 849 should be "</motion.div>"

start_idx = 707
end_idx = 849

if lines[start_idx].strip() == "</motion.div>" and lines[end_idx-1].strip() == "</motion.div>":
    print("Found exact block to delete.")
    # Keep lines before start_idx and after end_idx
    new_lines = lines[:start_idx] + lines[end_idx:]
else:
    print("WARNING: Line indices do not match expectations. Dumping context:")
    print(f"L{start_idx+1}: {lines[start_idx]}")
    print(f"L{end_idx}: {lines[end_idx-1]}")
    # Fallback: Search for the specific unique markers
    # Marker 1: </Dialog> (Line 707) -> We want to delete what follows until Available Rooms or </section>
    # Marker 2: </section > (Line 850)
    
    # Let's try to find the lines dynamically if indices are off
    try:
        dialog_close_idx = -1
        section_close_idx = -1
        
        for i, line in enumerate(lines):
            if "</Dialog>" in line:
                dialog_close_idx = i
            if "</section >" in line or (i > 700 and "</section>" in line and "offers-section" in lines[i+3]): 
                 # heuristic for line 850
                 if "</section >" in line:
                     section_close_idx = i
                     break
        
        if dialog_close_idx != -1 and section_close_idx != -1:
             start_idx = dialog_close_idx + 1
             end_idx = section_close_idx
             print(f"Dynamic adjusting: Deleting {start_idx+1} to {end_idx}")
             new_lines = lines[:start_idx] + lines[end_idx:]
        else:
             print("Could not locate block dynamically. Aborting deletion.")
             new_lines = lines
    except Exception as e:
        print(f"Error: {e}")
        new_lines = lines

# Perform Replacements in new_lines
final_lines = []
for line in new_lines:
    # 1. Fix </section > to </section>
    if "</section >" in line:
        line = line.replace("</section >", "      </section>")
        
    # 2. Update Special Offers link
    if "onClick={scrollToBooking}" in line:
        line = line.replace("onClick={scrollToBooking}", "onClick={() => setShowSearchModal(true)}")
        
    # 3. Update Promo Banner button
    if 'className="bg-white text-emerald-800 hover:bg-emerald-100"' in line and "onClick" not in line:
        line = line.replace('className="bg-white text-emerald-800 hover:bg-emerald-100"', 
                            'onClick={() => setShowSearchModal(true)} className="bg-white text-emerald-800 hover:bg-emerald-100"')
    
    final_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print("Home.js updated successfully.")
