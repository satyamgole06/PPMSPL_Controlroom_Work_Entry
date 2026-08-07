/**
 * ============================================================
 * Control Room Work Management System - Frontend Script
 * Vanilla JS (ES6) - Production Ready
 * ============================================================
 */

'use strict';

/* ============================================================
   CONFIGURATION
   ============================================================
   Replace the URL below with your deployed Google Apps Script
   Web App URL after deployment (Deploy > New deployment >
   Web app > Execute as: Me > Who has access: Anyone).
   ============================================================ */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwlns_i4TtpDHWy3P4PnHvjbDF6SwBnbMVH7fW_fmvipYCvAIQPxAvDLYKBbtCq0IY/exec';

const DRAFT_STORAGE_KEY = 'cr_work_entry_draft';
const THEME_STORAGE_KEY = 'cr_theme_preference';
const MAX_REMARK_LENGTH = 500;

/* Vehicle number: alphanumeric, optional hyphens/spaces, 4–20 chars */
const VEHICLE_REGEX = /^[A-Z0-9][A-Z0-9\s\-]{2,18}[A-Z0-9]$/i;

/* ============================================================
   DOM REFERENCES
   ============================================================ */
const form = document.getElementById('workEntryForm');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const progressBar = document.getElementById('progressBar');
const toastContainer = document.getElementById('toastContainer');
const successModal = document.getElementById('successModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const generatedTicketIdEl = document.getElementById('generatedTicketId');
const themeToggle = document.getElementById('themeToggle');
const liveDateTime = document.getElementById('liveDateTime');
const footerYear = document.getElementById('footerYear');
const remarkField = document.getElementById('remark');
const remarkCounter = document.getElementById('remarkCounter');
const vehicleNumberField = document.getElementById('vehicleNumber');
const attachmentInput = document.getElementById('attachment');
const fileUploadArea = document.getElementById('fileUploadArea');
const attachmentNameEl = document.getElementById('attachmentName');
const removeFileBtn = document.getElementById('removeFileBtn');

const fields = {
  employeeName: document.getElementById('employeeName'),
  employeeId: document.getElementById('employeeId'),
  workType: document.getElementById('workType'),
  vehicleNumber: vehicleNumberField,
  driverName: document.getElementById('driverName'),
  route: document.getElementById('route'),
  taskPriority: document.getElementById('taskPriority'),
  taskStatus: document.getElementById('taskStatus'),
  taskDate: document.getElementById('taskDate'),
  taskTime: document.getElementById('taskTime'),
  remark: remarkField
};

/* ============================================================
   INITIALIZATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLiveClock();
  initDateTimeDefaults();
  initRemarkCounter();
  initVehicleUppercase();
  initFileUpload();
  initRippleEffect();
  initKeyboardShortcuts();
  restoreDraft();
  initFormListeners();
  footerYear.textContent = new Date().getFullYear();
});

/* ============================================================
   THEME (Dark Mode)
   ============================================================ */
function initTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (saved === 'light') {
    document.documentElement.removeAttribute('data-theme');
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    }
  });
}

/* ============================================================
   LIVE CLOCK
   ============================================================ */
function initLiveClock() {
  const update = () => {
    const now = new Date();
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    liveDateTime.textContent = now.toLocaleString('en-IN', options);
  };
  update();
  setInterval(update, 1000);
}

/* ============================================================
   DEFAULT DATE & TIME
   ============================================================ */
function initDateTimeDefaults() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');

  fields.taskDate.value = `${yyyy}-${mm}-${dd}`;
  fields.taskTime.value = `${hh}:${min}`;
}

/* ============================================================
   REMARK CHARACTER COUNTER
   ============================================================ */
function initRemarkCounter() {
  const update = () => {
    const len = remarkField.value.length;
    remarkCounter.textContent = `${len} / ${MAX_REMARK_LENGTH}`;
    remarkCounter.classList.remove('warning', 'danger');
    if (len >= MAX_REMARK_LENGTH) {
      remarkCounter.classList.add('danger');
    } else if (len >= MAX_REMARK_LENGTH * 0.85) {
      remarkCounter.classList.add('warning');
    }
  };
  remarkField.addEventListener('input', update);
  update();
}

/* ============================================================
   VEHICLE NUMBER AUTO-UPPERCASE
   ============================================================ */
function initVehicleUppercase() {
  vehicleNumberField.addEventListener('input', () => {
    const start = vehicleNumberField.selectionStart;
    const end = vehicleNumberField.selectionEnd;
    vehicleNumberField.value = vehicleNumberField.value.toUpperCase();
    vehicleNumberField.setSelectionRange(start, end);
  });
}

/* ============================================================
   FILE UPLOAD
   ============================================================ */
function initFileUpload() {
  attachmentInput.addEventListener('change', handleFileSelect);

  fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('drag-over');
  });

  fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('drag-over');
  });

  fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      attachmentInput.files = e.dataTransfer.files;
      handleFileSelect();
    }
  });

  removeFileBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearFile();
  });
}

function handleFileSelect() {
  const file = attachmentInput.files[0];
  if (file) {
    attachmentNameEl.textContent = file.name;
    fileUploadArea.classList.add('has-file');
    removeFileBtn.hidden = false;
  } else {
    clearFile();
  }
}

function clearFile() {
  attachmentInput.value = '';
  attachmentNameEl.textContent = '';
  fileUploadArea.classList.remove('has-file');
  removeFileBtn.hidden = true;
}

/* ============================================================
   RIPPLE EFFECT ON BUTTONS
   ============================================================ */
function initRippleEffect() {
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

/* ============================================================
   KEYBOARD SHORTCUTS
   ============================================================ */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!submitBtn.disabled) {
        form.requestSubmit();
      }
    }
  });
}

/* ============================================================
   DRAFT AUTO-SAVE / RESTORE (LocalStorage)
   ============================================================ */
function initFormListeners() {
  const draftFields = [
    'employeeName', 'employeeId', 'workType', 'vehicleNumber',
    'driverName', 'route', 'taskPriority', 'taskStatus',
    'taskDate', 'taskTime', 'remark'
  ];

  draftFields.forEach((name) => {
    const el = fields[name];
    if (!el) return;
    el.addEventListener('input', debounce(saveDraft, 400));
    el.addEventListener('change', saveDraft);
  });

  form.addEventListener('submit', handleSubmit);
  resetBtn.addEventListener('click', handleReset);
  closeModalBtn.addEventListener('click', closeSuccessModal);
  successModal.querySelector('.modal-overlay').addEventListener('click', closeSuccessModal);
}

function saveDraft() {
  const data = {
    employeeName: fields.employeeName.value,
    employeeId: fields.employeeId.value,
    workType: fields.workType.value,
    vehicleNumber: fields.vehicleNumber.value,
    driverName: fields.driverName.value,
    route: fields.route.value,
    taskPriority: fields.taskPriority.value,
    taskStatus: fields.taskStatus.value,
    taskDate: fields.taskDate.value,
    taskTime: fields.taskTime.value,
    remark: fields.remark.value
  };
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Could not save draft:', err);
  }
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.keys(data).forEach((key) => {
      if (fields[key] && data[key]) {
        fields[key].value = data[key];
      }
    });
    // Trigger floating label / counter updates
    if (fields.remark.value) {
      remarkCounter.textContent = `${fields.remark.value.length} / ${MAX_REMARK_LENGTH}`;
    }
    showToast('info', 'Draft Restored', 'Your previous form data has been restored.');
  } catch (err) {
    console.warn('Could not restore draft:', err);
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (err) {
    /* ignore */
  }
}

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ============================================================
   VALIDATION
   ============================================================ */
function clearErrors() {
  document.querySelectorAll('.error-message').forEach((el) => {
    el.textContent = '';
    el.classList.remove('visible');
  });
  document.querySelectorAll('.input-wrapper.has-error').forEach((el) => {
    el.classList.remove('has-error');
  });
}

function showFieldError(fieldId, message) {
  const errorEl = document.getElementById(`${fieldId}Error`);
  const wrapper = fields[fieldId] ? fields[fieldId].closest('.input-wrapper') : null;
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
  if (wrapper) {
    wrapper.classList.add('has-error');
  }
}

function validateForm() {
  clearErrors();
  let isValid = true;

  // Employee Name - required, non-empty
  const name = fields.employeeName.value.trim();
  if (!name) {
    showFieldError('employeeName', 'Employee name is required.');
    isValid = false;
  } else if (name.length < 2) {
    showFieldError('employeeName', 'Name must be at least 2 characters.');
    isValid = false;
  }

  // Work Type - required
  if (!fields.workType.value) {
    showFieldError('workType', 'Please select a work type.');
    isValid = false;
  }

  // Task Priority - required
  if (!fields.taskPriority.value) {
    showFieldError('taskPriority', 'Please select a priority.');
    isValid = false;
  }

  // Task Status - required
  if (!fields.taskStatus.value) {
    showFieldError('taskStatus', 'Please select a status.');
    isValid = false;
  }

  // Date - required
  if (!fields.taskDate.value) {
    showFieldError('taskDate', 'Date is required.');
    isValid = false;
  }

  // Time - required
  if (!fields.taskTime.value) {
    showFieldError('taskTime', 'Time is required.');
    isValid = false;
  }

  // Vehicle Number - format check if provided
  const vehicle = fields.vehicleNumber.value.trim();
  if (vehicle && !VEHICLE_REGEX.test(vehicle)) {
    showFieldError('vehicleNumber', 'Invalid vehicle number format (e.g. MH12AB1234).');
    isValid = false;
  }

  // Remark - max length
  if (fields.remark.value.length > MAX_REMARK_LENGTH) {
    showFieldError('remark', `Remark cannot exceed ${MAX_REMARK_LENGTH} characters.`);
    isValid = false;
  }

  return isValid;
}

/* ============================================================
   FORM SUBMIT
   ============================================================ */
async function handleSubmit(e) {
  e.preventDefault();

  if (!validateForm()) {
    showToast('error', 'Validation Error', 'Please fix the highlighted fields.');
    const firstError = document.querySelector('.input-wrapper.has-error input, .input-wrapper.has-error select, .input-wrapper.has-error textarea');
    if (firstError) firstError.focus();
    return;
  }

  if (APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
    showToast('error', 'Configuration Required', 'Please set your Google Apps Script Web App URL in script.js.');
    return;
  }

  setLoading(true);

  const payload = {
    employeeName: fields.employeeName.value.trim(),
    employeeId: fields.employeeId.value.trim(),
    workType: fields.workType.value,
    vehicleNumber: fields.vehicleNumber.value.trim().toUpperCase(),
    driverName: fields.driverName.value.trim(),
    route: fields.route.value.trim(),
    priority: fields.taskPriority.value,
    status: fields.taskStatus.value,
    date: fields.taskDate.value,
    time: fields.taskTime.value,
    remark: fields.remark.value.trim(),
    attachmentName: attachmentInput.files[0] ? attachmentInput.files[0].name : ''
  };

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      clearDraft();
      showSuccessModal(result.ticketId);
      resetFormFields();
      showToast('success', 'Success', `Ticket ${result.ticketId} created.`);
    } else {
      throw new Error(result.message || 'Unknown server error.');
    }
  } catch (err) {
    console.error('Submit error:', err);
    const msg = err.message.includes('Failed to fetch') || err.message.includes('NetworkError')
      ? 'Network error. Please check your connection and Apps Script URL.'
      : err.message;
    showToast('error', 'Submission Failed', msg);
  } finally {
    setLoading(false);
  }
}

/* ============================================================
   LOADING STATE
   ============================================================ */
function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  resetBtn.disabled = isLoading;

  const content = submitBtn.querySelector('.btn-content');
  const spinner = submitBtn.querySelector('.btn-spinner');

  if (isLoading) {
    content.hidden = true;
    spinner.hidden = false;
    progressBar.style.width = '70%';
    progressBar.classList.add('active');
  } else {
    content.hidden = false;
    spinner.hidden = true;
    progressBar.style.width = '100%';
    setTimeout(() => {
      progressBar.style.width = '0%';
      progressBar.classList.remove('active');
    }, 400);
  }
}

/* ============================================================
   SUCCESS MODAL
   ============================================================ */
function showSuccessModal(ticketId) {
  generatedTicketIdEl.textContent = ticketId;
  successModal.classList.add('open');
  successModal.setAttribute('aria-hidden', 'false');
  closeModalBtn.focus();
}

function closeSuccessModal() {
  successModal.classList.remove('open');
  successModal.setAttribute('aria-hidden', 'true');
}

/* ============================================================
   RESET
   ============================================================ */
function handleReset() {
  resetFormFields();
  clearDraft();
  clearErrors();
  showToast('info', 'Form Reset', 'All fields have been cleared.');
}

function resetFormFields() {
  form.reset();
  clearFile();
  initDateTimeDefaults();
  remarkCounter.textContent = `0 / ${MAX_REMARK_LENGTH}`;
  remarkCounter.classList.remove('warning', 'danger');
  clearErrors();
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
function showToast(type, title, message, duration = 4500) {
  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span class="material-icons-outlined toast-icon">${icons[type] || 'info'}</span>
    <div class="toast-body">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
    <button type="button" class="toast-close" aria-label="Dismiss">
      <span class="material-icons-outlined">close</span>
    </button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast));

  toastContainer.appendChild(toast);

  const timer = setTimeout(() => removeToast(toast), duration);
  toast._timer = timer;
}

function removeToast(toast) {
  if (toast._timer) clearTimeout(toast._timer);
  toast.classList.add('removing');
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 300);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}