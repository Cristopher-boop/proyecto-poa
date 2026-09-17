import re
import os

filepath = r'c:\Users\hp\Desktop\proyecto-poa\frontend\src\features\memorias\components\MemoriaForm.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('export default function MemoriasPage() {', 'export const MemoriaForm = ({ memoria, onClose, onSaved }: any) => {\n  const [showModalMemoria, setShowModalMemoria] = useState(true);')

# Find the main return
main_return_idx = content.find('  return (\n    <div className="flex h-screen')
if main_return_idx == -1:
    main_return_idx = content.find('  return (\n')

# Extract form
form_start = content.find('{showModalMemoria && (')
form_end = -1
count = 0
for i in range(form_start, len(content)):
    if content[i] == '{': count += 1
    elif content[i] == '}': count -= 1
    if count == 0:
        form_end = i + 1
        break

form_jsx = content[form_start+21:form_end-1].strip()

# Replace setShowModalMemoria(false) with onClose()
form_jsx = form_jsx.replace('setShowModalMemoria(false)', 'onClose()')

new_content = content[:main_return_idx] + '  return (\n' + form_jsx + '\n  );\n}\n'

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)
print('MemoriaForm.tsx rewritten successfully')
