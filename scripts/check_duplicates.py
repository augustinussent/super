import sys
import os
import asyncio
from collections import Counter

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database import db

async def check_duplicates():
    print("Checking for duplicate rooms...")
    rooms = await db.room_types.find({}, {"_id": 0, "room_type_id": 1, "name": 1}).to_list(1000)
    
    room_names = [room["name"] for room in rooms]
    counts = Counter(room_names)
    
    duplicates = {name: count for name, count in counts.items() if count > 1}
    
    if duplicates:
        print(f"Found duplicates: {duplicates}")
        for name in duplicates:
            print(f"--- {name} ---")
            dup_rooms = [r for r in rooms if r["name"] == name]
            for r in dup_rooms:
                print(f"ID: {r['room_type_id']}")
    else:
        print("No duplicates found.")

    # Also list all rooms for verification
    print("\nAll Rooms:")
    for room in rooms:
        print(f"{room['name']} ({room['room_type_id']})")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(check_duplicates())
