#!/usr/bin/env bash
# =====================================================================
#  convertir-delimitadores-math.sh
#
#  Convierte los delimitadores de LaTeX de los .qmd del tema de
#  ecuaciones e inecuaciones a la sintaxis canonica de Quarto:
#
#        \[ ... \]   ->   $$ ... $$      (bloque)
#        \( ... \)   ->   $  ...  $      (linea)
#
#  Motivo: la forma \( \) y \[ \] depende de la extension de Pandoc
#  tex_math_single_backslash, que no siempre esta activa. Cuando no lo
#  esta, Pandoc se come las barras invertidas y los subindices pasan a
#  interpretarse como enfasis de Markdown.
#
#  USO
#     cd  <carpeta ecuaciones-inecuaciones>
#     chmod +x convertir-delimitadores-math.sh
#     ./convertir-delimitadores-math.sh --dry-run     # simulacion
#     ./convertir-delimitadores-math.sh               # conversion real
#
#  OPCIONES
#     --dry-run     muestra el recuento sin escribir nada
#     --no-backup   no crea los ficheros .bak
#     --dir RUTA    carpeta donde estan los .qmd (por defecto, la actual)
# =====================================================================

set -euo pipefail

DIR="."
DRYRUN=0
BACKUP=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)   DRYRUN=1; shift ;;
    --no-backup) BACKUP=0; shift ;;
    --dir)       DIR="$2"; shift 2 ;;
    -h|--help)   sed -n '2,30p' "$0"; exit 0 ;;
    *) echo "Opcion no reconocida: $1" >&2; exit 1 ;;
  esac
done

if ! command -v perl >/dev/null 2>&1; then
  echo "Error: se necesita perl para hacer la sustitucion de forma segura." >&2
  exit 1
fi

FILES=(
  "01-cuadraticas-bicuadradas.qmd"
  "02-factorizacion-racionales-irracionales.qmd"
  "03-exponenciales-logaritmicas.qmd"
  "04-inecuaciones.qmd"
)

STAMP="$(date +%Y%m%d-%H%M%S)"
TOTAL_B=0
TOTAL_L=0
CHANGED=0

printf '%-48s %8s %10s %8s\n' "ARCHIVO" "BLOQUES" "EN LINEA" "ESTADO"
printf '%s\n' "----------------------------------------------------------------------------"

for name in "${FILES[@]}"; do
  path="$DIR/$name"

  if [[ ! -f "$path" ]]; then
    printf '%-48s %8s %10s %8s\n' "$name" "-" "-" "ausente"
    continue
  fi

  # Recuento previo de delimitadores de apertura.
  nb=$(grep -o '\\\[' "$path" 2>/dev/null | wc -l | tr -d ' ')
  nl=$(grep -o '\\(' "$path" 2>/dev/null | wc -l | tr -d ' ')

  if [[ "$nb" -eq 0 && "$nl" -eq 0 ]]; then
    printf '%-48s %8s %10s %8s\n' "$name" "0" "0" "ya ok"
    continue
  fi

  if [[ "$DRYRUN" -eq 1 ]]; then
    printf '%-48s %8s %10s %8s\n' "$name" "$nb" "$nl" "simulado"
    TOTAL_B=$((TOTAL_B + nb))
    TOTAL_L=$((TOTAL_L + nl))
    continue
  fi

  if [[ "$BACKUP" -eq 1 ]]; then
    cp -p "$path" "${path}.${STAMP}.bak"
  fi

  # -0777 procesa el fichero completo, no linea a linea.
  # El orden es indiferente porque los cuatro patrones son disjuntos.
  perl -0777 -pi -e '
      s/\\\[/\$\$/g;
      s/\\\]/\$\$/g;
      s/\\\(/\$/g;
      s/\\\)/\$/g;
  ' "$path"

  printf '%-48s %8s %10s %8s\n' "$name" "$nb" "$nl" "hecho"
  TOTAL_B=$((TOTAL_B + nb))
  TOTAL_L=$((TOTAL_L + nl))
  CHANGED=$((CHANGED + 1))
done

printf '%s\n' "----------------------------------------------------------------------------"
printf 'Total: %d bloques y %d expresiones en linea.\n' "$TOTAL_B" "$TOTAL_L"

if [[ "$DRYRUN" -eq 1 ]]; then
  echo "Modo simulacion: no se ha modificado ningun archivo."
else
  echo "Archivos modificados: $CHANGED"
  if [[ "$BACKUP" -eq 1 && "$CHANGED" -gt 0 ]]; then
    echo "Copias de seguridad creadas con el sello $STAMP"
    echo "Para revertir:  for f in *.${STAMP}.bak; do mv \"\$f\" \"\${f%.${STAMP}.bak}\"; done"
  fi
  echo "Siguiente paso: quarto render en cada pagina y revisar una formula de bloque."
fi
