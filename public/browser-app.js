const tasksDOM = document.querySelector('.tasks');
const loadingDOM = document.querySelector('.loading-text');
const formDOM = document.querySelector('.task-form');
const taskInputDOM = document.querySelector('.task-input');
const imageInputDOM = document.querySelector('#imageInput');
const videoInputDOM = document.querySelector('#videoInput');
const formAlertDOM = document.querySelector('.form-alert');
const welcomeDOM = document.querySelector('.welcome');

const CLOUD_NAME = 'daz56kp15';
const UPLOAD_PRESET = 'note-task';

var userName = localStorage.getItem('curUsername') || 'Guest';

const welcome = () => {
    if (userName) welcomeDOM.innerHTML = "Hi, " + userName + "!";
};
welcome();

const uploadToCloudinary = async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    const resourceType = type === 'video' ? 'video' : 'image';

    const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
        formData
    );
    return res.data.secure_url;
};

const showTasks = async () => {
    loadingDOM.style.visibility = 'visible';
    try {
        const { data: { tasks } } = await axios.get('/api/v1/tasks');
        const userData = tasks.filter((task) => task.username === userName);

        if (userData.length < 1) {
            tasksDOM.innerHTML = '<h5 class="empty-list">No notes yet.</h5>';
            loadingDOM.style.visibility = 'hidden';
            return;
        }

        const allTasks = userData.map((task) => {
            const { completed, _id: taskID, name, images = [], videos = [] } = task;
            const noteHTML = name ? name.replace(/<br>/g, '<br>').replace(/&nbsp;/g, '&nbsp;') : '';

            const imagesHTML = images.map((url) => `<img src="${url}" class="task-image" />`).join('');
            const videosHTML = videos.map((url) => `<video src="${url}" class="task-video" controls></video>`).join('');

            return `
        <div class="single-task ${completed ? 'task-completed' : ''}">
          <div class="task-content" style="width: 90%;">
            <div class="task-media-grid">${imagesHTML}${videosHTML}</div>
            ${noteHTML ? `<div class="task-note"><i class="far fa-check-circle" style="color: #28a745;"></i><p>${noteHTML}</p></div>` : ''}
          </div>
          <div class="task-links">
            <a href="task.html?id=${taskID}" class="edit-link"><i class="fas fa-edit"></i></a>
            <button type="button" class="delete-btn" data-id="${taskID}"><i class="fas fa-trash"></i></button>
          </div>
        </div>`;
        }).join('');

        tasksDOM.innerHTML = allTasks;
    } catch (error) {
        tasksDOM.innerHTML = '<h5>Error loading tasks...</h5>';
    }
    loadingDOM.style.visibility = 'hidden';
};

showTasks();

formDOM.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskName = taskInputDOM.value;
    const imageFiles = imageInputDOM.files;
    const videoFiles = videoInputDOM.files;

    // LOGIC: Kiểm tra có ít nhất 1 trong 3 (Text OR Ảnh OR Video)
    const hasText = taskName && taskName.trim() !== '';
    const hasImages = imageFiles.length > 0;
    const hasVideos = videoFiles.length > 0;

    if (!hasText && !hasImages && !hasVideos) {
        formAlertDOM.style.display = 'block';
        formAlertDOM.textContent = 'Please add text, an image, or a video!';
        formAlertDOM.className = 'form-alert text-danger';
        setTimeout(() => { formAlertDOM.style.display = 'none'; }, 3000);
        return;
    }

    loadingDOM.style.visibility = 'visible';
    formAlertDOM.style.display = 'block';
    formAlertDOM.textContent = 'Uploading... Please wait.';
    formAlertDOM.className = 'form-alert';

    try {
        const uploadedImages = [];
        const uploadedVideos = [];

        for (const file of imageFiles) {
            const url = await uploadToCloudinary(file, 'image');
            uploadedImages.push(url);
        }

        for (const file of videoFiles) {
            const url = await uploadToCloudinary(file, 'video');
            uploadedVideos.push(url);
        }

        const taskData = {
            name: hasText ? taskName.replace(/ /g, '&nbsp;').replace(/\n/g, '<br>') : '',
            username: userName,
            images: uploadedImages,
            videos: uploadedVideos
        };

        await axios.post('/api/v1/tasks', taskData);

        // Reset form
        taskInputDOM.value = '';
        imageInputDOM.value = '';
        videoInputDOM.value = '';
        document.getElementById('preview').innerHTML = '';
        document.getElementById('imageName').textContent = "No files chosen";
        document.getElementById('videoName').textContent = "No files chosen";

        formAlertDOM.textContent = 'Success!';
        formAlertDOM.className = 'form-alert text-success';
        showTasks();
    } catch (err) {
        formAlertDOM.textContent = 'Error uploading.';
        formAlertDOM.className = 'form-alert text-danger';
    }
    setTimeout(() => { formAlertDOM.style.display = 'none';
      loadingDOM.style.visibility = 'hidden';
     }, 3000);
});

tasksDOM.addEventListener('click', async (e) => {
    const el = e.target;
    if (el.parentElement.classList.contains('delete-btn')) {
        const id = el.parentElement.dataset.id;
        try {
            await axios.delete(`/api/v1/tasks/${id}`);
            showTasks();
        } catch (error) { console.log(error); }
    }
});