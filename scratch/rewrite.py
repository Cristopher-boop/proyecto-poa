import shutil
import os

src = r'c:\Users\hp\Desktop\proyecto-poa\frontend\src\pages\memorias\MemoriasPageLegacy.tsx'
dest_form = r'c:\Users\hp\Desktop\proyecto-poa\frontend\src\features\memorias\components\MemoriaForm.tsx'
dest_modal = r'c:\Users\hp\Desktop\proyecto-poa\frontend\src\features\memorias\components\MemoriaDetalleModal.tsx'

shutil.copy(src, dest_form)
shutil.copy(src, dest_modal)

def process_file(filepath, component_name, original_modal_marker):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Rename component
    if component_name == 'MemoriaForm':
        content = content.replace('export default function MemoriasPage() {', 'export const MemoriaForm = ({ memoria, onClose, onSaved }: any) => {\n  const [showModalMemoria, setShowModalMemoria] = React.useState(true);')
    else:
        content = content.replace('export default function MemoriasPage() {', 'export const MemoriaDetalleModal = ({ memoriaId, onClose }: any) => {')

    # 2. Extract JSX
    start_idx = content.find(original_modal_marker)
    count = 0
    end_idx = -1
    for i in range(start_idx, len(content)):
        if content[i] == '{': count += 1
        elif content[i] == '}': count -= 1
        if count == 0:
            end_idx = i + 1
            break
            
    inner_jsx = content[start_idx:end_idx]
    inner_jsx = inner_jsx[1:-1].strip()
    
    div_idx = inner_jsx.find('<div')
    trailing_paren_idx = inner_jsx.rfind(')')
    
    final_jsx = inner_jsx[div_idx:trailing_paren_idx].strip()
    
    if component_name == 'MemoriaForm':
        final_jsx = final_jsx.replace('setShowModalMemoria(false)', 'onClose()')
    else:
        final_jsx = final_jsx.replace('setFichaMemoria(null)', 'onClose()')
    
    # 3. Cut file at main return
    main_return = '  return (\n    <div className="space-y-6'
    split_idx = content.find(main_return)
    if split_idx == -1:
        # Fallback just in case
        split_idx = content.find('  return (\n')
    
    new_content = content[:split_idx] + '  return (\n' + final_jsx + '\n  );\n}\n'
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

process_file(dest_form, 'MemoriaForm', '{showModalMemoria && (')
process_file(dest_modal, 'MemoriaDetalleModal', '{fichaMemoria && (')

print('Extraction complete!')
