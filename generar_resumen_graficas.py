from pathlib import Path
import re
import json
import pandas as pd

# Carpeta donde está este script (PáginaWeb)
BASE_DIR = Path(__file__).parent

# Nombre del archivo Excel que ya generaste
EXCEL_PATH = BASE_DIR / "Consolidado_TOTAL_54cols_v2_allyears.xlsx"



def parse_mes_anio(mes_str: str):
    """
    Convierte 'Enero2022' -> (2022, 1), 'Febrero2025' -> (2025, 2), etc.
    Si el mes no es reconocible (p. ej. 'Desconocido2021'), deja mes_num como NA.
    """
    mes_str = str(mes_str)
    m = re.match(r"([A-Za-zÁÉÍÓÚáéíóúñÑ]+)(\d{4})$", mes_str)
    if not m:
        return pd.NA, pd.NA

    nombre = m.group(1).lower()
    anio = int(m.group(2))

    meses_orden = {
        "enero": 1,
        "febrero": 2,
        "marzo": 3,
        "abril": 4,
        "mayo": 5,
        "junio": 6,
        "julio": 7,
        "agosto": 8,
        "septiembre": 9,
        "setiembre": 9,
        "octubre": 10,
        "noviembre": 11,
        "diciembre": 12,
    }

    mes_num = meses_orden.get(nombre, pd.NA)
    return anio, mes_num


def generar_resumen_graficas(df: pd.DataFrame, root: Path) -> None:
    if df is None or df.empty:
        print("[AVISO] DataFrame vacío. No se generan resúmenes de gráficas.")
        return

    tot_col = "TOTAL SENTIDO 1 Y 2 CON EXCENTOS"
    if tot_col not in df.columns:
        print(f"[AVISO] No está la columna '{tot_col}' en el DataFrame; no se generan gráficas.")
        return

    resumen = {
        "generated_from": EXCEL_PATH.name,
    }

    # ---------- Gráfico 1: tráfico mensual total ----------
    tmp = df.copy()
    tmp[["anio", "mes_num"]] = tmp["Mes"].apply(
        lambda s: pd.Series(parse_mes_anio(s))
    )
    # Quitamos los meses con nombre desconocido (mes_num NA)
    tmp = tmp.dropna(subset=["anio", "mes_num"])

    if not tmp.empty:
        tmp["anio"] = tmp["anio"].astype(int)
        tmp["mes_num"] = tmp["mes_num"].astype(int)

        g1 = (
            tmp.groupby(["anio", "mes_num"])[tot_col]
            .sum()
            .reset_index()
            .sort_values(["anio", "mes_num"])
        )

        meses_abbr = {
            1: "Ene", 2: "Feb", 3: "Mar", 4: "Abr",
            5: "May", 6: "Jun", 7: "Jul", 8: "Ago",
            9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic",
        }

        labels1 = [
            f"{meses_abbr.get(int(row.mes_num), '?')} {int(row.anio)}"
            for _, row in g1.iterrows()
        ]
        data1 = [
            float(v) if pd.notna(v) else None
            for v in g1[tot_col]
        ]

        resumen["chart1"] = {
            "title": "Tráfico mensual total (Sentido 1+2 con exentos)",
            "labels": labels1,
            "data": data1,
            "yLabel": "Número de vehículos",
        }

    # ---------- Gráfico 2: top 10 peajes por tráfico acumulado ----------
    g2 = (
        df.groupby("Peaje")[tot_col]
        .sum()
        .reset_index()
        .sort_values(tot_col, ascending=False)
        .head(10)
    )

    labels2 = g2["Peaje"].astype(str).tolist()
    data2 = [
        float(v) if pd.notna(v) else 0.0
        for v in g2[tot_col]
    ]

    resumen["chart2"] = {
        "title": "Top 10 peajes por tráfico acumulado (Sentido 1+2 con exentos)",
        "labels": labels2,
        "data": data2,
        "yLabel": "Número de vehículos",
    }

    # ---------- Gráfico 3: distribución de exentos por categoría ----------
    ex_cols_all = ["I", "II", "III", "IV", "V", "VI", "VII"]
    ex_cols = [c for c in ex_cols_all if c in df.columns]

    if ex_cols:
        s = df[ex_cols].sum()
        labels3 = s.index.astype(str).tolist()
        data3 = [
            float(v) if pd.notna(v) else 0.0
            for v in s
        ]

        resumen["chart3"] = {
            "title": "Distribución de vehículos exentos por categoría",
            "labels": labels3,
            "data": data3,
        }

    out_json = root / "resumen_graficas.json"
    with out_json.open("w", encoding="utf-8") as f:
        json.dump(resumen, f, ensure_ascii=False, indent=2)

    print(f"[OK] Resumen de gráficas guardado en: {out_json}")


def main():
    if not EXCEL_PATH.exists():
        print(f"[ERROR] No existe el archivo: {EXCEL_PATH}")
        return

    df = pd.read_excel(EXCEL_PATH)
    print(f"[OK] Cargado {EXCEL_PATH} con {len(df)} filas.")
    generar_resumen_graficas(df, EXCEL_PATH.parent)


if __name__ == "__main__":
    main()
