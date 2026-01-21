import subprocess
import os
import shutil
from pathlib import Path

def compress_pdf(input_path: str, output_path: str, power: int = 3) -> str:
    """
    Comprime um arquivo PDF usando Ghostscript.

    Args:
        input_path (str): Caminho para o arquivo PDF de entrada.
        output_path (str): Caminho para salvar o arquivo PDF comprimido.
        power (int): Nível de compressão (0-4).
                     0: default
                     1: preplay (menor qualidade, mais rápido)
                     2: printer (qualidade de impressão)
                     3: ebook (qualidade média, bom tamanho - RECOMENDADO)
                     4: screen (menor qualidade, menor tamanho)

    Returns:
        str: Caminho do arquivo comprimido se sucesso.

    Raises:
        FileNotFoundError: Se o input_path não existir.
        RuntimeError: Se o Ghostscript falhar ou não estiver instalado.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Arquivo de entrada não encontrado: {input_path}")

    # Verificar se Ghostscript está instalado
    if not shutil.which("gs"):
        raise RuntimeError("Ghostscript (gs) não foi encontrado no sistema. Por favor, instale-o.")

    # Mapeamento de níveis de qualidade
    quality_settings = {
        0: "/default",
        1: "/prepress",
        2: "/printer",
        3: "/ebook",
        4: "/screen"
    }

    pdf_settings = quality_settings.get(power, "/ebook")

    # Comando Ghostscript
    gs_command = [
        "gs",
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        f"-dPDFSETTINGS={pdf_settings}",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        f"-sOutputFile={output_path}",
        input_path
    ]

    try:
        # Executar comando
        result = subprocess.run(
            gs_command,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        if not os.path.exists(output_path):
             raise RuntimeError("O arquivo de saída não foi gerado pelo Ghostscript.")
             
        # Verificar se o arquivo tem conteúdo válido (tamanho > 0)
        if os.path.getsize(output_path) == 0:
            raise RuntimeError("O arquivo de saída está vazio.")

        return output_path

    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Erro ao executar Ghostscript: {e.stderr}")
    except Exception as e:
        raise RuntimeError(f"Erro inesperado durante a compressão: {str(e)}")
