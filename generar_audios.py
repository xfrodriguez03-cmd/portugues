"""Genera la pronunciación en portugués de Brasil de cada tarjeta (archivos MP3).

Usa Kokoro (voz local y gratis, la misma del piloto de Shorts) y ffmpeg.
Lee las palabras y las oraciones de ejemplo del mazo inicial (SEMILLA en app.js) y,
si existe, de audio/extra.txt (una palabra o frase en portugués por línea, o líneas
"portugués | español | nota | ejemplo | traducción").

Uso (desde esta carpeta):
    ..\\piloto-canal\\tools\\venv\\Scripts\\python.exe -X utf8 generar_audios.py

Salida:
    audio/<nombre>.mp3   un archivo por palabra
    audio/indice.js      la lista de audios que existen (la usan app.js y sw.js)
"""
import json
import os
import re
import subprocess
import tempfile
import unicodedata
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

AQUI = Path(__file__).parent
FFMPEG = AQUI.parent / "piloto-canal" / "tools" / "bin" / "ffmpeg.exe"
VOZ = "pf_dora"
VELOCIDAD = 0.9
UMBRAL = 0.012


# Las tildes quedan en el nombre como un número, porque cambian la palabra:
# avô (abuelo) = avo3.mp3, avó (abuela) = avo1.mp3
MARCAS = {"́": "1", "̀": "2", "̂": "3", "̃": "4", "̧": "5"}


def nombre_archivo(texto):
    """Igual que nombreAudio() en app.js: minúsculas, tildes como número, guiones."""
    salida = []
    for ch in unicodedata.normalize("NFD", texto.lower()):
        if ch in MARCAS:
            salida.append(MARCAS[ch])
        elif ch.isascii() and ch.isalnum():
            salida.append(ch)
        else:
            salida.append("-")
    return re.sub(r"-+", "-", "".join(salida)).strip("-")


def palabras():
    """Palabra y ejemplo de cada tarjeta de catalogo.js, más audio/extra.txt."""
    catalogo = (AQUI / "catalogo.js").read_text(encoding="utf-8")
    texto = re.search(r"self\.CATALOGO = `(.*?)`;", catalogo, re.S).group(1)
    pares = []
    for linea in texto.splitlines():
        partes = [p.strip() for p in linea.split("|")]
        if len(partes) >= 5 and not linea.strip().startswith("#"):
            pares.append((partes[1], partes[4]))  # id | pt | es | nota | ejemplo | traducción
    extra = AQUI / "audio" / "extra.txt"
    if extra.exists():
        for linea in extra.read_text(encoding="utf-8").splitlines():
            if linea.strip() and not linea.strip().startswith("#"):
                partes = [p.strip() for p in linea.split("|")]
                pares.append((partes[0], partes[3] if len(partes) > 3 else ""))
    vistas = {}
    for palabra, ejemplo in pares:
        for t in (palabra, ejemplo):
            if t:
                vistas.setdefault(nombre_archivo(t), t)
    return vistas


def recortar(m, sr):
    activos = np.flatnonzero(np.abs(m) > UMBRAL)
    if activos.size == 0:
        return m
    aire = int(0.05 * sr)
    return m[max(activos[0] - aire, 0): min(activos[-1] + aire, len(m))]


def main():
    cache = Path.home() / ".cache" / "hyperframes" / "tts"
    kokoro = Kokoro(str(cache / "models" / "kokoro-v1.0.onnx"), str(cache / "voices" / "voices-v1.0.bin"))
    carpeta = AQUI / "audio"
    carpeta.mkdir(exist_ok=True)
    lista = palabras()
    with tempfile.TemporaryDirectory() as tmp:
        for nombre, pt in lista.items():
            destino = carpeta / f"{nombre}.mp3"
            if destino.exists():
                continue
            # "mão / mal" se lee "mão, mal"; "Onde fica...?" se lee sin los puntos suspensivos
            leer = pt.replace(" / ", ", ").replace("...", "")
            m, sr = kokoro.create(leer, voice=VOZ, speed=VELOCIDAD, lang="pt-br")
            wav = Path(tmp) / f"{nombre}.wav"
            sf.write(wav, recortar(np.asarray(m, dtype=np.float32), sr), sr)
            subprocess.run([str(FFMPEG), "-loglevel", "error", "-y", "-i", str(wav), "-ac", "1", "-b:a", "48k", str(destino)], check=True)
            print("listo:", destino.name, "←", pt)
    # Audios que ya no usa ninguna tarjeta: afuera
    for viejo in carpeta.glob("*.mp3"):
        if viejo.stem not in lista:
            viejo.unlink()
            print("borrado (ya no se usa):", viejo.name)
    nombres = sorted(n for n in lista if (carpeta / f"{n}.mp3").exists())
    faltan = [lista[n] for n in lista if n not in nombres]
    if faltan:
        print("SIN AUDIO:", faltan)
    (carpeta / "indice.js").write_text(
        "// Generado por generar_audios.py: palabras que tienen audio grabado.\n"
        f"self.AUDIOS = {json.dumps(nombres, ensure_ascii=False)};\n",
        encoding="utf-8",
    )
    print(f"{len(nombres)} audios en audio/indice.js")


if __name__ == "__main__":
    main()
