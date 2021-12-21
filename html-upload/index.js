!(function () {
    const form = document.getElementById('form');
    const fileInput = document.getElementById('file');
    const uploadButton = document.getElementById('upload');
    const progress = document.getElementById('progress');
    const uploadTime = document.getElementById('uploadTime');

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        fileInput.setAttribute('disabled', 'disabled');
        uploadButton.setAttribute('disabled', 'disabled');
        uploadTime.textContent = '';
        progress.textContent = '';

        const file = fileInput.files[0];
        if (!file) {
            alert('Please choose a file');
            fileInput.removeAttribute('disabled');
            uploadButton.removeAttribute('disabled');
            return;
        }
        const endTimer = getTimeCounter();

        uploader()
            .send(file)
            .onProgress(({ loaded, total }) => {
                const percent = Math.round((loaded / total) * 100);
                progress.textContent = `${percent}%`;
                
                if (loaded === total) {
                    const timeSpent = endTimer();
                    alert('Completed upload!');
                    fileInput.removeAttribute('disabled');
                    uploadButton.removeAttribute('disabled');
                    uploadTime.textContent = `(${timeSpent / 1000} sec)`;
                }
            })
            .upload();
    });

    function getTimeCounter() {
        const start = +new Date();

        return () => {
            return +new Date() - start;
        };
    }
})();
