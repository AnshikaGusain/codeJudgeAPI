# Base image for multiple language support
FROM ubuntu:latest

# Install language-specific dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    nodejs \
    openjdk-11-jdk \
    build-essential \
    g++ \
    gdb

# Set the working directory
WORKDIR /app

# Copy the entry point script
COPY entrypoint.sh /app/entrypoint.sh

# Make the entry point script executable
RUN chmod +x /app/entrypoint.sh

# Set the entry point command
ENTRYPOINT ["/app/entrypoint.sh"]
