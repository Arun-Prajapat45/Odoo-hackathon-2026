import glob
import re

files = glob.glob('src/app/api/**/*.js', recursive=True)

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if 'getDb' in content or 'db.prepare' in content:
        # Replace import
        content = re.sub(r"import \{.*?getDb.*?\} from.*?@/lib/db.*?;", "import { queryDb } from '@/lib/db';", content)
        
        # Remove const db = getDb();
        content = re.sub(r'const db = getDb\(\);\s*', '', content)
        
        # Replace db.prepare(`...`).all(a, b) -> await queryDb(`...`, [a, b])
        content = re.sub(r'db\.prepare\((.*?)\)\.all\((.*?)\)', r'await queryDb(\1, [\2])', content, flags=re.DOTALL)
        content = re.sub(r'db\.prepare\((.*?)\)\.all\(\)', r'await queryDb(\1)', content, flags=re.DOTALL)
        
        # Replace db.prepare(`...`).get(a, b) -> (await queryDb(`...`, [a, b]))[0]
        content = re.sub(r'db\.prepare\((.*?)\)\.get\((.*?)\)', r'(await queryDb(\1, [\2]))?.[0]', content, flags=re.DOTALL)
        content = re.sub(r'db\.prepare\((.*?)\)\.get\(\)', r'(await queryDb(\1))?.[0]', content, flags=re.DOTALL)
        
        # Replace db.prepare(`...`).run(a, b) -> await queryDb(`...`, [a, b])
        content = re.sub(r'db\.prepare\((.*?)\)\.run\((.*?)\)', r'await queryDb(\1, [\2])', content, flags=re.DOTALL)
        content = re.sub(r'db\.prepare\((.*?)\)\.run\(\)', r'await queryDb(\1)', content, flags=re.DOTALL)
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f'Updated {f}')
