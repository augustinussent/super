import asyncio
from prisma_client import db

async def main():
    try:
        print("Connecting to database...")
        await db.connect()
        print("✅ Connected successfully!")

        # Create a test user
        print("Creating test user...")
        user = await db.user.create(
            data={
                "email": "test_connection@spencergreen.com",
                "password": "hashed_password_example",
                "fullName": "Test Connection User",
                "role": "USER"
            }
        )
        print(f"✅ User created: {user.email} (ID: {user.id})")

        # Clean up
        print("Deleting test user...")
        await db.user.delete(where={"id": user.id})
        print("✅ Test user deleted.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await db.disconnect()
        print("Disconnected.")

if __name__ == "__main__":
    asyncio.run(main())
