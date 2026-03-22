const button = document.getElementById('summarizeBtn')
const input = document.getElementById('urlInput')
const loading = document.getElementById('loading')
const result = document.getElementById('result')
const resultText = document.getElementById('resultText')
const historyList = []

function showError(message) {
  resultText.textContent = message
  result.style.borderLeft = '3px solid #e53e3e'
  result.classList.remove('hidden')
  loading.classList.add('hidden')
  button.disabled = false
  button.textContent = 'Summarize'
}

function copyToClipboard() {
  const text = resultText.textContent
  navigator.clipboard.writeText(text).then(() => {
    const copyBtn = document.getElementById('copyBtn')
    copyBtn.textContent = 'Copied!'
    setTimeout(() => {
      copyBtn.textContent = 'Copy'
    }, 2000)
  })
}

function addToHistory(url, summary) {
  historyList.unshift({ url, summary })
  if (historyList.length > 5) historyList.pop()

  const historyEl = document.getElementById('history')
  const listEl = document.getElementById('historyList')

  listEl.innerHTML = ''

  historyList.forEach((item, index) => {
    const li = document.createElement('li')
    li.className = 'history-item'
    li.innerHTML = `
      <span class="history-url">${new URL(item.url).hostname}</span>
      <span class="history-preview">${item.summary.slice(0, 80)}...</span>
    `
    li.addEventListener('click', () => {
      resultText.textContent = item.summary
      document.getElementById('wordCount').textContent =
        `${item.summary.split(' ').length} words`
      result.classList.remove('hidden')
    })
    listEl.appendChild(li)
  })

  historyEl.classList.remove('hidden')
}

button.addEventListener('click', async function() {
  const url = input.value
  
  if (url === '') {
  showError('Please enter a URL.')
  return
}

try {
  new URL(url)
} catch {
  showError('Please enter a valid URL including https://')
  return
}

  button.disabled = true
  button.textContent = 'Summarizing...'
  loading.classList.remove('hidden')
  result.classList.add('hidden')
  result.classList.remove('visible')

  console.log('URL to summarize:', url)

   try {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    })

  const data = await response.json()

   if (!response.ok) {
      showError(data.error || 'Something went wrong. Please try again.')
      return
    }

 
 // Show result
    result.style.borderLeft = 'none'
    resultText.textContent = data.summary
    document.getElementById('wordCount').textContent = `${data.summary.split(' ').length} words`
    addToHistory(url, data.summary)
    loading.classList.add('hidden')
    result.classList.remove('hidden')
    result.classList.add('visible')
    button.disabled = false
    button.textContent = 'Summarize'

  } catch (error) {
   showError('Could not summarize that page. Try a different URL.')
  }
})