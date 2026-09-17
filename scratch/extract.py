with open(r'c:\Users\hp\Desktop\proyecto-poa\scratch\MemoriaDetalleModal.tsx.backup', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60')
print('Found at', start)
html = content[start-10:]
with open(r'c:\Users\hp\Desktop\proyecto-poa\scratch\modal_html.txt', 'w', encoding='utf-8') as f2:
    f2.write(html)
