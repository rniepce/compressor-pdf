from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
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

def cleanup_files(*file_paths: str):
    """Remove arquivos temporários após o processamento."""
    for path in file_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"Erro ao deletar arquivo {path}: {e}")

@app.post("/upload")
async def upload_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
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
        # Nota: Em um ambiente real de produção (Passo 3), isso seria enviado para uma fila (Celery/Redis)
        # Aqui, fazemos síncrono para o MVP, mas o I/O do subprocesso não bloqueia totalmente o event loop se fosse async IO, 
        # porém subprocess.run é bloqueante. Para 20k usuários, isso será movido para workers.
        compress_pdf(str(input_path), str(output_path))
        
        # Agendar limpeza dos arquivos após o envio da resposta
        background_tasks.add_task(cleanup_files, str(input_path), str(output_path))
        
        return FileResponse(
            str(output_path), 
            media_type="application/pdf", 
            filename=f"compressed_{file.filename}"
        )

    except Exception as e:
        # Garantir limpeza em caso de erro
        cleanup_files(str(input_path), str(output_path))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok"}
