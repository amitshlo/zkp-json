FROM amitshlo/alpine-node
COPY . /root
WORKDIR /root
RUN npm install && npm run build
CMD node build/index
