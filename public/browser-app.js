const tasksDOM = document.querySelector('.tasks')
const loadingDOM = document.querySelector('.loading-text')
const formDOM = document.querySelector('.task-form')
const taskInputDOM = document.querySelector('.task-input')
const formAlertDOM = document.querySelector('.form-alert')
const welcomeDOM = document.querySelector('.welcome')

var userName = localStorage.getItem('curUsername');
const welcome = () => {
  if (userName != "") {
    welcomeDOM.innerHTML = "Hi, " + userName + "!"
  }
}
welcome()

const showTasks = async () => {
  loadingDOM.style.visibility = 'visible'
  try {
    const { data: { tasks } } = await axios.get('/api/v1/tasks')
    const userData = tasks.filter(task => task.username === userName)

    if (userData.length < 1) {
      tasksDOM.innerHTML = '<h5 class="empty-list">No tasks in your list</h5>'
      loadingDOM.style.visibility = 'hidden'
      return
    }
    const allTasks = userData
      .map((task) => {
        const { completed, _id: taskID, name } = task
        return `<div class="single-task ${completed && 'task-completed'}">
<p><span><i class="far fa-check-circle"></i></span>${name}</p>
<div class="task-links">
<a href="task.html?id=${taskID}" class="edit-link">
<i class="fas fa-edit"></i>
</a>
<button type="button" class="delete-btn" data-id="${taskID}">
<i class="fas fa-trash"></i>
</button>
</div>
</div>`
      })
      .join('')
    tasksDOM.innerHTML = allTasks
  } catch (error) {
    tasksDOM.innerHTML = '<h5 class="empty-list">There was an error, please try later....</h5>'
  }
  loadingDOM.style.visibility = 'hidden'
}

showTasks()


// delete task /api/tasks/:id

tasksDOM.addEventListener('click', async (e) => {
  const el = e.target
  if (el.parentElement.classList.contains('delete-btn')) {
    loadingDOM.style.visibility = 'visible'
    const id = el.parentElement.dataset.id
    try {
      await axios.delete(`/api/v1/tasks/${id}`)
      showTasks()
    } catch (error) {
      console.log(error)
    }
  }
  loadingDOM.style.visibility = 'hidden'
})

formDOM.addEventListener('submit', async (e) => {
  e.preventDefault()
  const taskName = taskInputDOM.value

  if (taskName.length > 50000) {
    formAlertDOM.style.display = 'block'
    formAlertDOM.textContent = 'Task name cannot exceed 50000 characters'
    formAlertDOM.classList.add('text-danger')
    setTimeout(() => formAlertDOM.style.display = 'none', 3000)
    return
  }

  try {
    await axios.post('/api/v1/tasks', { name: taskName, username: userName })
    showTasks()
    taskInputDOM.value = ''
    formAlertDOM.style.display = 'block'
    formAlertDOM.textContent = `Success, task added`
    formAlertDOM.classList.add('text-success')
  } catch (error) {
    formAlertDOM.style.display = 'block'
    formAlertDOM.innerHTML = `Error, please try again`
  }
  setTimeout(() => {
    formAlertDOM.style.display = 'none'
    formAlertDOM.classList.remove('text-success')
  }, 3000)
})
