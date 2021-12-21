const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const CronJob = require('cron').CronJob;

const app = express();
app.use(
    cors({
        origin: 'http://localhost:2294',
    })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '100mb' }));

const { loadingByChunks, initUploading, fileStorage } = require('./upload');

const PORT = 3920;

app.post('/upload/init', initUploading);

app.post('/upload', loadingByChunks);

app.use('/files', express.static('files')); //

//cron job 
const job = new CronJob(
    '* 1 * * * *', //every hour 
    function () {
        console.log('---------------');
        console.log(fileStorage);
        console.log('---------------');
        for (const fileId in fileStorage) {
            const currentTimestamp = Math.ceil(new Date().getTime() / 1000);
            const diffTime = Math.abs(currentTimestamp - fileStorage[fileId].handleLastChunk);
            const hour = 60;

            if (diffTime >= hour) {
                delete fileStorage[fileId];
            }
        }
    },
    null,
    true,
    'Asia/Ho_Chi_Minh'
);
job.start();
///
app.listen(PORT, () => {
    console.log(`App is listening on port: ${PORT}`);
});
