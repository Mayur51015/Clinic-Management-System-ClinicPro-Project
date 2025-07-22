document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let currentEditingId = null;
    let currentSection = null;
    
    // Initialize charts
    initCharts();
    
    // Load initial data for the dashboard
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadDashboardStats();
    }
    
    // Event delegation for all buttons
    document.addEventListener('click', function(event) {
        // Handle edit buttons
        if (event.target.classList.contains('edit-btn')) {
            const id = event.target.getAttribute('data-id');
            const section = event.target.getAttribute('data-section');
            currentEditingId = id;
            currentSection = section;
            openEditModal(id, section);
        }
        
        // Handle delete buttons
        if (event.target.classList.contains('delete-btn')) {
            const id = event.target.getAttribute('data-id');
            const section = event.target.getAttribute('data-section');
            if (confirm('Are you sure you want to delete this item?')) {
                deleteItem(id, section);
            }
        }
        
        // Handle form submissions
        if (event.target.classList.contains('submit-form')) {
            event.preventDefault();
            const form = event.target.closest('form');
            const section = form.getAttribute('data-section');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            if (currentEditingId) {
                updateItem(currentEditingId, section, data);
            } else {
                addItem(section, data);
            }
            
            // Close modal after submission
            closeModal();
        }
    });
    
    // Function to show/hide sections
    window.showSection = function(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show the selected section
        document.getElementById(sectionId).classList.add('active');
        
        // Update the active state in the sidebar
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        
        // Update page title
        const titleMap = {
            'dashboard': 'Hospital Dashboard',
            'patients': 'Patient Management',
            'doctors': 'Doctor Management',
            'appointments': 'Appointment Management',
            'admissions': 'Patient Admissions',
            'pharmacy': 'Pharmacy Management',
            'billing': 'Billing Records',
            'inventory': 'Inventory Overview',
            'Logout': 'Logout'
        };
        
        document.getElementById('pageTitle').textContent = titleMap[sectionId] || 'Hospital Management System';
        
        // Load data for the section
        if (sectionId === 'dashboard') {
            loadDashboardStats();
        } else if (sectionId !== 'Logout') {
            loadSectionData(sectionId);
        } else {
            // Logout functionality
            logout();
        }
    };
    
    // Function to open modal for adding new items
    window.openModal = function(section) {
        currentEditingId = null;
        currentSection = section;
        
        const modal = document.getElementById('genericModal');
        const modalTitle = modal.querySelector('.modal-title');
        const modalBody = modal.querySelector('.modal-body');
        
        // Set modal title
        modalTitle.textContent = `Add New ${capitalizeFirstLetter(section.slice(0, -1))}`;
        
        // Generate form based on section
        modalBody.innerHTML = generateForm(section);
        
        // Show modal
        modal.style.display = 'block';
    };
    
    // Function to open edit modal
    function openEditModal(id, section) {
        const modal = document.getElementById('genericModal');
        const modalTitle = modal.querySelector('.modal-title');
        const modalBody = modal.querySelector('.modal-body');
        
        // Set modal title
        modalTitle.textContent = `Edit ${capitalizeFirstLetter(section.slice(0, -1))}`;
        
        // Fetch item data and populate form
        fetch(`/api/${section}/${id}`)
            .then(response => response.json())
            .then(data => {
                modalBody.innerHTML = generateForm(section, data);
                modal.style.display = 'block';
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to fetch item data');
            });
    }
    
    // Function to close modal
    window.closeModal = function() {
        document.getElementById('genericModal').style.display = 'none';
        currentEditingId = null;
    };
    
    // Function to load section data
    function loadSectionData(section) {
        fetch(`/api/${section}`)
            .then(response => response.json())
            .then(data => {
                renderTable(section, data);
            })
            .catch(error => {
                console.error('Error:', error);
                alert(`Failed to load ${section} data`);
            });
    }
    
    // Function to load dashboard stats
    function loadDashboardStats() {
        fetch('/api/dashboard/stats')
            .then(response => response.json())
            .then(data => {
                // Update stats cards
                document.querySelector('.stat-card.primary .stat-value').textContent = data.total_patients;
                document.querySelector('.stat-card.success .stat-value').textContent = data.active_doctors;
                document.querySelector('.stat-card.warning .stat-value').textContent = data.occupied_beds;
                document.querySelector('.stat-card.danger .stat-value').textContent = data.critical_cases;
                document.querySelector('.stat-card.info .stat-value').textContent = data.todays_appointments;
                document.querySelector('.stat-card.purple .stat-value').textContent = `$${data.monthly_revenue.toLocaleString()}`;
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to load dashboard stats');
            });
    }
    
    // Function to add new item
    function addItem(section, data) {
        fetch(`/api/${section}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(() => {
            loadSectionData(section);
            alert(`${capitalizeFirstLetter(section.slice(0, -1))} added successfully`);
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`Failed to add ${section.slice(0, -1)}`);
        });
    }
    
    // Function to update item
    function updateItem(id, section, data) {
        fetch(`/api/${section}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(() => {
            loadSectionData(section);
            alert(`${capitalizeFirstLetter(section.slice(0, -1))} updated successfully`);
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`Failed to update ${section.slice(0, -1)}`);
        });
    }
    
    // Function to delete item
    function deleteItem(id, section) {
        fetch(`/api/${section}/${id}`, {
            method: 'DELETE'
        })
        .then(() => {
            loadSectionData(section);
            alert(`${capitalizeFirstLetter(section.slice(0, -1))} deleted successfully`);
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`Failed to delete ${section.slice(0, -1)}`);
        });
    }
    
    // Function to render table data
    function renderTable(section, data) {
        const tableBody = document.querySelector(`#${section} tbody`);
        tableBody.innerHTML = '';
        
        data.forEach(item => {
            const row = document.createElement('tr');
            
            // Generate row content based on section
            switch(section) {
                case 'patients':
                    row.innerHTML = `
                        <td>${item.patient_id || ''}</td>
                        <td>${item.name || ''}</td>
                        <td>${item.age || ''}</td>
                        <td>${item.gender || ''}</td>
                        <td>${item.contact || ''}</td>
                        <td><span class="status-badge status-${item.status ? item.status.toLowerCase() : 'active'}">${item.status || 'Active'}</span></td>
                        <td>${item.last_visit || ''}</td>
                        <td>
                            <button class="btn btn-success view-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">View</button>
                            <button class="btn btn-warning edit-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">Edit</button>
                            <button class="btn btn-danger delete-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">Delete</button>
                        </td>
                    `;
                    break;
                case 'doctors':
                    row.innerHTML = `
                        <td>${item.doctor_id || ''}</td>
                        <td>${item.name || ''}</td>
                        <td>${item.specialization || ''}</td>
                        <td>${item.department || ''}</td>
                        <td>${item.contact || ''}</td>
                        <td>${item.experience || ''}</td>
                        <td><span class="status-badge status-${item.status ? item.status.toLowerCase() : 'active'}">${item.status || 'Active'}</span></td>
                        <td>
                            <button class="btn btn-success view-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">View</button>
                            <button class="btn btn-warning edit-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">Edit</button>
                            <button class="btn btn-danger delete-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">Delete</button>
                        </td>
                    `;
                    break;
                case 'appointments':
                    row.innerHTML = `
                        <td>${item.appointment_id || ''}</td>
                        <td>${item.patient || ''}</td>
                        <td>${item.doctor || ''}</td>
                        <td>${item.date || ''}</td>
                        <td>${item.time || ''}</td>
                        <td>${item.department || ''}</td>
                        <td><span class="status-badge status-${item.status ? item.status.toLowerCase() : 'scheduled'}">${item.status || 'Scheduled'}</span></td>
                        <td>
                            <button class="btn btn-success view-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">View</button>
                            <button class="btn btn-warning edit-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">Edit</button>
                            <button class="btn btn-danger delete-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">Delete</button>
                        </td>
                    `;
                    break;
                case 'admissions':
                    row.innerHTML = `
                        <td>${item.admission_id || ''}</td>
                        <td>${item.patient || ''}</td>
                        <td>${item.room_number || ''}</td>
                        <td>${item.admission_date || ''}</td>
                        <td>${item.doctor || ''}</td>
                        <td>${item.condition || ''}</td>
                        <td><span class="status-badge status-${item.status ? item.status.toLowerCase() : 'stable'}">${item.status || 'Stable'}</span></td>
                        <td>
                            <button class="btn btn-success view-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">View</button>
                            <button class="btn btn-warning edit-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">Edit</button>
                            <button class="btn btn-danger delete-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">Delete</button>
                        </td>
                    `;
                    break;
                case 'pharmacy':
                    row.innerHTML = `
                        <td>${item.medicine_id || ''}</td>
                        <td>${item.name || ''}</td>
                        <td>${item.category || ''}</td>
                        <td>${item.stock || ''}</td>
                        <td>$${item.unit_price || '0.00'}</td>
                        <td>${item.expiry_date || ''}</td>
                        <td>${item.supplier || ''}</td>
                        <td>
                            <button class="btn btn-success view-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">View</button>
                            <button class="btn btn-warning edit-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">Edit</button>
                            <button class="btn btn-danger delete-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">Delete</button>
                        </td>
                    `;
                    break;
                case 'billing':
                    row.innerHTML = `
                        <td>${item.invoice_id || ''}</td>
                        <td>${item.patient || ''}</td>
                        <td>${item.doctor || ''}</td>
                        <td>${item.date || ''}</td>
                        <td>$${item.total_amount || '0.00'}</td>
                        <td><span class="status-badge status-${item.status ? item.status.toLowerCase() : 'pending'}">${item.status || 'Pending'}</span></td>
                        <td>
                            <button class="btn btn-success view-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">View</button>
                            <button class="btn btn-warning edit-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">Edit</button>
                            <button class="btn btn-danger delete-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">Delete</button>
                        </td>
                    `;
                    break;
                case 'inventory':
                    row.innerHTML = `
                        <td>${item.item_id || ''}</td>
                        <td>${item.name || ''}</td>
                        <td>${item.category || ''}</td>
                        <td>${item.quantity || ''}</td>
                        <td>${item.unit || ''}</td>
                        <td>${item.reorder_level || ''}</td>
                        <td>${item.expiry_date || ''}</td>
                        <td>
                            <button class="btn btn-success view-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">View</button>
                            <button class="btn btn-warning edit-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">Edit</button>
                            <button class="btn btn-danger delete-btn" data-id="${item.id}" data-section="${section}" style="padding: 5px 10px; font-size: 12px;">Delete</button>
                        </td>
                    `;
                    break;
            }
            
            tableBody.appendChild(row);
        });
    }
    
    // Function to generate form based on section
    function generateForm(section, data = null) {
        let formHTML = `<form id="dataForm" data-section="${section}">`;
        
        // Common fields for all sections
        const fields = {
            'patients': [
                { name: 'name', label: 'Name', type: 'text', required: true },
                { name: 'age', label: 'Age', type: 'number', required: true },
                { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
                { name: 'contact', label: 'Contact', type: 'tel', required: true },
                { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Admitted', 'Discharged'], required: true },
                { name: 'last_visit', label: 'Last Visit', type: 'date' }
            ],
            'doctors': [
                { name: 'name', label: 'Name', type: 'text', required: true },
                { name: 'specialization', label: 'Specialization', type: 'text', required: true },
                { name: 'department', label: 'Department', type: 'text', required: true },
                { name: 'contact', label: 'Contact', type: 'tel', required: true },
                { name: 'experience', label: 'Experience', type: 'text', required: true },
                { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'On Leave'], required: true }
            ],
            'appointments': [
                { name: 'patient_id', label: 'Patient ID', type: 'number', required: true },
                { name: 'doctor_id', label: 'Doctor ID', type: 'number', required: true },
                { name: 'date', label: 'Date', type: 'date', required: true },
                { name: 'time', label: 'Time', type: 'time', required: true },
                { name: 'department', label: 'Department', type: 'text', required: true },
                { name: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'Completed', 'Cancelled'], required: true }
            ],
            'admissions': [
                { name: 'patient_id', label: 'Patient ID', type: 'number', required: true },
                { name: 'room_number', label: 'Room Number', type: 'text', required: true },
                { name: 'admission_date', label: 'Admission Date', type: 'date', required: true },
                { name: 'doctor_id', label: 'Doctor ID', type: 'number', required: true },
                { name: 'condition', label: 'Condition', type: 'text', required: true },
                { name: 'status', label: 'Status', type: 'select', options: ['Stable', 'Critical', 'Discharged'], required: true }
            ],
            'pharmacy': [
                { name: 'name', label: 'Medicine Name', type: 'text', required: true },
                { name: 'category', label: 'Category', type: 'text', required: true },
                { name: 'stock', label: 'Stock', type: 'number', required: true },
                { name: 'unit_price', label: 'Unit Price', type: 'number', step: '0.01', required: true },
                { name: 'expiry_date', label: 'Expiry Date', type: 'date', required: true },
                { name: 'supplier', label: 'Supplier', type: 'text', required: true }
            ],
            'billing': [
                { name: 'patient_id', label: 'Patient ID', type: 'number', required: true },
                { name: 'doctor_id', label: 'Doctor ID', type: 'number', required: true },
                { name: 'date', label: 'Date', type: 'date', required: true },
                { name: 'total_amount', label: 'Total Amount', type: 'number', step: '0.01', required: true },
                { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Paid', 'Cancelled'], required: true }
            ],
            'inventory': [
                { name: 'name', label: 'Item Name', type: 'text', required: true },
                { name: 'category', label: 'Category', type: 'text', required: true },
                { name: 'quantity', label: 'Quantity', type: 'number', required: true },
                { name: 'unit', label: 'Unit', type: 'text', required: true },
                { name: 'reorder_level', label: 'Reorder Level', type: 'number', required: true },
                { name: 'expiry_date', label: 'Expiry Date', type: 'date' }
            ]
        };
        
        // Generate form fields
        fields[section].forEach(field => {
            formHTML += `<div class="form-group">`;
            formHTML += `<label for="${field.name}">${field.label}:</label>`;
            
            if (field.type === 'select') {
                formHTML += `<select class="form-control" id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>`;
                field.options.forEach(option => {
                    const selected = data && data[field.name] === option ? 'selected' : '';
                    formHTML += `<option value="${option}" ${selected}>${option}</option>`;
                });
                formHTML += `</select>`;
            } else {
                const value = data ? data[field.name] : '';
                formHTML += `<input type="${field.type}" class="form-control" id="${field.name}" name="${field.name}" 
                    ${field.required ? 'required' : ''} ${field.step ? `step="${field.step}"` : ''}
                    value="${value}">`;
            }
            
            formHTML += `</div>`;
        });
        
        formHTML += `
            <div class="form-group" style="display: flex; justify-content: space-between; margin-top: 20px;">
                <button type="button" class="btn btn-danger" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary submit-form">${data ? 'Update' : 'Add'}</button>
            </div>
        </form>`;
        
        return formHTML;
    }
    
    // Function to initialize charts
    function initCharts() {
        // Admissions Chart
        const admissionsCtx = document.getElementById('admissionsChart').getContext('2d');
        const admissionsChart = new Chart(admissionsCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Patient Admissions',
                    data: [120, 190, 170, 210, 240, 200, 230, 250, 280, 300, 290, 320],
                    backgroundColor: 'rgba(79, 172, 254, 0.2)',
                    borderColor: 'rgba(79, 172, 254, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Department Chart
        const departmentCtx = document.getElementById('departmentChart').getContext('2d');
        const departmentChart = new Chart(departmentCtx, {
            type: 'doughnut',
            data: {
                labels: ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Oncology', 'Other'],
                datasets: [{
                    data: [25, 20, 15, 15, 10, 15],
                    backgroundColor: [
                        'rgba(79, 172, 254, 0.8)',
                        'rgba(6, 214, 160, 0.8)',
                        'rgba(255, 209, 102, 0.8)',
                        'rgba(247, 37, 133, 0.8)',
                        'rgba(17, 138, 178, 0.8)',
                        'rgba(114, 9, 183, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });
    }
    
    // Helper function to capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Logout function
    function logout() {
        // Here you would typically clear any authentication tokens or session data
        alert('Logging out...');
        // window.location.href = '/login';
    }
});

// Add this modal HTML to your page (place it just before the closing </body> tag)
document.write(`
<div id="genericModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title">Modal Title</h3>
            <button type="button" class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <!-- Form will be inserted here dynamically -->
        </div>
    </div>
</div>
`);