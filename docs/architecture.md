# Arquitetura de Escala: Sistema de Compressão de PDF (TJMG)

Este documento descreve a estratégia para evoluir o MVP atual para uma arquitetura escalável capaz de atender 20.000 usuários e picos de demanda (ex: 500 uploads simultâneos).

## O Problema de Escala

A compressão de PDF é uma tarefa **intensiva de CPU e I/O**.

- **MVP Atual (Síncrono):** O servidor web (FastAPI) processa o arquivo enquanto o usuário espera. Se 10 usuários enviarem arquivos grandes, os workers do servidor web ficarão ocupados e o 11º usuário receberá timeout.
- **Solução (Assíncrono):** Desacoplar o recebimento do arquivo (rápido) do processamento (lento).

## Arquitetura Proposta

### Diagrama de Fluxo

```mermaid
graph LR
    User[Advogado/Usuário] -->|Upload PDF| API[API Gateway / Load Balancer]
    API -->|Salva Arquivo| Storage[Google Cloud Storage (Bucket 'Raw')]
    API -->|Publica Mensagem| PubSub[Google Cloud Pub/Sub]
    API -->|Retorna ID da Tarefa| User
    
    subgraph Workers [Cloud Run / GKE / Railway]
        Worker1[Worker PDF]
        Worker2[Worker PDF]
        WorkerN[Worker PDF]
    end
    
    PubSub -->|Push Subscription| Workers
    Workers -->|Baixa Arquivo| Storage
    Workers -->|Processa (Ghostscript)| Workers
    Workers -->|Salva Comprimido| Storage[Google Cloud Storage (Bucket 'Clean')]
    Workers -->|Notifica Conclusão| Database[Redis / Firestore]
    
    User -->|Polling Status / Webhook| API
```

### Componentes

1. **Frontend / API Gateway (Cloud Run)**:
    - Recebe o PDF.
    - Faz upload imediato para um bucket "Raw" no Google Cloud Storage (GCS).
    - Publica uma mensagem no Pub/Sub com o caminho do arquivo e metadados.
    - Retorna "202 Accepted" e um `task_id` para o usuário.
    - **Tempo de resposta estimado:** < 200ms.
    - **Alternativa Railway:** O serviço web pode rodar no Railway, se comunicando com Redis (plugin do Railway) em vez de Pub/Sub para filas mais simples.

2. **Fila de Mensagens (Google Pub/Sub)**:
    - Garante que nenhuma tarefa seja perdida.
    - Permite buffering de milhares de requisições.

3. **Workers (Cloud Run Jobs ou Service)**:
    - Escutam a fila.
    - Baixam o PDF do GCS.
    - Executam o script de compressão (Ghostscript).
    - Fazem upload do resultado para um bucket "Processed" no GCS.
    - Atualizam o status da tarefa em um banco rápido (Redis ou Firestore).
    - **Escalabilidade:** O Cloud Run pode escalar de 0 a 1000 containers automaticamente baseada na profundidade da fila (queue depth).

4. **Armazenamento (Google Cloud Storage)**:
    - Custos baixos e durabilidade alta.
    - Políticas de ciclo de vida (Lifecycle policies) para deletar arquivos após 24h (requisito de privacidade).

## Tratamento de Picos (500 usuários simultâneos)

- O **Pub/Sub** enfileira todas as 500 requisições instantaneamente.
- O **Cloud Run Scaler** percebe o aumento na fila e inicia novos containers (Workers).
- Se houver limite de quota (ex: max 100 workers), a fila cresce, mas **o servidor não cai**. O processamento apenas leva um pouco mais de tempo.
- O usuário vê uma barra de progresso real ("Posição na fila: 42").

## Segurança e Privacidade

- **Ephemeral Storage**: Os workers usam armazenamento em memória ou disco efêmero containerizado. Ao terminar o container, os dados somem.
- **TTL no Bucket**: Configuração para deleção automática de objetos após X horas.
- **Criptografia**: Dados encriptados em repouso (GCS default) e em trânsito (HTTPS).
