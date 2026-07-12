import requests
import sys
import os

def push_sql(filename):
    url = os.environ.get("ENDPOINT_URL")
    if not url:
        print("Error: ENDPOINT_URL environment variable is not set.")
        sys.exit(1)
    
    print(f"Reading {filename}...")
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    # Filter out pure comments and empty lines, but keep the statements
    clean_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith('--'):
            continue
        clean_lines.append(line)
        
    content = "".join(clean_lines)
    
    # Very naive split by semicolon. 
    # Warning: this will break if a string value contains a semicolon!
    statements = content.split(';')
    
    success_count = 0
    for stmt in statements:
        stmt = stmt.strip()
        if not stmt or stmt.upper().startswith('SET '):
            continue
            
        print(f"\nExecuting: {stmt[:60]}...")
        data = {"query": stmt}
        try:
            response = requests.post(url, json=data)
            
            # Check if request succeeded HTTP-wise
            if response.status_code == 200:
                print(f"Success! Response: {response.text}")
                success_count += 1
            else:
                print(f"HTTP Error {response.status_code}: {response.text}")
                print("Stopping execution.")
                break
        except Exception as e:
            print(f"Request failed: {e}")
            break
            
    print(f"\nFinished. Successfully executed {success_count} statements.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python push_sql_via_endpoint.py <file.sql>")
        sys.exit(1)
    push_sql(sys.argv[1])
    