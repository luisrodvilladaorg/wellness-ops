FROM ghcr.io/actions/actions-runner:latest

USER root

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Terraform 1.6.6
RUN curl -fsSL https://releases.hashicorp.com/terraform/1.6.6/terraform_1.6.6_linux_amd64.zip \
    -o terraform.zip && \
    unzip terraform.zip && \
    mv terraform /usr/local/bin/ && \
    rm terraform.zip

# Install AWS CLI v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" \
    -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf awscliv2.zip aws/

# Install TFLint
RUN curl -s https://raw.githubusercontent.com/terraform-linters/tflint/master/install_linux.sh | bash

USER runner
