FROM python:3.11-slim

# Install Node 18
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Node deps
COPY package.json package-lock.json* ./
RUN npm install

# App source
COPY . .

EXPOSE 8080

# Start scheduler (which starts web server internally)
CMD ["python", "run_all.py", "--no-browser"]