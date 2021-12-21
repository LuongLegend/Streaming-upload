const uploader = function () {
    class Uploader {
        constructor() {
            this.chunkSize = 5 * 1024 * 1024;
            this.file = null;
            this.fileId = null;
            this.fileName = null;
            this.chunksQuantity = 0;
            this.uploadedSize = 0;
        }

        setupFile = function (file) {
            if (!file) {
                return;
            }

            this.file = file;
        };

        start = async function () {
            const chunksQuantity = Math.ceil(this.file.size / this.chunkSize);
            this.chunksQuantity = chunksQuantity;

            try {
                const data = { name: this.file.name, size: this.file.size, chunksQuantity };
                const response = await fetch('http://localhost:3920/upload/init', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
                const res = await response.json();
                this.fileId = res.fileId;
                this.fileName = res.fileName;
            } catch (error) {
                throw new Error('Có lỗi xảy ra! Upload file không thành công!');
            }
        };

        sendChunk = function (chunk, chunkId) {
            return new Promise(async (resolve, reject) => {
                try {
                    const params = new URLSearchParams();
                    params.set('chunkId', chunkId);
                    params.set('chunkSize', chunk.size);
                    params.set('fileId', this.fileId);
                    const response = await fetch(`http://localhost:3920/upload?${params.toString()}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/octet-stream',
                        },
                        body: chunk,
                    });
                    const res = await response.json();
                    this.uploadedSize += chunk.size;

                    this.onProgress({
                        loaded: this.uploadedSize,
                        total: this.file.size,
                    });
                    resolve(res);
                } catch (error) {
                    reject(error);
                }
            });
        };

        upload = async function () {
            try {
                await this.start();
            } catch (error) {
                alert(error);
                return;
            }

            let chunkId = this.chunksQuantity;
            let em = [];
            while (chunkId--) {
                const sentSize = chunkId * this.chunkSize;
                const chunk = this.file.slice(sentSize, sentSize + this.chunkSize);
                const promise = this.sendChunk(chunk, chunkId);
                em.push(promise);
            }
            Promise.all(em)
                .then(() => {})
                .catch((error) => {
                    alert(`Có lỗi xảy ra không thể upload file!`);
                });
        };

        on = function (method, callback) {
            if (typeof callback !== 'function') {
                callback = () => {};
            }

            this[method] = callback;
        };
    }

    const uploadFile = new Uploader();
    return {
        send: function (file) {
            uploadFile.setupFile(file);

            return this;
        },
        upload: function () {
            uploadFile.upload();
        },
        onProgress: function (callback) {
            uploadFile.on('onProgress', callback);

            return this;
        },
    };
};
