import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "resume_ats_db"

client = None
db = None

async def connect_to_mongo():
    global client, db
    try:
        if MONGO_URI and "test:test" not in MONGO_URI:
            client = AsyncIOMotorClient(MONGO_URI)
            db = client[DB_NAME]
            print("Connected to MongoDB Atlas")
    except Exception as e:
        print(f"MongoDB connection notice: {e}")

async def close_mongo_connection():
    global client
    if client:
        client.close()

def get_database():
    return db
