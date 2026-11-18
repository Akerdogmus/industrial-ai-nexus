"""Motion'dan dışa aktarılan tanıtım filmlerini site için hazırlar.

Kullanım:
  python scripts/mux-promos.py <indirilenler_klasörü>

Her film için public/assets/videos/promo/<id>.mp4 üretir: görüntü web için
sıkıştırılır (H.264, faststart), Motion'ın müziği korunur.
Gereken: pip install imageio-ffmpeg
"""
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
ROOT = Path(__file__).resolve().parent.parent
OUT_WEB = ROOT / "public/assets/videos/promo"

# promo kimliği -> Motion dışa aktarımının dosya adı (Downloads)
FILMS = {
    "agropulse": "agropulse-ai-tan-t-m-filmi.mp4",
    "pharmai": "pharmai-tan-t-m-filmi.mp4",
    "mixer": "mb-process-guard-tan-t-m-filmi.mp4",
    "rkvision": "rkvision-guard-tan-t-m-filmi.mp4",
    "synthvision": "synth-vision-suite-tan-t-m-filmi.mp4",
}


def web_version(src: Path, dst: Path) -> None:
    subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", "-i", str(src),
                    "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(dst)], check=True)


def main() -> None:
    downloads = Path(sys.argv[1])
    OUT_WEB.mkdir(parents=True, exist_ok=True)
    for fid, name in FILMS.items():
        src = downloads / name
        if not src.exists():
            print(f"-- {fid}: {name} bulunamadı, atlandı")
            continue
        dst = OUT_WEB / f"{fid}.mp4"
        web_version(src, dst)
        print(f"ok {fid}: {dst.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
