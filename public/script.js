import { supabase } from './supabase.js'

// Elements
const button = document.getElementById('summarizeBtn')
const input = document.getElementById('urlInput')
const loading = document.getElementById('loading')
const result = document.getElementById('result')
const resultText = document.getElementById('resultText')
const signInBtn = document.getElementById('signInBtn')
const signUpBtn = document.getElementById('signUpBtn')
const signOutBtn = document.getElementById('signOutBtn')
const emailInput = document.getElementById('emailInput')
const passwordInput = document.getElementById('passwordInput')
const authForms = document.getElementById('authForms')
const userInfo = document.getElementById('userInfo')
const userEmail = document.getElementById('userEmail')
const authError = document.getElementById('authError')
const historyList = []

let currentUser = null

// ---- Auth state ----
supabase.auth.onAuthStateChange((event, session) => {
  currentUser = session?.user || null
  if (currentUser) {
    authForms.classList.add('hidden')
    userInfo.classList.remove('hidden')
    signInTrigger.classList.add('hidden')
    userEmail.textContent = currentUser.email.split('@')[0]
   // document.getElementById('saveHint').classList.add('hidden')
    loadHistory()
  } else {
    authForms.classList.add('hidden')
    userInfo.classList.add('hidden')
    signInTrigger.classList.remove('hidden')
    signInTrigger.textContent = 'Sign in'
    //document.getElementById('saveHint').classList.remove('hidden')
    document.getElementById('history').classList.add('hidden')
    document.getElementById('historyList').innerHTML = ''
  }
})

// ---- Small button for signIn ----
const signInTrigger = document.getElementById('signInTrigger')
signInTrigger.addEventListener('click', () => {
  authForms.classList.toggle('hidden')
  signInTrigger.textContent = 
    authForms.classList.contains('hidden') ? 'Sign in' : 'Cancel'
})

// ---- Sign up ----
signUpBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim()
  const password = passwordInput.value.trim()
  if (!email || !password) return showAuthError('Enter email and password.')
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) return showAuthError(error.message)
  showAuthError('Check your email to confirm your account.', true)
})

// ---- Sign in ----
signInBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim()
  const password = passwordInput.value.trim()
  if (!email || !password) return showAuthError('Enter email and password.')
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return showAuthError(error.message)
})

// ---- Sign out ----
signOutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut()
})

function showAuthError(message, isSuccess = false) {
  authError.textContent = message
  authError.style.color = isSuccess ? '#19bd52' : '#e53e3e'
  authError.classList.remove('hidden')
}

// ---- Load history from Supabase ----
async function loadHistory() {
  const { data, error } = await supabase
    .from('summaries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !data) return

  const historyEl = document.getElementById('history')
  const listEl = document.getElementById('historyList')
  listEl.innerHTML = ''

  if (data.length === 0) return

  data.forEach(item => {
    const li = createHistoryItem(item.url, item.summary)
    listEl.appendChild(li)
  })

  historyEl.classList.remove('hidden')
}

// ---- Save to Supabase ----
async function saveToSupabase(url, summary, title) {
  if (!currentUser) return
  const { error } = await supabase.from('summaries').insert({
    user_id: currentUser.id,
    url,
    summary,
    title
  })
  if (error) console.error('Save error:', error)
}

// ---- Create history item element ----
function createHistoryItem(url, summary) {
  const li = document.createElement('li')
  li.className = 'history-item'
  li.innerHTML = `
    <span class="history-url">${new URL(url).hostname}</span>
    <span class="history-preview">${summary.slice(0, 80)}...</span>
  `
  li.addEventListener('click', () => {
    resultText.textContent = summary
    document.getElementById('wordCount').textContent =
      `${summary.split(' ').length} words`
    result.classList.remove('hidden')
    result.classList.add('visible')
  })
  return li
}

// ---- Error display ----
function showError(message) {
  resultText.textContent = message
  result.style.borderLeft = '3px solid #e53e3e'
  result.classList.remove('hidden')
  loading.classList.add('hidden')
  button.disabled = false
  button.textContent = 'Summarize'
}

// ---- Copy to clipboard ----
function copyToClipboard() {
  const text = resultText.textContent
  navigator.clipboard.writeText(text).then(() => {
    const copyBtn = document.getElementById('copyBtn')
    copyBtn.textContent = 'Copied!'
    setTimeout(() => { copyBtn.textContent = 'Copy' }, 2000)
  })
}
window.copyToClipboard = copyToClipboard

// ---- Summarize ----
button.addEventListener('click', async function () {
  const url = input.value.trim()

  if (url === '') return showError('Please enter a URL.')

  try {
    new URL(url)
  } catch {
    return showError('Please enter a valid URL including https://')
  }

  resultText.textContent = ''
  result.style.borderLeft = 'none'
  result.classList.add('hidden')
  result.classList.remove('visible')
  loading.classList.remove('hidden')
  button.disabled = true
  button.textContent = 'Summarizing...'

  try {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })

    const data = await response.json()

    if (!response.ok) return showError(data.error || 'Something went wrong.')

    resultText.textContent = data.summary
    document.getElementById('wordCount').textContent =
      `${data.summary.split(' ').length} words`
    result.style.borderLeft = 'none'
    loading.classList.add('hidden')
    result.classList.remove('hidden')
    result.classList.add('visible')
    button.disabled = false
    button.textContent = 'Summarize'

    // Save to Supabase if logged in
    if (currentUser) {
      await saveToSupabase(url, data.summary, data.title || '')
      await loadHistory()
    }

  } catch (error) {
    showError('Could not summarize that page. Try a different URL.')
  }
})

//Get active session
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    currentUser = session.user
    userInfo.classList.remove('hidden')
    signInTrigger.classList.add('hidden')
    userEmail.textContent = session.user.email.split('@')[0]
    document.getElementById('saveHint').classList.add('hidden')
    loadHistory()
  }
})