import sys
import os
import asyncio
from collections import Counter

sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database import db

async def check_content_dupes():
    print("Checking for duplicate content...")
    content = await db.site_content.find({}, {"_id": 0}).to_list(1000)
    
    keys = [f"{c.get('page')}_{c.get('section')}" for c in content]
    counts = Counter(keys)
    
    duplicates = {k: v for k, v in counts.items() if v > 1}
    
    if duplicates:
        print(f"Found duplicates: {duplicates}")
        for k in duplicates:
            print(f"--- {k} ---")
            page, section = k.split('_', 1)
            # Find docs
            docs = [c for c in content if c.get('page') == page and c.get('section') == section]
            for d in docs:
                print(f"ID: {d.get('content_id')} | Img: {d.get('content', {}).get('image')}")
                
            # Deduplicate logic?
            # We should probably keep the one with the non-default image, or just the most recent?
    else:
        print("No duplicates found.")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(check_content_dupes())
