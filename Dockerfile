# Use an official Nginx image
FROM nginx:alpine
# Copy build files to Nginx public folder
COPY ./dist /usr/share/nginx/html
# Optional: Add custom Nginx configuration for React Router support
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
# Expose port 80
EXPOSE 80
# Start Nginx
CMD ["nginx", "-g", "daemon off;"]