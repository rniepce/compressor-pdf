from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
import shutil
import os
import uuid
from pathlib import Path
from core.compressor import compress_pdf

app = FastAPI(title="PDF Compressor Service", version="1.0.0")

# Diretório para arquivos temporários
TEMP_DIR = Path("/tmp/pdf_compressor")
if not TEMP_DIR.exists():
    TEMP_DIR.mkdir(parents=True, exist_ok=True)

# Diretório dos arquivos estáticos (build React)
STATIC_DIR = Path("app/static")

def cleanup_files(*file_paths: str):
    """Remove arquivos temporários após o processamento."""
    for path in file_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"Erro ao deletar arquivo {path}: {e}")



@app.post("/upload")

async def upload_pdf(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    compression_level: int = Form(3)
):
    """
    Recebe um arquivo PDF, comprime e retorna o arquivo processado.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="O arquivo deve ser um PDF.")

    # Gerar nomes de arquivos únicos para evitar colisão
    request_id = str(uuid.uuid4())
    input_filename = f"{request_id}_input.pdf"
    output_filename = f"{request_id}_compressed.pdf"
    
    input_path = TEMP_DIR / input_filename
    output_path = TEMP_DIR / output_filename

    try:
        # Salvar o arquivo recebido
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Executar compressão
        compress_pdf(str(input_path), str(output_path), power=compression_level)
        
        # Smart Guard: Verificar se o arquivo aumentou
        original_size = os.path.getsize(input_path)
        compressed_size = os.path.getsize(output_path)
        
        final_path = output_path
        filename_prefix = "compressed"
        
        if compressed_size >= original_size:
            # Se aumentou ou ficou igual, retornamos o original
            if os.path.exists(output_path):
                os.remove(output_path)
            final_path = input_path
            filename_prefix = "original"
        
        # Agendar limpeza dos arquivos após o envio da resposta
        background_tasks.add_task(cleanup_files, str(input_path), str(output_path))
        
        return FileResponse(
            str(final_path), 
            media_type="application/pdf", 
            filename=f"{filename_prefix}_{file.filename}"
        )

    except Exception as e:
        # Garantir limpeza em caso de erro
        cleanup_files(str(input_path), str(output_path))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health_check():
    return {"status": "ok"}


# Servir arquivos estáticos do build React (JS, CSS, assets)
app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")


@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    """
    Catch-all: serve o index.html do React para qualquer rota
    que não seja /upload, /health ou /assets.
    """
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return {"detail": "Frontend not built. Run 'npm run build' in frontend/"}
