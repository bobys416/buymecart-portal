import sqlite3
import os

def check(path):
    print("=" * 40)
    print("CHECKING:", path, "EXISTS:", os.path.exists(path))
    if not os.path.exists(path):
        return
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cur.fetchall()]
    print("TABLES:", len(tables), tables)
    if 'users' in tables:
        cur.execute("SELECT id, login_id, role, status FROM users;")
        users = cur.fetchall()
        print(f"USERS ({len(users)}):")
        for u in users:
            print("  ", u)
    conn.close()

if __name__ == "__main__":
    check("buymecart_dev.db")
    check("backend/buymecart_dev.db")
