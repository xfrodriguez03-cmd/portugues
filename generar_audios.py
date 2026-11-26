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


def nombre_archivo(texto):
    """Igual que nombreAudio() en app.js: sin tildes, minúsculas, guiones."""
    sin_tildes = "".join(c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", sin_tildes.lower()).strip("-")


def palabras():
    app = (AQUI / "app.js").read_text(encoding="utf-8")
    semilla = re.search(r"const SEMILLA = `(.*?)`;", app, re.S).group(1)
    lineas = semilla.splitlines()
    extra = AQUI / "audio" / "extra.txt"
    if extra.exists():
        lineas += extra.read_text(encoding="utf-8").splitlines()
    vistas = {}
    for linea in lineas:
        if not linea.strip() or linea.strip().startswith("#"):
            continue
        partes = [p.strip() for p in linea.split("|")]
        # columna 1: la palabra; columna 4: la oración de ejemplo
        for texto in [partes[0]] + ([partes[3]] if len(partes) > 3 else []):
            if texto:
                vistas.setdefault(nombre_archivo(texto), texto)
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
            # "puxar / empurrar" se lee "puxar, empurrar"
            m, sr = kokoro.create(pt.replace(" / ", ", "), voice=VOZ, speed=VELOCIDAD, lang="pt-br")
            wav = Path(tmp) / f"{nombre}.wav"
            sf.write(wav, recortar(np.asarray(m, dtype=np.float32), sr), sr)
            subprocess.run([str(FFMPEG), "-loglevel", "error", "-y", "-i", str(wav), "-ac", "1", "-b:a", "48k", str(destino)], check=True)
            print("listo:", destino.name, "←", pt)
    nombres = sorted(n for n in lista if (carpeta / f"{n}.mp3").exists())
    (carpeta / "indice.js").write_text(
        "// Generado por generar_audios.py: palabras que tienen audio grabado.\n"
        f"self.AUDIOS = {json.dumps(nombres, ensure_ascii=False)};\n",
        encoding="utf-8",
    )
    print(f"{len(nombres)} audios en audio/indice.js")


if __name__ == "__main__":
    main()
