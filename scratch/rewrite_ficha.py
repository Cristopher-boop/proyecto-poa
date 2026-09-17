import re
import os

filepath = r'c:\Users\hp\Desktop\proyecto-poa\frontend\src\features\memorias\components\MemoriaDetalleModal.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('export default function MemoriasPage() {', 'export const MemoriaDetalleModal = ({ memoriaId, onClose }: any) => {')

# Find the main return
main_return_idx = content.find('  return (\n    <div className="flex h-screen')
if main_return_idx == -1:
    main_return_idx = content.find('  return (\n')

# Extract ficha
ficha_start = content.find('{fichaMemoria && (')
ficha_end = -1
count = 0
for i in range(ficha_start, len(content)):
    if content[i] == '{': count += 1
    elif content[i] == '}': count -= 1
    if count == 0:
        ficha_end = i + 1
        break

ficha_jsx = content[ficha_start+17:ficha_end-1].strip()

# Replace setFichaMemoria(null) with onClose()
ficha_jsx = ficha_jsx.replace('setFichaMemoria(null)', 'onClose()')

new_content = content[:main_return_idx] + '  return (\n' + ficha_jsx + '\n  );\n}\n'

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)
print('MemoriaDetalleModal.tsx rewritten successfully')
