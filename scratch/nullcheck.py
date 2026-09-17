fname = r'c:\Users\hp\Desktop\proyecto-poa\frontend\src\features\memorias\components\MemoriaDetalleModal.tsx'
with open(fname, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('  return (\n    <div className="fixed', '  if (!fichaMemoria) return null;\n  return (\n    <div className="fixed')

with open(fname, 'w', encoding='utf-8') as f:
    f.write(content)
