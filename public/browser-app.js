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
  if (userName) {
    welcomeDOM.innerHTML = "Hi, " + userName + "!";
  }
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
      tasksDOM.innerHTML = '<h5 class="empty-list">No notes yet. Create one!</h5>';
      loadingDOM.style.visibility = 'hidden';
      return;
    }

    const allTasks = userData.map((task) => {
      const { completed, _id: taskID, name, images = [], videos = [] } = task;
      
      // Xử lý text: nếu không có name thì để chuỗi rỗng
      const noteHTML = name ? name.replace(/<br>/g, '<br>').replace(/&nbsp;/g, '&nbsp;') : '';
      
      const imagesHTML = images.map((url) => 
        `<img src="${url}" class="task-image" alt="task-img" />`
      ).join('');

      const videosHTML = videos.map((url) => 
        `<video src="${url}" class="task-video" controls playsinline></video>`
      ).join('');

      // Chỉ hiển thị phần text nếu có nội dung
      const textPart = noteHTML ? `
        <div class="task-note">
          <span class="task-check-icon"><i class="far fa-check-circle"></i></span>
          <p class="task-text">${noteHTML}</p>
        </div>
      ` : '';

      return `
        <div class="single-task ${completed ? 'task-completed' : ''}">
          <div class="task-content">
            <div class="task-media-grid">
                ${imagesHTML}
                ${videosHTML}
            </div>
            ${textPart}
          </div>
          <div class="task-links">
            <a href="task.html?id=${taskID}" class="edit-link"><i class="fas fa-edit"></i></a>
            <button type="button" class="delete-btn" data-id="${taskID}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    tasksDOM.innerHTML = allTasks;
  } catch (error) {
    console.log(error);
    tasksDOM.innerHTML = '<h5 class="empty-list">There was an error, please try later....</h5>';
  }
  loadingDOM.style.visibility = 'hidden';
};

showTasks();

tasksDOM.addEventListener('click', async (e) => {
  const el = e.target;
  const deleteBtn = el.closest('.delete-btn');
  
  if (deleteBtn) {
    loadingDOM.style.visibility = 'visible';
    const id = deleteBtn.dataset.id;
    try {
      await axios.delete(`/api/v1/tasks/${id}`);
      showTasks();
    } catch (error) {
      console.log(error);
    }
    loadingDOM.style.visibility = 'hidden';
  }
});

formDOM.addEventListener('submit', async (e) => {
  e.preventDefault();
  const taskName = taskInputDOM.value;
  const imageFiles = imageInputDOM.files;
  const videoFiles = videoInputDOM.files;

  // [UPDATE] Validate: Cho phép submit nếu có text HOẶC có file
  const hasText = taskName && taskName.trim() !== '';
  const hasFiles = imageFiles.length > 0 || videoFiles.length > 0;

  if (!hasText && !hasFiles) {
    formAlertDOM.style.display = 'block';
    formAlertDOM.textContent = 'Please enter a note OR select at least one image/video';
    formAlertDOM.classList.add('text-danger');
    setTimeout(() => formAlertDOM.style.display = 'none', 3000);
    return;
  }

  const escapeHTML = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  loadingDOM.style.visibility = 'visible';
  formAlertDOM.style.display = 'block';
  formAlertDOM.textContent = 'Uploading media... Please wait.'; 
  formAlertDOM.classList.remove('text-danger', 'text-success');

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
      // Nếu không có text thì gửi chuỗi rỗng
      name: hasText ? escapeHTML(taskName).replace(/ /g, '&nbsp;').replace(/\n/g, '<br>') : '',
      username: userName,
      images: uploadedImages,
      videos: uploadedVideos
    };

    await axios.post('/api/v1/tasks', taskData);

    taskInputDOM.value = '';
    imageInputDOM.value = '';
    videoInputDOM.value = '';
    document.getElementById('preview').innerHTML = '';

    formAlertDOM.textContent = 'Success, note added!';
    formAlertDOM.classList.add('text-success');
    showTasks();
  } catch (err) {
    console.error(err);
    formAlertDOM.textContent = 'Error uploading note';
    formAlertDOM.classList.add('text-danger');
  }

  setTimeout(() => {
    formAlertDOM.style.display = 'none';
    formAlertDOM.classList.remove('text-success', 'text-danger');
    loadingDOM.style.visibility = 'hidden';
  }, 3000);
});