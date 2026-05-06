FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1 \
	TMPDIR=/tmp/sandbox

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		libmagic1 \
		exiftool \
		libexif12 \
	&& rm -rf /var/lib/apt/lists/*

RUN addgroup --system appuser \
	&& adduser --system --ingroup appuser --home /home/appuser appuser

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

RUN mkdir -p /tmp/sandbox \
	&& chmod 700 /tmp/sandbox \
	&& chown -R appuser:appuser /tmp/sandbox \
	&& chown -R appuser:appuser /app

COPY --chown=appuser:appuser app/ /app/app/

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').read()"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--limit-max-requests", "1000", "--limit-concurrency", "50"]
