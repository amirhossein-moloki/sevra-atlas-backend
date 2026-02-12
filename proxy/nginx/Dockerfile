FROM nginx:1.27-alpine

# Remove default configuration
RUN rm /etc/nginx/conf.d/default.conf

# The template will be automatically processed by the official nginx image
# and placed in /etc/nginx/conf.d/ when the container starts.
# Environment variables will be substituted.
COPY templates /etc/nginx/templates
