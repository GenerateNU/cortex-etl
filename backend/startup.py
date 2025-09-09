import os
import subprocess
import time

import psycopg2
from psycopg2 import OperationalError


def wait_for_db():
    while True:
        try:
            conn = psycopg2.connect(os.environ["DATABASE_URL"])
            conn.close()
            print("Database is ready")
            break
        except OperationalError:
            print("Waiting for database...")
            time.sleep(1)


def run_migrations():
    print("Running migrations...")
    subprocess.run(["alembic", "upgrade", "head"], check=True)


def seed_if_dev():
    if os.environ.get("ENVIRONMENT") == "development":
        print("Seeding database...")
        subprocess.run(["python", "seed_data.py"], check=True)


def start_server():
    print("Starting server...")
    subprocess.run(
        ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    )


if __name__ == "__main__":
    wait_for_db()
    run_migrations()
    seed_if_dev()
    start_server()
