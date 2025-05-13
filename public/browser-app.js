const tasksDOM = document.querySelector('.tasks');
const loadingDOM = document.querySelector('.loading-text');
const formDOM = document.querySelector('.task-form');
const taskInputDOM = document.querySelector('.task-input');
const imageInputDOM = document.querySelector('#imageInput');
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

// Upload 1 ảnh lên Cloudinary
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, formData);
  return res.data.secure_url;
};

const showTasks = async () => {
  loadingDOM.style.visibility = 'visible';
  try {
    const { data: { tasks } } = await axios.get('/api/v1/tasks');
    const userData = tasks.filter((task) => task.username === userName);

    if (userData.length < 1) {
      tasksDOM.innerHTML = '<h5 class="empty-list">No tasks in your list</h5>';
      loadingDOM.style.visibility = 'hidden';
      return;
    }

    const allTasks = userData.map((task) => {
      const { completed, _id: taskID, name, images = [] } = task;
      const noteHTML = name.replace(/<br>/g, '<br>');
      const imagesHTML = images.map((url) => `<img src="${url}" class="task-image" />`).join('');
      return `<div class="single-task ${completed ? 'task-completed' : ''}">
                <div class="task-content">
                  <div class="task-image">${imagesHTML}</div>
                  <div class="task-note">
                    <p><span><i class="far fa-check-circle"></i></span>${noteHTML}</p>
                  </div>
                </div>
                <div class="task-links">
                    <a href="task.html?id=${taskID}" class="edit-link"><i class="fas fa-edit"></i></a>
                    <button type="button" class="delete-btn" data-id="${taskID}"><i class="fas fa-trash"></i></button>
                </div>
              </div>`;
    }).join('');

    tasksDOM.innerHTML = allTasks;
  } catch (error) {
    tasksDOM.innerHTML = '<h5 class="empty-list">There was an error, please try later....</h5>';
  }
  loadingDOM.style.visibility = 'hidden';
};

showTasks();

// DELETE Task
tasksDOM.addEventListener('click', async (e) => {
  const el = e.target;
  if (el.parentElement.classList.contains('delete-btn')) {
    loadingDOM.style.visibility = 'visible';
    const id = el.parentElement.dataset.id;
    try {
      await axios.delete(`/api/v1/tasks/${id}`);
      showTasks();
    } catch (error) {
      console.log(error);
    }
    loadingDOM.style.visibility = 'hidden';
  }
});

// CREATE Task + upload ảnh
formDOM.addEventListener('submit', async (e) => {
  e.preventDefault();
  const taskName = taskInputDOM.value;
  const files = imageInputDOM.files;

  if (!taskName && files.length === 0) {
    formAlertDOM.style.display = 'block';
    formAlertDOM.textContent = 'Please enter a note or select image(s)';
    formAlertDOM.classList.add('text-danger');
    setTimeout(() => formAlertDOM.style.display = 'none', 3000);
    return;
  }

  if (taskName.length > 50000) {
    formAlertDOM.style.display = 'block';
    formAlertDOM.textContent = 'Task name cannot exceed 50000 characters';
    formAlertDOM.classList.add('text-danger');
    setTimeout(() => formAlertDOM.style.display = 'none', 3000);
    return;
  }

  loadingDOM.style.visibility = 'visible';

  try {
    const uploadedImages = [];

    for (const file of files) {
      const url = await uploadToCloudinary(file);
      uploadedImages.push(url);
    }

    const taskData = {
      name: taskName.replace(/\n/g, '<br>'),
      username: userName,
      images: uploadedImages
    };

    await axios.post('/api/v1/tasks', taskData);

    taskInputDOM.value = '';
    imageInputDOM.value = '';
    formAlertDOM.style.display = 'block';
    formAlertDOM.textContent = 'Success, task added!';
    formAlertDOM.classList.add('text-success');
    showTasks();
  } catch (err) {
    console.error(err);
    formAlertDOM.style.display = 'block';
    formAlertDOM.textContent = 'Error uploading task';
    formAlertDOM.classList.add('text-danger');
  }

  setTimeout(() => {
    formAlertDOM.style.display = 'none';
    formAlertDOM.classList.remove('text-success', 'text-danger');
    loadingDOM.style.visibility = 'hidden';
  }, 3000);
});
