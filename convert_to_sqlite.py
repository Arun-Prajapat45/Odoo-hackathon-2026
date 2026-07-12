import re

def convert():
    with open('transitops_schema.sql', 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove SET commands
    content = re.sub(r'SET FOREIGN_KEY_CHECKS = [01];', '', content)
    content = re.sub(r'SET NAMES utf8mb4;', '', content)
    
    # Engine
    content = re.sub(r'\) ENGINE=InnoDB;', ');', content)
    
    # Auto increment
    content = re.sub(r'INT AUTO_INCREMENT PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT', content)
    
    # Enums
    content = re.sub(r'ENUM\([^)]+\)', 'TEXT', content)
    
    # JSON -> TEXT
    content = re.sub(r'\bJSON\b', 'TEXT', content)
    
    # DECIMAL -> REAL
    content = re.sub(r'DECIMAL\(\d+,\d+\)', 'REAL', content)
    
    # YEAR -> INTEGER
    content = re.sub(r'\bYEAR\b', 'INTEGER', content)
    
    # GENERATED ALWAYS AS ... STORED is not fully supported in old SQLite, but 3.45.3 supports GENERATED ALWAYS AS (expr) STORED.
    # Let's keep it. 
    
    with open('sqlite_schema.sql', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    convert()
