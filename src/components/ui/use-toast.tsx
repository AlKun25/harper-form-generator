// A lightweight toast notification system 

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

// Global notification state
let activeToast: HTMLElement | null = null;
let timeoutId: NodeJS.Timeout | null = null;

export const toast = (options: ToastOptions) => {
  const { 
    title, 
    description, 
    duration = 5000, 
    type = 'default' 
  } = options;

  // Clear any existing toast
  if (activeToast) {
    document.body.removeChild(activeToast);
    if (timeoutId) clearTimeout(timeoutId);
  }

  // Create toast element
  const toastEl = document.createElement('div');
  toastEl.className = `fixed top-4 right-4 max-w-md p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out transform translate-y-0 opacity-100 
    ${type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 
      type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
      type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
      type === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-800' :
      'bg-white border border-gray-200 text-gray-800'}`;

  // Create content
  const titleEl = document.createElement('h3');
  titleEl.className = 'font-medium text-sm';
  titleEl.textContent = title;
  toastEl.appendChild(titleEl);

  if (description) {
    const descEl = document.createElement('div');
    descEl.className = 'mt-1 text-sm opacity-90';
    descEl.textContent = description;
    toastEl.appendChild(descEl);
  }

  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'absolute top-2 right-2 text-gray-400 hover:text-gray-600';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = () => {
    hideToast();
  };
  toastEl.appendChild(closeBtn);

  // Add to DOM
  document.body.appendChild(toastEl);
  activeToast = toastEl;

  // Auto-dismiss
  timeoutId = setTimeout(() => {
    hideToast();
  }, duration);

  // Hide animation function
  function hideToast() {
    if (!activeToast) return;
    
    // Add exit animation classes
    activeToast.classList.add('translate-y-2', 'opacity-0');
    
    // Remove element after animation
    setTimeout(() => {
      if (activeToast && document.body.contains(activeToast)) {
        document.body.removeChild(activeToast);
        activeToast = null;
      }
    }, 300);
    
    // Clear timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  // Return control functions
  return {
    dismiss: hideToast
  };
}; 