import sys

with open('/Users/andrei/Documents/AntigravityProjects/couple-hub/src/contexts/LanguageContext.jsx', 'r') as f:
    lines = f.readlines()

out_lines = []
skip = False
for line in lines:
    if line.startswith('// Dicționar simplificat pentru textele principale din aplicație') or line.startswith('const translations = {'):
        if not skip:
            out_lines.append("import { translations } from '../data/translations';\n\n")
            skip = True
    elif skip and line.startswith('const LanguageContext = createContext();'):
        skip = False
    
    if not skip:
        out_lines.append(line)

with open('/Users/andrei/Documents/AntigravityProjects/couple-hub/src/contexts/LanguageContext.jsx', 'w') as f:
    f.writelines(out_lines)

print("LanguageContext.jsx refactored")
