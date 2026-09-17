with open(r'c:\Users\hp\Desktop\proyecto-poa\frontend\src\features\memorias\components\MemoriaDetalleModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("alertService.confirm('Eliminar Memoria', '¿Desea eliminar esta memoria?');", "alertService.confirm({ title: 'Eliminar Memoria', text: '¿Desea eliminar esta memoria?' });")
content = content.replace('handleDelete(targetId);', 'handleDelete();')

with open(r'c:\Users\hp\Desktop\proyecto-poa\frontend\src\features\memorias\components\MemoriaDetalleModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
