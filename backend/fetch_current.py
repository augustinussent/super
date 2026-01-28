import asyncio
from database import db
from pprint import pprint

async def main():
    print("--- HERO ---")
    hero = await db.site_content.find_one({"section": "hero", "page": "home"})
    if hero:
        pprint(hero)
    else:
        print("Hero content not found")

    print("\n--- PROMO ---")
    promo = await db.site_content.find_one({"section": "promo_banner", "page": "home"})
    if promo:
        pprint(promo)
    else:
        print("Promo content not found")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
