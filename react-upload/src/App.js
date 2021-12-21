import './App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

const chunkSize = 1024 * 1024 * 5; //5 MB
function App() {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [fileSize, setFileSize] = useState(1);
    const [fileId, setFileId] = useState(null);
    const [chunkId, setChunkId] = useState(null);
    const [isLoad, setIsLoad] = useState(0);
    const handleFileChange = (e) => {
        setFile(e.target.files);
        setIsLoad(0);
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please choose a file');
            return;
        }
        try {
            const { name, size } = file[0];
            setIsLoad(0);
            setFileSize(size);
            let chunksQuantity = Math.ceil(size / chunkSize);
            //chunksQueue: 5 4 3 2 1 0
            setChunkId(chunksQuantity);
            //console.log(chunksQuantity)
            //const sentSize = chunkId * chunkSize;
            //const chunk = file[0].slice(sentSize, sentSize + chunkSize);

            const data = { name, size, chunksQuantity };
            const result = await axios.post('http://localhost:3920/upload/init', data);
            const { fileName, fileId } = result.data;
            //
            let temp = chunksQuantity;
            //let temp = 10; -> check Cronjob
            while (temp--) {
                const sentSize = temp * chunkSize;
                const chunk = file[0].slice(sentSize, sentSize + chunkSize);
                sendChunk(temp, chunk, fileId, chunk.size);
                //isLoad += chunk.size;
                //console.log([isLoad, size])
                //const percent = isLoad / size * 100;
                //console.log(percent);
                //setPercent(percent);
            }

            setFileName(fileName);
            setFileId(fileId);
        } catch (error) {
            console.log(error);
        }
    };

    const sendChunk = async (chunkId, chunk, fileId, chunkSize) => {
        try {
            const params = new URLSearchParams();
            params.set('chunkId', chunkId);
            params.set('chunkSize', chunkSize);
            params.set('fileId', fileId);

            const headers = {
                'Content-Type': 'application/octet-stream',
            };

            const result = await axios.post(`http://localhost:3920/upload?${params.toString()}`, chunk, { headers });
            
            setIsLoad(load => load + chunkSize);
            console.log(result.data);
        } catch (error) {
            console.log('send Chunk fail');
            console.log(error);
        }
    };
    return (
        <div className='App'>
            <input type='file' name='choose file' onChange={handleFileChange} />
            <br />
            <input type='button' value='upload' onClick={handleUpload} />
            <br />
            {fileName && (
                <a href={`http://localhost:3920/files/${fileName}`} target='_blank' rel='noreferrer'>
                    {fileName}
                </a>
            )}

            <p>{isLoad/fileSize*100}</p>
        </div>
    );
}

export default App;
