import os
import re

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Check if useState is used
    if 'useState' in content:
        # Check if it's imported
        if not re.search(r'import\s+.*useState.*from\s+[\'"]react[\'"]', content):
            # Exclude comments? simpler check first
            print(f"Possible missing import in: {filepath}")

def scan_dir(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                check_file(os.path.join(root, file))

scan_dir('/Users/zaher/prueba/src')
