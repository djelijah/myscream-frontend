let mediaRecorder;
let audioChunks = [];

const recordButton = document.getElementById('recordButton');
const recordingsList = document.getElementById('recordingsList');

recordButton.addEventListener('click', async () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    recordButton.textContent = 'Record';
  } else {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.addEventListener('dataavailable', event => {
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener('stop', () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/ogg; codecs=opus' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.loop = true;
      audio.play();

      const listItem = document.createElement('div');
      listItem.innerHTML = `
        <audio controls src="${audioUrl}"></audio>
      `;
      recordingsList.appendChild(listItem);

      // Upload the recording to the server
      uploadRecording(audioBlob);
    });

    mediaRecorder.start();
    recordButton.textContent = 'Stop';
  }
});

async function uploadRecording(blob) {
  const formData = new FormData();
  formData.append('audio', blob, 'recording.ogg');

  const response = await fetch('/upload', {
    method: 'POST',
    body: formData
  });

  if (response.ok) {
    console.log('Uploaded successfully');
    fetchRecordings();
  } else {
    console.error('Upload failed');
  }
}

async function fetchRecordings() {
  const response = await fetch('/recordings');
  const recordings = await response.json();

  recordingsList.innerHTML = '';
  recordings.forEach(recording => {
    const listItem = document.createElement('div');
    listItem.innerHTML = `
      <audio controls src="${recording.url}"></audio>
    `;
    recordingsList.appendChild(listItem);
  });
}

// Fetch and display existing recordings on page load
fetchRecordings();
