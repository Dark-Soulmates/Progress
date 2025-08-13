document.addEventListener('DOMContentLoaded', function() {
    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Check for saved theme preference or use preferred color scheme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        body.classList.add('dark-theme');
        themeToggle.checked = true;
    }
    
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    });
    
    // Modal functionality
    const modal = document.getElementById('language-modal');
    const closeModal = document.querySelector('.close-modal');
    
    function openModal() {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    function closeModalFunc() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    closeModal.addEventListener('click', closeModalFunc);
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModalFunc();
        }
    });
    
    // API Base URL
    const API_BASE_URL = 'http://localhost:5000';
    
    // DOM Elements
    const languagesContainer = document.getElementById('languages-container');
    const addLanguageForm = document.getElementById('add-language-form');
    const languageNameInput = document.getElementById('language-name');
    const languageIconInput = document.getElementById('language-icon');
    
    const modalLanguageName = document.getElementById('modal-language-name');
    const modalLanguageIcon = document.getElementById('modal-language-icon');
    const modalProgressFill = document.getElementById('modal-progress-fill');
    const modalProgressText = document.getElementById('modal-progress-text');
    const sectionsContainer = document.getElementById('sections-container');
    const addSectionForm = document.getElementById('add-section-form');
    const sectionTitleInput = document.getElementById('section-title');
    
    let currentLanguageId = null;
    
    // Fetch all languages
    async function fetchLanguages() {
        try {
            const response = await fetch(`${API_BASE_URL}/languages`);
            const data = await response.json();
            
            if (data.success) {
                renderLanguages(data.languages);
            } else {
                console.error('Error fetching languages:', data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
    
    // Render languages to the grid
    function renderLanguages(languages) {
        languagesContainer.innerHTML = '';
        
        languages.forEach(language => {
            const languageCard = document.createElement('div');
            languageCard.className = 'language-card';
            languageCard.innerHTML = `
                <div class="language-header">
                    ${language.icon ? `<img src="${language.icon}" alt="${language.name}" class="language-icon">` : ''}
                    <h3 class="language-name">${language.name}</h3>
                </div>
                <div class="progress-container">
                    <div class="progress-text">
                        <span>Progress</span>
                        <span>${language.progress || 0}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${language.progress || 0}%"></div>
                    </div>
                </div>
            `;
            
            languageCard.addEventListener('click', () => openLanguageDetails(language.id));
            languagesContainer.appendChild(languageCard);
        });
    }
    
    // Open language details modal
    async function openLanguageDetails(languageId) {
        currentLanguageId = languageId;
        
        try {
            const response = await fetch(`${API_BASE_URL}/languages/${languageId}`);
            const data = await response.json();
            
            if (data.success) {
                const language = data.language;
                
                // Update modal header
                modalLanguageName.textContent = language.name;
                modalLanguageIcon.src = language.icon || '';
                modalLanguageIcon.alt = language.name;
                modalProgressFill.style.width = `${language.progress}%`;
                modalProgressText.textContent = `${Math.round(language.progress)}%`;
                
                // Render sections and subsections
                renderSections(language.sections);
                
                // Open modal
                openModal();
            } else {
                console.error('Error fetching language details:', data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
    
    // Render sections and subsections
    function renderSections(sections) {
        sectionsContainer.innerHTML = '';
        
        sections.forEach(section => {
            const sectionCard = document.createElement('div');
            sectionCard.className = 'section-card';
            
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'section-header';
            sectionHeader.innerHTML = `
                <h3 class="section-title">${section.title}</h3>
                <span class="material-icons">expand_more</span>
            `;
            
            const subsectionList = document.createElement('ul');
            subsectionList.className = 'subsection-list';
            
            section.subsections.forEach(subsection => {
                const subsectionItem = document.createElement('li');
                subsectionItem.className = `subsection-item ${subsection.is_completed ? 'completed' : ''}`;
                subsectionItem.innerHTML = `
                    <input type="checkbox" class="subsection-checkbox" ${subsection.is_completed ? 'checked' : ''} 
                           data-subsection-id="${subsection.id}">
                    <span class="subsection-title">${subsection.title}</span>
                `;
                
                subsectionList.appendChild(subsectionItem);
            });
            
            // Add subsection form
            const addSubsectionForm = document.createElement('form');
            addSubsectionForm.className = 'add-subsection-form';
            addSubsectionForm.innerHTML = `
                <input type="text" class="add-subsection-input" placeholder="Add new subsection">
                <button type="submit" class="add-subsection-btn">
                    <span class="material-icons">add</span>
                </button>
            `;
            
            sectionCard.appendChild(sectionHeader);
            sectionCard.appendChild(subsectionList);
            sectionCard.appendChild(addSubsectionForm);
            sectionsContainer.appendChild(sectionCard);
            
            // Toggle section visibility
            sectionHeader.addEventListener('click', () => {
                subsectionList.style.display = subsectionList.style.display === 'none' ? 'block' : 'none';
            });
            
            // Handle subsection checkbox changes
            const checkboxes = subsectionList.querySelectorAll('.subsection-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', async function() {
                    const subsectionId = this.dataset.subsectionId;
                    const isCompleted = this.checked;
                    
                    try {
                        const response = await fetch(`${API_BASE_URL}/subsections/${subsectionId}`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                is_completed: isCompleted
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            const subsectionItem = this.closest('.subsection-item');
                            const subsectionTitle = subsectionItem.querySelector('.subsection-title');
                            
                            if (isCompleted) {
                                subsectionItem.classList.add('completed');
                                subsectionTitle.style.textDecoration = 'line-through';
                                subsectionTitle.style.color = 'var(--text-secondary)';
                            } else {
                                subsectionItem.classList.remove('completed');
                                subsectionTitle.style.textDecoration = 'none';
                                subsectionTitle.style.color = 'var(--text-primary)';
                            }
                            
                            // Update progress
                            updateLanguageProgress(currentLanguageId);
                        } else {
                            console.error('Error updating subsection:', data.message);
                            this.checked = !isCompleted; // Revert checkbox state
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        this.checked = !isCompleted; // Revert checkbox state
                    }
                });
            });
            
            // Handle adding new subsection
            addSubsectionForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const input = this.querySelector('.add-subsection-input');
                const title = input.value.trim();
                
                if (title) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/subsections`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                section_id: section.id,
                                title: title
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            input.value = '';
                            // Refresh the sections to show the new subsection
                            openLanguageDetails(currentLanguageId);
                        } else {
                            console.error('Error adding subsection:', data.message);
                        }
                    } catch (error) {
                        console.error('Error:', error);
                    }
                }
            });
        });
    }
    
    // Update language progress
    async function updateLanguageProgress(languageId) {
        try {
            const response = await fetch(`${API_BASE_URL}/languages/${languageId}/progress`, {
                method: 'PUT'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update progress in modal
                const progress = data.progress.overall_percentage;
                modalProgressFill.style.width = `${progress}%`;
                modalProgressText.textContent = `${Math.round(progress)}%`;
                
                // Update progress in the grid
                const languageCards = document.querySelectorAll('.language-card');
                languageCards.forEach(card => {
                    const cardLanguageId = card.dataset.languageId;
                    if (cardLanguageId === languageId.toString()) {
                        const progressText = card.querySelector('.progress-text span:last-child');
                        const progressFill = card.querySelector('.progress-fill');
                        
                        progressText.textContent = `${Math.round(progress)}%`;
                        progressFill.style.width = `${progress}%`;
                    }
                });
            } else {
                console.error('Error updating progress:', data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
    
    // Add new language
    addLanguageForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = languageNameInput.value.trim();
        const icon = languageIconInput.value.trim();
        
        if (name) {
            try {
                const response = await fetch(`${API_BASE_URL}/languages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        icon: icon || null
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    languageNameInput.value = '';
                    languageIconInput.value = '';
                    fetchLanguages(); // Refresh the list
                } else {
                    console.error('Error adding language:', data.message);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    });
    
    // Add new section
    addSectionForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = sectionTitleInput.value.trim();
        
        if (title && currentLanguageId) {
            try {
                const response = await fetch(`${API_BASE_URL}/sections`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        language_id: currentLanguageId,
                        title: title
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    sectionTitleInput.value = '';
                    openLanguageDetails(currentLanguageId); // Refresh the sections
                } else {
                    console.error('Error adding section:', data.message);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    });
    
    // Initialize the app
    fetchLanguages();
});