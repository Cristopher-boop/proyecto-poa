# Importación gradual del POA 2027

El comando procesa una sola área por vez. Por seguridad, no escribe datos a
menos que se indique `--apply`.

## 1. Preparar la base de datos

```powershell
cd backend
.\venv\Scripts\python.exe manage.py migrate
```

## 2. Simular un área

```powershell
.\venv\Scripts\python.exe manage.py importar_poa_2027 --area PL --consolidado "C:\Users\USUARIO\Desktop\Proyecto TAM\27.7 consolidado general 2027 (1).xlsx" --operaciones "C:\Users\USUARIO\Desktop\Proyecto TAM\OPERACION-PRESUPUESTO 2027 (2).xlsx" --report ".\reportes\PL-simulacion.json"
```

La simulación valida: total de cada hoja, suma de sus ítems, partida, monto,
operación POA y mes requerido contra la determinación de requerimientos.

## 3. Aplicar solo después de revisar el reporte

Agregue `--apply` al mismo comando:

```powershell
.\venv\Scripts\python.exe manage.py importar_poa_2027 --area PL --consolidado "C:\Users\USUARIO\Desktop\Proyecto TAM\27.7 consolidado general 2027 (1).xlsx" --operaciones "C:\Users\USUARIO\Desktop\Proyecto TAM\OPERACION-PRESUPUESTO 2027 (2).xlsx" --apply --report ".\reportes\PL-importado.json"
```

El comando se detiene ante cualquier inconsistencia y no duplica una memoria
que ya tenga el código de importación correspondiente.
