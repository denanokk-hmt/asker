 
FROM node:14.15.0
RUN useradd -ms /bin/bash dev
RUN usermod -aG root dev

#ENV HOME /home/dev
#WORKDIR /home/dev
ENV NODE_ENV=prd
ARG COMMITID
ENV COMMITID ${COMMITID}
ARG SHA_COMMIT_ID
ENV SHA_COMMIT_ID ${SHA_COMMIT_ID}
ARG VERSION
ENV VERSION ###VERSION###
ARG DEPLOY_UNIXTIME
ENV DEPLOY_UNIXTIME ###DEPLOY_UNIXTIME###

ADD . /home/dev
COPY package.json /home/dev/package.json
RUN cd /home/dev; npm install; npm audit fix
COPY . /home/dev

RUN mkdir /logs-hmt
RUN chmod 770 /logs-hmt

USER dev

EXPOSE 8080
CMD ["node", "/home/dev/bin/www"]
