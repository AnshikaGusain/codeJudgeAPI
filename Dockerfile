# Base image for multiple language support
FROM ubuntu:latest

# Set the working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    openjdk-11-jdk \
    build-essential \
    g++ \
    gdb \
    curl

# Install Node.js using NodeSource repository
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs

# Install prompt-sync package
RUN npm install prompt-sync

# Copy the entry point script
COPY entrypoint.sh /app/entrypoint.sh

# Make the entry point script executable
RUN chmod +x /app/entrypoint.sh

# Set the entry point command
ENTRYPOINT ["/app/entrypoint.sh"]
