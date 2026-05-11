# SecureFrame-Gallery
Sistema seguro de gestion de imagenes con analisis de esteganografia.

## Requisitos
- Docker + Docker Compose
- Node.js 20+
- Python 3.11+

## Despliegue (local)
1) Variables de entorno
- Copia .env.example a .env en la raiz (Docker Compose)
- Copia frontend/.env.example a frontend/.env
- Copia backend/.env.example a backend/.env

2) Levantar servicios base (PostgreSQL, Redis, MinIO, FastAPI analyzer)
```bash
docker compose up -d
```

3) Frontend (Next.js)
```bash
cd frontend
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

## Variables de entorno
### Raiz (Docker Compose) - .env
- MINIO_ENDPOINT
- MINIO_ACCESS_KEY
- MINIO_SECRET_KEY
- MINIO_BUCKET_CLEAN
- MINIO_BUCKET_QUARANTINE
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_DB

### Frontend - frontend/.env
- DATABASE_URL
- AUTH_SECRET
- AUTH_URL
- BACKEND_URL

### Backend - backend/.env
- MINIO_ENDPOINT
- MINIO_ACCESS_KEY
- MINIO_SECRET_KEY
- MINIO_BUCKET_CLEAN
- MINIO_BUCKET_QUARANTINE
- REDIS_URL
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_DB
- POSTGRES_HOST
- MAX_IMAGE_SIZE_MB
- RATE_LIMIT_REQUESTS
- RATE_LIMIT_PERIOD
- SECRET_KEY
- CORS_ORIGINS
- LOG_LEVEL
- MAX_FILENAME_LENGTH
- TEMP_FILE_TTL_SECONDS
- ALLOWED_MIME_TYPES
- SANDBOX_MAX_MEMORY_MB
- SANDBOX_TIMEOUT_SECONDS
- ALLOWED_HOSTS
- TEMP_DIR_BASE
- AUTH_SECRET

## Credenciales de prueba
Estas credenciales se crean con el comando `npm run db:seed`.
- Supervisor demo: supervisor@secureframe.com / Supervisor123!
- Admin demo: admin@secureframe.com / Admin123!

Usuario demo (rol USER): crea una cuenta desde /register.

## Justificacion tecnica: deteccion de esteganografia
El analisis de esteganografia se implementa con Pillow y NumPy para lograr un
proceso determinista, rapido y explicable sin depender de modelos entrenados.
Se combinan metricas ligeras pero efectivas:
- LSB analysis: detecta patrones anormales en los bits menos significativos.
- Histogram analysis: identifica irregularidades en la distribucion de tonos.
- Entropy analysis: mide el nivel de aleatoriedad y ruido en la imagen.
- EOF anomaly: busca bytes extra al final del archivo (posible payload oculto).

La puntuacion final es un promedio ponderado de estas metricas, con reglas
adicionales para marcar como sospechosas imagenes de alta entropia con otros
indicadores. Este enfoque es adecuado para un sistema de moderacion porque:
- Explica facilmente el por que del veredicto.
- Evita falsos positivos por modelos opacos.
- Es eficiente y compatible con despliegue en contenedores.

## Puertos por defecto
- Frontend: http://localhost:3000
- FastAPI analyzer: http://localhost:8000
- MinIO API: http://localhost:9000
- MinIO Console: http://localhost:9001
