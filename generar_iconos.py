"""Dibuja los íconos de la app (dos tarjetas con "Oi!").

Uso:  python generar_iconos.py
Genera icons/icon-192.png, icons/icon-512.png e icons/apple-touch-icon.png (180x180).
El dibujo queda dentro del 70% central para que sirva también como ícono "maskable".
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

AQUI = Path(__file__).parent
S = 1024  # se dibuja grande y después se achica (queda más prolijo)


def tarjeta(ancho, alto, color, radio):
    capa = Image.new("RGBA", (ancho, alto), (0, 0, 0, 0))
    ImageDraw.Draw(capa).rounded_rectangle((0, 0, ancho - 1, alto - 1), radio, fill=color)
    return capa


def pegar_rotada(base, capa, angulo, centro):
    r = capa.rotate(angulo, resample=Image.BICUBIC, expand=True)
    base.alpha_composite(r, (centro[0] - r.width // 2, centro[1] - r.height // 2))


def dibujar():
    img = Image.new("RGBA", (S, S))
    # Fondo: degradé verde oscuro
    arriba, abajo = (22, 101, 52), (5, 46, 22)
    d = ImageDraw.Draw(img)
    for y in range(S):
        t = y / (S - 1)
        d.line([(0, y), (S, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(arriba, abajo)) + (255,))

    ancho, alto = 520, 640
    # Tarjeta de atrás: amarilla
    pegar_rotada(img, tarjeta(ancho, alto, (250, 204, 21, 255), 70), 12, (S // 2 - 30, S // 2 + 10))
    # Tarjeta de adelante: blanca con "Oi!"
    frente = tarjeta(ancho, alto, (248, 250, 252, 255), 70)
    fd = ImageDraw.Draw(frente)
    fuente = ImageFont.truetype("C:/Windows/Fonts/seguibl.ttf", 230)
    fd.text((ancho // 2, alto // 2 - 20), "Oi!", font=fuente, fill=(20, 83, 45, 255), anchor="mm")
    # Rayita azul (como la franja de la bandera)
    fd.rounded_rectangle((ancho // 2 - 120, alto - 150, ancho // 2 + 120, alto - 118), 16, fill=(30, 58, 138, 255))
    pegar_rotada(img, frente, -6, (S // 2 + 25, S // 2))
    return img.convert("RGB")


def main():
    carpeta = AQUI / "icons"
    carpeta.mkdir(exist_ok=True)
    grande = dibujar()
    for nombre, lado in [("icon-512.png", 512), ("icon-192.png", 192), ("apple-touch-icon.png", 180)]:
        grande.resize((lado, lado), Image.LANCZOS).save(carpeta / nombre, optimize=True)
        print("listo:", carpeta / nombre)


if __name__ == "__main__":
    main()
