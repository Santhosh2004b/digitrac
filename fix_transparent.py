import os

def fix_transparent():
    d = 'frontend/src'
    for r, _, files in os.walk(d):
        for f in files:
            if f.endswith('.js') or f.endswith('.css'):
                p = os.path.join(r, f)
                with open(p, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                if 'transparent' in content:
                    new_content = content.replace('transparent', 'rgba(0,0,0,0)')
                    with open(p, 'w', encoding='utf-8') as file:
                        file.write(new_content)
                    print(f"Fixed {p}")

if __name__ == "__main__":
    fix_transparent()
