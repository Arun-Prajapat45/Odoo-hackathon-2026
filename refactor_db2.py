import glob
import re

files = glob.glob('src/app/api/**/*.js', recursive=True)

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if 'getDb' in content or 'db.prepare' in content:
        content = content.replace("import { getDb } from '@/lib/db';", "import { queryDb } from '@/lib/db';")
        content = re.sub(r'const db = getDb\(\);\s*', '', content)
        
        # db.prepare(...).all(args)
        content = re.sub(r'db\.prepare\((`[^`]+`|\'[^\']+\'|"[^"]+")\)\.all\((.*?)\)', r'await queryDb(\1, [\2])', content)
        # db.prepare(...).all()
        content = re.sub(r'db\.prepare\((`[^`]+`|\'[^\']+\'|"[^"]+")\)\.all\(\)', r'await queryDb(\1)', content)
        
        # db.prepare(...).get(args)
        content = re.sub(r'db\.prepare\((`[^`]+`|\'[^\']+\'|"[^"]+")\)\.get\((.*?)\)', r'(await queryDb(\1, [\2]))?.[0]', content)
        # db.prepare(...).get()
        content = re.sub(r'db\.prepare\((`[^`]+`|\'[^\']+\'|"[^"]+")\)\.get\(\)', r'(await queryDb(\1))?.[0]', content)
        
        # db.prepare(...).run(args)
        content = re.sub(r'db\.prepare\((`[^`]+`|\'[^\']+\'|"[^"]+")\)\.run\((.*?)\)', r'await queryDb(\1, [\2])', content)
        # db.prepare(...).run()
        content = re.sub(r'db\.prepare\((`[^`]+`|\'[^\']+\'|"[^"]+")\)\.run\(\)', r'await queryDb(\1)', content)
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f'Updated {f}')
