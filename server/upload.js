const fs = require('fs');
const crypto = require('crypto'); // to generate fileId

const fileStorage = {};

class UploadedFile {
    constructor(name, size, chunksQuantity) {
        this.name = name;
        this.size = size;
        this.chunksQuantity = chunksQuantity;
        this.contentSizes = [];
        this.chunks = [];
        this.chunksDone = 0;
        this.handleLastChunk = 0;
    }
    getChunkLength(id) {
        if (!this.chunks[id]) {
            return 0;
        }
        return this.chunks[id].length;
    }

    pushChunk(id, chunk, contentLength) {
        const completeChunk = Buffer.concat(chunk);
        console.log([completeChunk.length, contentLength]);
        if (completeChunk.length !== Number(contentLength)) {
            return false;
        }
        this.chunks[id] = completeChunk;
        this.chunksDone += 1;
        this.handleLastChunk = Math.ceil(new Date().getTime() / 1000);

        return true;
    }

    isCompleted() {
        return this.chunksQuantity === this.chunksDone;
    }

    getContent() {
        return Buffer.concat(this.chunks);
    }
}

function initUploading(request, response) {
    console.log(request.body);
    const { name: fileName, size: fileSize, chunksQuantity } = request.body;
    if (!fileName || typeof fileSize === 'undefined' || typeof chunksQuantity === 'undefined') {
        return response.sendStatus(400);
    }

    const ext = fileName.split('.').pop();
    //filename
    const name = Date.now().toString() + '.' + ext;
    const size = Number(fileSize);

    const fileId = crypto.randomBytes(128).toString('hex');

    fileStorage[fileId] = new UploadedFile(name, size, Number(chunksQuantity));

    return response.json({
        status: 200,
        fileId,
        fileName: name,
    });
}

function loadingByChunks(request, response) {
    const { fileId, chunkId, chunkSize } = request.query;
    //console.log([fileId, chunkId, chunkSize ])
    if (!fileId || !chunkId || !typeof chunkSize === 'undefined') {
        return response.sendStatus(400);
    }

    const file = fileStorage[fileId];
    //console.log(fileStorage[fileId])
    const chunk = [];

    if (!file) {
        sendBadRequest(response, 'Wrong content id header');
        return;
    }
    //console.log(request.body);
    chunk.push(request.body);
    const chunkComplete = file.pushChunk(chunkId, chunk, chunkSize);

    if (!chunkComplete) {
        sendBadRequest(response, 'Chunk uploading was not completed');
        return;
    }

    const size = file.getChunkLength(chunkId);
    if (file.isCompleted()) {
        const fstream = fs.createWriteStream(__dirname + '/files/' + file.name);
        fstream.write(file.getContent());
        fstream.end();

        delete fileStorage[fileId];
    }

    //console.log(fileStorage[fileId]);
    return response.json({
        status: 200,
        size,
    });
}

function sendBadRequest(response, error) {
    response.write(
        JSON.stringify({
            status: 400,
            error,
        })
    );
    response.end();
}

module.exports = {
    initUploading,
    loadingByChunks,
    fileStorage
};
