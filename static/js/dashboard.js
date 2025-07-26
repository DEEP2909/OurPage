// Dashboard JavaScript
class RomanticDashboard {
    constructor() {
        this.specialDates = []; // Will be loaded from API
        
        this.backgroundImages = [
            'https://images.unsplash.com/photo-1518199266791-5375a83190b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
            'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        ];
        
        this.currentImageIndex = 0;
        this.weatherApiKey = this.getApiKey();
        
        this.init();
    }
    
    getApiKey() {
        // Get API key from global variable set by Flask template
        return window.WEATHER_API_KEY || '';
    }
    
    init() {
        this.updateTime();
        this.updateGreeting();
        this.loadWeather();
        this.loadSpecialDates();
        this.loadTasks();
        this.setupEventListeners();
        this.setBackground();
        
        // Set up intervals
        setInterval(() => this.updateTime(), 1000);
        setInterval(() => this.updateCountdown(), 1000);
        setInterval(() => this.updateGreeting(), 60000); // Update greeting every minute
    }
    
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        document.getElementById('current-time').textContent = `${timeString} • ${dateString}`;
    }
    
    updateGreeting() {
        const now = new Date();
        const hour = now.getHours();
        let greeting;
        
        if (hour >= 5 && hour < 12) {
            greeting = 'Good Morning, Prachi!';
        } else if (hour >= 12 && hour < 17) {
            greeting = 'Good Afternoon, Prachi!';
        } else if (hour >= 17 && hour < 22) {
            greeting = 'Good Evening, Prachi!';
        } else {
            greeting = 'Good Night, Prachi!';
        }
        
        document.getElementById('greeting').innerHTML = `
            <i class="fas fa-heart text-pink me-2"></i>
            ${greeting}
            <i class="fas fa-heart text-pink ms-2"></i>
        `;
    }
    
    async loadWeather() {
        try {
            console.log('Loading weather with Open-Meteo API...');
            
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;
            
            console.log('Position obtained:', { latitude, longitude });
            
            // Use Open-Meteo API - completely free, no API key needed
            const currentWeatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
            
            console.log('Making API request to Open-Meteo...');
            
            const weatherResponse = await fetch(currentWeatherUrl);
            
            if (!weatherResponse.ok) {
                throw new Error(`Weather API request failed: ${weatherResponse.status}`);
            }
            
            const weatherData = await weatherResponse.json();
            
            // Get location name using browser's built-in reverse geocoding
            let locationName = `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
            
            try {
                // Try to get a more friendly location name using a simple approach
                const locationResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                if (locationResponse.ok) {
                    const locationData = await locationResponse.json();
                    locationName = locationData.city || locationData.locality || locationData.principalSubdivision || locationName;
                }
            } catch (e) {
                console.log('Could not get location name, using coordinates');
            }
            
            console.log('Weather data received:', weatherData);
            this.displayOpenMeteoWeather(weatherData, locationName);
            
        } catch (error) {
            console.error('Weather loading error:', error);
            let errorMessage = 'Unable to load weather';
            
            if (error.message.includes('User denied Geolocation')) {
                errorMessage = 'Location access denied. Please allow location access and try again.';
            } else if (error.message.includes('Position unavailable')) {
                errorMessage = 'Location unavailable. Please check your device settings.';
            } else if (error.message.includes('Timeout')) {
                errorMessage = 'Location request timed out. Trying default location...';
                // Try with a default location (New Delhi) as fallback
                this.loadWeatherForLocation(28.6139, 77.2090, 'New Delhi, India');
                return;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showWeatherError(errorMessage);
        }
    }
    
    async loadWeatherForLocation(latitude, longitude, locationName) {
        try {
            console.log(`Loading weather for ${locationName}...`);
            
            const currentWeatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
            
            const weatherResponse = await fetch(currentWeatherUrl);
            
            if (!weatherResponse.ok) {
                throw new Error(`Weather API request failed: ${weatherResponse.status}`);
            }
            
            const weatherData = await weatherResponse.json();
            console.log('Fallback weather data received:', weatherData);
            this.displayOpenMeteoWeather(weatherData, locationName);
            
        } catch (error) {
            console.error('Fallback weather loading error:', error);
            this.showWeatherError('Unable to load weather data');
        }
    }
    
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            // First try with high accuracy but longer timeout
            navigator.geolocation.getCurrentPosition(
                resolve, 
                (error) => {
                    console.log('High accuracy failed, trying with lower accuracy:', error);
                    // If high accuracy fails, try with lower accuracy and faster timeout
                    navigator.geolocation.getCurrentPosition(
                        resolve,
                        reject,
                        {
                            enableHighAccuracy: false,
                            timeout: 15000,
                            maximumAge: 600000 // 10 minutes
                        }
                    );
                }, 
                {
                    enableHighAccuracy: true,
                    timeout: 8000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }
    
    displayWeather(data) {
        const weatherIcon = this.getWeatherIcon(data.weather[0].main);
        
        document.getElementById('weather-icon').className = `fas ${weatherIcon} fa-2x`;
        document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
        document.getElementById('description').textContent = data.weather[0].description;
        document.getElementById('location').textContent = data.name;
        
        document.getElementById('weather-loading').classList.add('d-none');
        document.getElementById('weather-data').classList.remove('d-none');
    }
    
    displayOpenMeteoWeather(data, locationName) {
        const current = data.current;
        const weatherCode = current.weather_code;
        const temperature = Math.round(current.temperature_2m);
        
        const { icon, description } = this.getOpenMeteoWeatherInfo(weatherCode);
        
        document.getElementById('weather-icon').className = `fas ${icon} fa-2x`;
        document.getElementById('temperature').textContent = `${temperature}°C`;
        document.getElementById('description').textContent = description;
        document.getElementById('location').textContent = locationName;
        
        document.getElementById('weather-loading').classList.add('d-none');
        document.getElementById('weather-data').classList.remove('d-none');
    }
    
    showWeatherError(errorMessage = 'Unable to load weather') {
        document.getElementById('weather-loading').classList.add('d-none');
        document.getElementById('weather-error').classList.remove('d-none');
        
        // Update error message with more details if available
        const errorElement = document.querySelector('#weather-error p');
        if (errorElement && errorMessage) {
            errorElement.textContent = errorMessage;
        }
    }
    
    getWeatherIcon(weatherMain) {
        const icons = {
            'Clear': 'fa-sun',
            'Clouds': 'fa-cloud',
            'Rain': 'fa-cloud-rain',
            'Drizzle': 'fa-cloud-drizzle',
            'Thunderstorm': 'fa-cloud-bolt',
            'Snow': 'fa-snowflake',
            'Mist': 'fa-smog',
            'Fog': 'fa-smog'
        };
        
        return icons[weatherMain] || 'fa-cloud';
    }
    
    getOpenMeteoWeatherInfo(weatherCode) {
        // Open-Meteo weather codes mapping
        const weatherCodes = {
            0: { icon: 'fa-sun', description: 'Clear sky' },
            1: { icon: 'fa-sun', description: 'Mainly clear' },
            2: { icon: 'fa-cloud-sun', description: 'Partly cloudy' },
            3: { icon: 'fa-cloud', description: 'Overcast' },
            45: { icon: 'fa-smog', description: 'Fog' },
            48: { icon: 'fa-smog', description: 'Depositing rime fog' },
            51: { icon: 'fa-cloud-drizzle', description: 'Light drizzle' },
            53: { icon: 'fa-cloud-drizzle', description: 'Moderate drizzle' },
            55: { icon: 'fa-cloud-drizzle', description: 'Dense drizzle' },
            56: { icon: 'fa-cloud-drizzle', description: 'Light freezing drizzle' },
            57: { icon: 'fa-cloud-drizzle', description: 'Dense freezing drizzle' },
            61: { icon: 'fa-cloud-rain', description: 'Slight rain' },
            63: { icon: 'fa-cloud-rain', description: 'Moderate rain' },
            65: { icon: 'fa-cloud-rain', description: 'Heavy rain' },
            66: { icon: 'fa-cloud-rain', description: 'Light freezing rain' },
            67: { icon: 'fa-cloud-rain', description: 'Heavy freezing rain' },
            71: { icon: 'fa-snowflake', description: 'Slight snow fall' },
            73: { icon: 'fa-snowflake', description: 'Moderate snow fall' },
            75: { icon: 'fa-snowflake', description: 'Heavy snow fall' },
            77: { icon: 'fa-snowflake', description: 'Snow grains' },
            80: { icon: 'fa-cloud-rain', description: 'Slight rain showers' },
            81: { icon: 'fa-cloud-rain', description: 'Moderate rain showers' },
            82: { icon: 'fa-cloud-rain', description: 'Violent rain showers' },
            85: { icon: 'fa-snowflake', description: 'Slight snow showers' },
            86: { icon: 'fa-snowflake', description: 'Heavy snow showers' },
            95: { icon: 'fa-cloud-bolt', description: 'Thunderstorm' },
            96: { icon: 'fa-cloud-bolt', description: 'Thunderstorm with slight hail' },
            99: { icon: 'fa-cloud-bolt', description: 'Thunderstorm with heavy hail' }
        };
        
        return weatherCodes[weatherCode] || { icon: 'fa-cloud', description: 'Unknown weather' };
    }
    
    updateCountdown() {
        const nextEvent = this.getNextSpecialDate();
        if (!nextEvent) return;
        
        const now = new Date();
        const timeDiff = nextEvent.date - now;
        
        if (timeDiff <= 0) {
            // Event has passed, get next one
            setTimeout(() => this.updateCountdown(), 1000);
            return;
        }
        
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = days;
        document.getElementById('hours').textContent = hours;
        document.getElementById('minutes').textContent = minutes;
        document.getElementById('seconds').textContent = seconds;
        
        document.getElementById('countdown-event-name').textContent = nextEvent.name;
        document.getElementById('countdown-date').textContent = nextEvent.date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    getNextSpecialDate() {
        const now = new Date();
        const currentYear = now.getFullYear();
        
        let nearestEvent = null;
        let nearestDiff = Infinity;
        
        this.specialDates.forEach(event => {
            // Calculate this year's date
            let eventDate = new Date(currentYear, event.month - 1, event.day);
            
            // If this year's date has passed, use next year
            if (eventDate < now) {
                eventDate = new Date(currentYear + 1, event.month - 1, event.day);
            }
            
            const diff = eventDate - now;
            
            if (diff < nearestDiff) {
                nearestDiff = diff;
                nearestEvent = {
                    ...event,
                    date: eventDate,
                    yearsAgo: eventDate.getFullYear() - event.year
                };
            }
        });
        
        return nearestEvent;
    }
    
    // Special Dates Management Functions
    async loadSpecialDates() {
        try {
            // For now, use hardcoded special dates until backend API is implemented
            this.specialDates = [
                { id: 1, name: "First Talk Anniversary", month: 9, day: 22, year: 2023, is_custom: false },
                { id: 2, name: "Prachi's Birthday", month: 1, day: 6, year: 2004, is_custom: false },
                { id: 3, name: "Deep's Birthday", month: 9, day: 29, year: 2004, is_custom: false },
                { id: 4, name: "Expressed Feelings Anniversary", month: 11, day: 8, year: 2023, is_custom: false },
                { id: 5, name: "Proposal Day Anniversary", month: 11, day: 24, year: 2023, is_custom: false },
                { id: 6, name: "First Met Anniversary", month: 11, day: 15, year: 2023, is_custom: false },
                { id: 7, name: "First Kiss Anniversary", month: 5, day: 5, year: 2024, is_custom: false }
            ];
            this.updateCountdown(); // Update countdown with new dates
        } catch (error) {
            console.error('Error loading special dates:', error);
        }
    }
    
    async addSpecialDate(name, month, day, year) {
        try {
            // For now, add to local array (temporary until backend API is implemented)
            const newId = Math.max(...this.specialDates.map(d => d.id), 0) + 1;
            const newDate = { id: newId, name, month, day, year, is_custom: true };
            
            this.specialDates.push(newDate);
            this.updateCountdown();
            this.renderDatesList();
            this.showMessage('Special date added successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Error adding special date:', error);
            this.showMessage('Failed to add date. Please try again.', 'error');
            return false;
        }
    }
    
    async updateSpecialDate(id, name, month, day, year) {
        try {
            // For now, update in local array (temporary until backend API is implemented)
            const dateIndex = this.specialDates.findIndex(d => d.id === id);
            if (dateIndex !== -1) {
                this.specialDates[dateIndex] = { id, name, month, day, year, is_custom: true };
                this.updateCountdown();
                this.renderDatesList();
                this.showMessage('Date updated successfully!', 'success');
                return true;
            } else {
                throw new Error('Date not found');
            }
        } catch (error) {
            console.error('Error updating special date:', error);
            this.showMessage('Failed to update date. Please try again.', 'error');
            return false;
        }
    }
    
    async deleteSpecialDate(id) {
        try {
            // For now, remove from local array (temporary until backend API is implemented)
            const dateIndex = this.specialDates.findIndex(d => d.id === id);
            if (dateIndex !== -1) {
                // Only allow deleting custom dates
                if (this.specialDates[dateIndex].is_custom) {
                    this.specialDates.splice(dateIndex, 1);
                    this.updateCountdown();
                    this.renderDatesList();
                    this.showMessage('Date deleted successfully!', 'success');
                    return true;
                } else {
                    throw new Error('Cannot delete default dates');
                }
            } else {
                throw new Error('Date not found');
            }
        } catch (error) {
            console.error('Error deleting special date:', error);
            this.showMessage(error.message, 'error');
            return false;
        }
    }
    
    renderDatesList() {
        const datesList = document.getElementById('dates-list');
        if (!datesList) return;
        
        if (this.specialDates.length === 0) {
            datesList.innerHTML = '<p class="text-muted text-center">No special dates added yet.</p>';
            return;
        }
        
        // Sort dates by next occurrence
        const sortedDates = [...this.specialDates].sort((a, b) => {
            const nextA = this.getNextOccurrence(a);
            const nextB = this.getNextOccurrence(b);
            return nextA - nextB;
        });
        
        datesList.innerHTML = sortedDates.map(date => {
            const nextOccurrence = this.getNextOccurrence(date);
            const daysUntil = Math.ceil((nextOccurrence - new Date()) / (1000 * 60 * 60 * 24));
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            return `
                <div class="date-item mb-3 p-3 border rounded glass-card">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="date-info">
                            <h6 class="mb-1 text-light">${this.escapeHtml(date.name)}</h6>
                            <small class="text-muted">
                                ${monthNames[date.month - 1]} ${date.day}, ${date.year} 
                                • Next in ${daysUntil} days
                            </small>
                        </div>
                        <div class="date-actions">
                            ${date.is_custom ? `
                                <button class="btn btn-outline-light btn-sm me-1" onclick="dashboard.editDate(${date.id})" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm" onclick="dashboard.confirmDeleteDate(${date.id})" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : `
                                <small class="text-muted">Default date</small>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    getNextOccurrence(date) {
        const now = new Date();
        const currentYear = now.getFullYear();
        let nextDate = new Date(currentYear, date.month - 1, date.day);
        
        if (nextDate < now) {
            nextDate = new Date(currentYear + 1, date.month - 1, date.day);
        }
        
        return nextDate;
    }
    
    editDate(id) {
        const date = this.specialDates.find(d => d.id === id);
        if (!date) return;
        
        // Fill the form with current values
        document.getElementById('new-date-name').value = date.name;
        document.getElementById('new-date-month').value = date.month;
        document.getElementById('new-date-day').value = date.day;
        document.getElementById('new-date-year').value = date.year;
        
        // Change the add button to update button
        const addBtn = document.getElementById('add-date-btn');
        addBtn.innerHTML = '<i class="fas fa-save me-1"></i>Update Date';
        addBtn.onclick = () => this.updateDateFromForm(id);
    }
    
    async updateDateFromForm(id) {
        const name = document.getElementById('new-date-name').value.trim();
        const month = parseInt(document.getElementById('new-date-month').value);
        const day = parseInt(document.getElementById('new-date-day').value);
        const year = parseInt(document.getElementById('new-date-year').value);
        
        if (!name || !month || !day || !year) {
            this.showMessage('Please fill in all fields.', 'error');
            return;
        }
        
        const success = await this.updateSpecialDate(id, name, month, day, year);
        if (success) {
            this.resetDateForm();
        }
    }
    
    async confirmDeleteDate(id) {
        if (confirm('Are you sure you want to delete this special date?')) {
            await this.deleteSpecialDate(id);
        }
    }
    
    resetDateForm() {
        document.getElementById('new-date-name').value = '';
        document.getElementById('new-date-month').value = '';
        document.getElementById('new-date-day').value = '';
        document.getElementById('new-date-year').value = '';
        
        const addBtn = document.getElementById('add-date-btn');
        addBtn.innerHTML = '<i class="fas fa-plus me-1"></i>Add Date';
        addBtn.onclick = null;
    }
    
    // To-Do List Functions
    loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('prachi-tasks') || '[]');
        this.renderTasks(tasks);
    }
    
    saveTasks(tasks) {
        localStorage.setItem('prachi-tasks', JSON.stringify(tasks));
    }
    
    renderTasks(tasks) {
        const taskList = document.getElementById('task-list');
        const emptyState = document.getElementById('empty-state');
        
        if (tasks.length === 0) {
            emptyState.classList.remove('d-none');
            taskList.innerHTML = emptyState.outerHTML;
            return;
        }
        
        taskList.innerHTML = tasks.map((task, index) => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-index="${index}">
                <div class="task-text">${this.escapeHtml(task.text)}</div>
                <div class="task-actions">
                    <button onclick="dashboard.toggleTask(${index})" title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
                        <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button onclick="dashboard.deleteTask(${index})" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    addTask(text) {
        if (!text.trim()) return;
        
        const tasks = JSON.parse(localStorage.getItem('prachi-tasks') || '[]');
        tasks.push({
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        });
        
        this.saveTasks(tasks);
        this.renderTasks(tasks);
        
        // Clear input
        document.getElementById('new-task').value = '';
    }
    
    toggleTask(index) {
        const tasks = JSON.parse(localStorage.getItem('prachi-tasks') || '[]');
        if (tasks[index]) {
            tasks[index].completed = !tasks[index].completed;
            this.saveTasks(tasks);
            this.renderTasks(tasks);
        }
    }
    
    deleteTask(index) {
        const tasks = JSON.parse(localStorage.getItem('prachi-tasks') || '[]');
        tasks.splice(index, 1);
        this.saveTasks(tasks);
        this.renderTasks(tasks);
    }
    
    // Photo Management
    setBackground() {
        const savedImages = JSON.parse(localStorage.getItem('prachi-bg-images') || '[]');
        const allImages = [...savedImages, ...this.backgroundImages];
        
        if (allImages.length > 0) {
            const savedIndex = localStorage.getItem('prachi-current-bg') || 0;
            this.currentImageIndex = parseInt(savedIndex) % allImages.length;
            const imageUrl = allImages[this.currentImageIndex];
            
            const bg = document.getElementById('background-container');
            bg.style.backgroundImage = `url('${imageUrl}')`;
            
            this.updatePhotoCounter();
        }
    }
    
    updatePhotoCounter() {
        const savedImages = JSON.parse(localStorage.getItem('prachi-bg-images') || '[]');
        const allImages = [...savedImages, ...this.backgroundImages];
        
        const photoIndex = document.getElementById('photo-index');
        const photoTotal = document.getElementById('photo-total');
        
        if (photoIndex && photoTotal) {
            photoIndex.textContent = this.currentImageIndex + 1;
            photoTotal.textContent = allImages.length;
        }
    }
    
    nextBackground() {
        const savedImages = JSON.parse(localStorage.getItem('prachi-bg-images') || '[]');
        const allImages = [...savedImages, ...this.backgroundImages];
        
        this.currentImageIndex = (this.currentImageIndex + 1) % allImages.length;
        localStorage.setItem('prachi-current-bg', this.currentImageIndex);
        
        const bg = document.getElementById('background-container');
        bg.style.backgroundImage = `url('${allImages[this.currentImageIndex]}')`;
        this.updatePhotoCounter();
    }
    
    prevBackground() {
        const savedImages = JSON.parse(localStorage.getItem('prachi-bg-images') || '[]');
        const allImages = [...savedImages, ...this.backgroundImages];
        
        this.currentImageIndex = this.currentImageIndex === 0 ? allImages.length - 1 : this.currentImageIndex - 1;
        localStorage.setItem('prachi-current-bg', this.currentImageIndex);
        
        const bg = document.getElementById('background-container');
        bg.style.backgroundImage = `url('${allImages[this.currentImageIndex]}')`;
        this.updatePhotoCounter();
    }
    
    deleteCurrentPhoto() {
        const savedImages = JSON.parse(localStorage.getItem('prachi-bg-images') || '[]');
        const allImages = [...savedImages, ...this.backgroundImages];
        
        if (allImages.length <= 1) {
            this.showMessage('Cannot delete the last photo!', 'error');
            return;
        }
        
        // Check if current photo is a custom uploaded photo (in savedImages)
        if (this.currentImageIndex < savedImages.length) {
            // Remove from saved images
            savedImages.splice(this.currentImageIndex, 1);
            localStorage.setItem('prachi-bg-images', JSON.stringify(savedImages));
            
            // Adjust current index if needed
            const newAllImages = [...savedImages, ...this.backgroundImages];
            if (this.currentImageIndex >= newAllImages.length) {
                this.currentImageIndex = 0;
            }
            
            localStorage.setItem('prachi-current-bg', this.currentImageIndex);
            
            // Update background
            const bg = document.getElementById('background-container');
            bg.style.backgroundImage = `url('${newAllImages[this.currentImageIndex]}')`;
            this.updatePhotoCounter();
            
            this.showMessage('Photo deleted successfully!', 'success');
        } else {
            this.showMessage('Cannot delete default photos. Only uploaded photos can be deleted.', 'error');
        }
    }
    
    uploadPhoto(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            const savedImages = JSON.parse(localStorage.getItem('prachi-bg-images') || '[]');
            savedImages.push(imageUrl);
            localStorage.setItem('prachi-bg-images', JSON.stringify(savedImages));
            
            // Set as current background
            const allImages = [...savedImages, ...this.backgroundImages];
            this.currentImageIndex = savedImages.length - 1;
            localStorage.setItem('prachi-current-bg', this.currentImageIndex);
            
            const bg = document.getElementById('background-container');
            bg.style.backgroundImage = `url('${imageUrl}')`;
            this.updatePhotoCounter();
            
            this.showMessage('Photo uploaded successfully!', 'success');
        };
        reader.readAsDataURL(file);
    }
    
    // Event Listeners
    setupEventListeners() {
        // Task management
        document.getElementById('add-task').addEventListener('click', () => {
            const taskText = document.getElementById('new-task').value;
            this.addTask(taskText);
        });
        
        document.getElementById('new-task').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const taskText = e.target.value;
                this.addTask(taskText);
            }
        });
        
        // Photo management
        document.getElementById('upload-btn').addEventListener('click', () => {
            document.getElementById('photo-upload').click();
        });
        
        document.getElementById('photo-upload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.uploadPhoto(file);
            }
        });
        
        document.getElementById('next-photo').addEventListener('click', () => {
            this.nextBackground();
        });
        
        document.getElementById('prev-photo').addEventListener('click', () => {
            this.prevBackground();
        });
        
        // Photo delete button
        document.getElementById('delete-photo').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this background photo?')) {
                this.deleteCurrentPhoto();
            }
        });
        
        // Weather retry button
        document.getElementById('retry-weather').addEventListener('click', () => {
            document.getElementById('weather-error').classList.add('d-none');
            document.getElementById('weather-loading').classList.remove('d-none');
            this.loadWeather();
        });
        
        // Special dates management
        document.getElementById('manage-dates-btn').addEventListener('click', () => {
            this.renderDatesList();
            const modal = new bootstrap.Modal(document.getElementById('datesModal'));
            modal.show();
        });
        
        document.getElementById('add-date-btn').addEventListener('click', async () => {
            const name = document.getElementById('new-date-name').value.trim();
            const month = parseInt(document.getElementById('new-date-month').value);
            const day = parseInt(document.getElementById('new-date-day').value);
            const year = parseInt(document.getElementById('new-date-year').value);
            
            if (!name || !month || !day || !year) {
                this.showMessage('Please fill in all fields.', 'error');
                return;
            }
            
            const success = await this.addSpecialDate(name, month, day, year);
            if (success) {
                this.resetDateForm();
            }
        });
    }
    
    // Utility Functions
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    showMessage(message, type = 'info') {
        // Create a simple toast message
        const toast = document.createElement('div');
        toast.className = `alert alert-custom alert-${type} position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
                ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new RomanticDashboard();
});

// Make functions globally available for inline event handlers
window.toggleTask = (index) => window.dashboard.toggleTask(index);
window.deleteTask = (index) => window.dashboard.deleteTask(index);
