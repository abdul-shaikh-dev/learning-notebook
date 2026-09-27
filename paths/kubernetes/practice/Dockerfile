FROM python:3.13-slim AS test
WORKDIR /src
COPY release_app.py test_release_app.py ./
RUN python -m unittest -v test_release_app.py

FROM python:3.13-slim AS runtime
WORKDIR /app
COPY --from=test /src/release_app.py ./
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 BIND_HOST=0.0.0.0 PORT=8080 RELEASE_DB=/tmp/notes.db
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/ready', timeout=2)"
CMD ["python", "release_app.py"]
