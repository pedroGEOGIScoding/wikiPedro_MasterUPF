#!/usr/bin/env python3
# =====================================================================
#  aplicar_parche_reales.py   ·   Linux / macOS / Windows
#
#  Version robusta: NO depende de los nombres de los .qmd.
#  Recorre todos los .qmd de la carpeta y aplica los arreglos donde
#  encuentra las celdas afectadas, asi que funciona con
#  funciones-part1, reales-part3, o cualquier nombre que uses manana.
#
#  Arregla:
#    1) Error de sintaxis OJS: comillas invertidas dentro de md`...`
#    2) Anade el ayudante mdx a los motores (_*motor*.qmd)
#    3) Pasa a mdx las celdas cuyo texto contiene formulas LaTeX
#    4) Comprueba que los {{< include >}} apuntan a archivos que existen
#
#  Uso:  cd <carpeta del proyecto Quarto>  &&  python3 aplicar_parche_reales.py
# =====================================================================

import re
import shutil
from pathlib import Path

C, R, G, Y, D, N = "\033[36m", "\033[31m", "\033[32m", "\033[33m", "\033[90m", "\033[0m"

# ---------------------------------------------------------------------
# CONFIGURACION
# ---------------------------------------------------------------------

# Sustituciones literales (comillas invertidas que rompen las plantillas md)
LITERALES = [
    ("`a = 0.333`", "**a = 0.333**"),
    ("`a = 1/3`", "**a = 1/3**"),
    ("`b = 1/3`", "**b = 1/3**"),
    ("`(x^2+1)/x`", "**(x^2+1)/x**"),
    ("`1/x`", "**1/x**"),
]

# Celdas con formulas LaTeX que deben usar mdx en lugar de md
CELDAS_MDX = [
    "S4_txt",                                   # reales · problema inverso
    "T3_txt", "T4_txt", "T5_txt", "T6_out",     # reales · radicales
    "T7_out", "T9_out", "TA_txt", "TC_txt2",    # reales · radicales y logaritmos
]

AYUDANTE_MDX = '''
```{ojs}
//| echo: false
// mdx: igual que md, pero pide a MathJax que componga las formulas del
// fragmento recien insertado (Quarto solo tipografia el contenido estatico
// al cargar la pagina, no lo que generan los applets).
mdx = (strings, ...valores) => {
  const el = md(strings, ...valores);
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([el]).catch(() => {});
  }
  return el;
}
```
'''

informe = []
CARPETA = Path(".")


def respaldar(p: Path) -> None:
    bak = p.with_name(p.name + ".bak")
    if not bak.exists():
        shutil.copy2(p, bak)


# ---------------------------------------------------------------------
# 1 y 3) Recorrer todos los .qmd aplicando literales y md -> mdx
# ---------------------------------------------------------------------
archivos = sorted(CARPETA.glob("*.qmd"))
if not archivos:
    print(f"{R}No hay ningun .qmd en esta carpeta. Situate en el directorio del proyecto.{N}")
    raise SystemExit(1)

for qmd in archivos:
    texto = original = qmd.read_text(encoding="utf-8")
    detalles = []

    for viejo, nuevo in LITERALES:
        n = texto.count(viejo)
        if n:
            texto = texto.replace(viejo, nuevo)
            detalles.append(f"{n}x comillas invertidas")

    convertidas = []
    for celda in CELDAS_MDX:
        patron = f"{celda} = md`"
        if patron in texto:
            texto = texto.replace(patron, f"{celda} = mdx`")
            convertidas.append(celda)
    if convertidas:
        detalles.append(f"a mdx: {', '.join(convertidas)}")

    if texto != original:
        respaldar(qmd)
        qmd.write_text(texto, encoding="utf-8")
        informe.append(("ok", f"{qmd.name}  ->  " + " · ".join(detalles)))

# ---------------------------------------------------------------------
# 2) Anadir el ayudante mdx a los motores
# ---------------------------------------------------------------------
motores = [p for p in archivos if p.name.startswith("_") and "motor" in p.name.lower()]
if not motores:
    informe.append(("aviso", "No encuentro ningun archivo de motor (_*motor*.qmd). "
                             "Si lo has renombrado, anade el bloque mdx a mano."))
for m in motores:
    contenido = m.read_text(encoding="utf-8")
    if re.search(r"^\s*mdx\s*=", contenido, re.MULTILINE):
        informe.append(("nada", f"{m.name}  ->  el ayudante mdx ya estaba"))
    else:
        respaldar(m)
        m.write_text(contenido.rstrip() + "\n" + AYUDANTE_MDX, encoding="utf-8")
        informe.append(("ok", f"{m.name}  ->  ayudante mdx anadido"))

# ---------------------------------------------------------------------
# 4) Comprobar los {{< include >}} (imprescindible si has renombrado)
# ---------------------------------------------------------------------
incluidos = []
for qmd in archivos:
    for destino in re.findall(r"\{\{<\s*include\s+([^\s>]+)\s*>\}\}", qmd.read_text(encoding="utf-8")):
        existe = (CARPETA / destino).exists()
        incluidos.append((qmd.name, destino, existe))

# ---------------------------------------------------------------------
# INFORME
# ---------------------------------------------------------------------
print(f"\n{C}=== ARCHIVOS ENCONTRADOS ==={N}")
for p in archivos:
    etiqueta = "partial (no se publica)" if p.name.startswith("_") else "pagina"
    print(f"{D}  {p.name}  ({etiqueta}){N}")

print(f"\n{C}=== CAMBIOS APLICADOS ==={N}")
if not informe:
    print(f"{D}  Nada que cambiar: todo estaba ya corregido.{N}")
for estado, mensaje in informe:
    color = {"ok": G, "aviso": R, "nada": D}[estado]
    marca = {"ok": "OK  ", "aviso": "!!  ", "nada": "--  "}[estado]
    print(f"{color}{marca}{mensaje}{N}")

print(f"\n{C}=== INCLUDES ==={N}")
if not incluidos:
    print(f"{R}  Ninguna pagina incluye un motor. Los applets NO funcionaran sin el.{N}")
for archivo, destino, existe in incluidos:
    if existe:
        print(f"{G}  OK   {archivo}  incluye  {destino}{N}")
    else:
        print(f"{R}  ROTO {archivo}  incluye  {destino}  <-- ese archivo NO existe{N}")
        print(f"{Y}       Corrige la linea a:  {{{{< include NOMBRE_REAL_DEL_MOTOR.qmd >}}}}{N}")

# ---------------------------------------------------------------------
# AUDITORIA: comillas invertidas sospechosas dentro de bloques {ojs}
# ---------------------------------------------------------------------
print(f"\n{C}=== COMILLAS INVERTIDAS SOSPECHOSAS EN CELDAS OJS ==={N}")
sospechas = 0
for qmd in archivos:
    dentro = False
    for n, linea in enumerate(qmd.read_text(encoding="utf-8").splitlines(), start=1):
        if re.match(r"^\s*```\{ojs\}", linea):
            dentro = True
            continue
        if re.match(r"^\s*```\s*$", linea):
            dentro = False
            continue
        if dentro and linea.count("`") >= 2 and not re.search(r"=\s*mdx?`", linea):
            print(f"{Y}  {qmd.name}:{n}{N}  {linea.strip()[:86]}")
            sospechas += 1
if sospechas == 0:
    print(f"{G}  Ninguna. Todo limpio.{N}")
else:
    print(f"{Y}\n  Revisa esas {sospechas} linea(s): si estan dentro de una plantilla md, quita las comillas.{N}")

print(f"\n{Y}Copias de seguridad: *.qmd.bak{N}")
print(f"{Y}Siguiente paso:  quarto preview <tu-pagina>.qmd{N}\n")
