"""Script to remove all portal users except admin and demo."""
import httpx
import os
import time
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BASE_URL = f"{SUPABASE_URL}/rest/v1"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

KEEP_EMAILS = ["admin", "demo"]

def make_request(method, url, params, retries=3):
    """Make request with retry logic."""
    for attempt in range(retries):
        try:
            with httpx.Client(timeout=60.0) as client:
                if method == "GET":
                    response = client.get(url, headers=HEADERS, params=params)
                elif method == "DELETE":
                    response = client.delete(url, headers=HEADERS, params=params)
                return response
        except Exception as e:
            if attempt < retries - 1:
                print(f"    Retry {attempt + 1}/{retries} after error: {type(e).__name__}")
                time.sleep(2)
            else:
                raise
    return None

def get_all_customers():
    """Get all customers."""
    response = make_request("GET", f"{BASE_URL}/customers",
                           {"select": "id,email,first_name,last_name,role"})
    response.raise_for_status()
    return response.json()

def delete_broker_accounts(customer_id: int):
    """Delete broker accounts for a customer."""
    try:
        response = make_request("DELETE", f"{BASE_URL}/broker_accounts",
                               {"customer_id": f"eq.{customer_id}"})
        return response and response.status_code < 400
    except Exception:
        return True

def delete_customer(customer_id: int):
    """Delete a customer."""
    response = make_request("DELETE", f"{BASE_URL}/customers",
                           {"id": f"eq.{customer_id}"})
    return response and response.status_code < 400

def main():
    print("=" * 60)
    print("PORTAL USER CLEANUP")
    print("=" * 60)

    customers = get_all_customers()
    print(f"\nFound {len(customers)} total customers")

    kept = []
    removed = []

    for c in customers:
        email = c.get("email", "").lower()
        is_protected = any(keep in email for keep in KEEP_EMAILS)

        if is_protected:
            kept.append(c)
            print(f"  KEEP: {c['email']} (id={c['id']})")
        else:
            delete_broker_accounts(c["id"])
            time.sleep(0.3)
            if delete_customer(c["id"]):
                removed.append(c)
                print(f"  REMOVED: {c['email']} (id={c['id']})")
            else:
                print(f"  FAILED: {c['email']} (id={c['id']})")
            time.sleep(0.3)

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"\nKEPT ({len(kept)}):")
    for c in kept:
        print(f"  - {c['email']} (id={c['id']}, role={c.get('role', 'N/A')})")

    print(f"\nREMOVED ({len(removed)}):")
    for c in removed:
        print(f"  - {c['email']} (id={c['id']})")

    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
