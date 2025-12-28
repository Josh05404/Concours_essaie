// Configuration Google Sheets
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbws8kbjoTp42eCQgmRHbFqP1iijqNceZSuWeaiMW4agZe-0cUlqvkAxR2eCcPf1-fnXKg/exec';
// Données globales
let inscriptions = [];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Si nous sommes sur la page inscription
    if (window.location.pathname.includes('inscription.html') || window.location.pathname === '/inscription') {
        loadInscriptionPage();
    }
    
    // Si nous sommes sur la page admin
    if (window.location.pathname.includes('admin.html') || window.location.pathname === '/admin') {
        checkAdminLogin();
    }
    
    // Si nous sommes sur la page d'accueil
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        // Rien de spécial pour l'instant
    }
});

// Page d'inscription
function loadInscriptionPage() {
    const form = document.getElementById('inscriptionForm');
    if (form) {
        // Charger le prochain numéro de candidat
        loadNextCandidateNumber();
        
        // Gérer la soumission du formulaire
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Récupérer les données du formulaire
            const formData = {
                numero: document.getElementById('numero').value,
                nom: document.getElementById('nom').value,
                postnom: document.getElementById('postnom').value,
                genre: document.getElementById('genre').value,
                eglise: document.getElementById('eglise').value,
                telephone: document.getElementById('telephone').value,
                email: document.getElementById('email').value,
                status: 'pending',
                date: new Date().toLocaleString('fr-FR')
            };
            
            // Validation simple
            if (!formData.nom || !formData.postnom || !formData.telephone || !formData.email) {
                showAlert('Veuillez remplir tous les champs obligatoires.', 'danger');
                return;
            }
            
            // Envoyer les données
            try {
                const response = await saveToGoogleSheets(formData);
                
                if (response.result === 'success') {
                    // Afficher le message de confirmation
                    document.getElementById('formContainer').innerHTML = `
                        <div class="alert alert-success">
                            <h3><i class="fas fa-check-circle"></i> Inscription soumise avec succès!</h3>
                            <p>Votre inscription a été enregistrée sous le numéro <strong>${formData.numero}</strong>.</p>
                            <p>Notre équipe chargée des inscriptions examinera vos informations et vous donnera une réponse dans les <strong>24 heures</strong>.</p>
                            <p>Vous recevrez un email de confirmation à l'adresse <strong>${formData.email}</strong>.</p>
                            <div style="margin-top: 2rem;">
                                <a href="index.html" class="btn btn-primary">Retour à l'accueil</a>
                            </div>
                        </div>
                    `;
                } else {
                    showAlert('Une erreur est survenue. Veuillez réessayer.', 'danger');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showAlert('Erreur de connexion. Veuillez réessayer plus tard.', 'danger');
            }
        });
    }
}

// Charger le prochain numéro de candidat
async function loadNextCandidateNumber() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getLastNumber`);
        const data = await response.json();
        
        let nextNumber = 1;
        if (data.lastNumber) {
            nextNumber = parseInt(data.lastNumber) + 1;
        }
        
        // Formater le numéro avec des zéros non significatifs
        const formattedNumber = nextNumber.toString().padStart(4, '0');
        document.getElementById('numero').value = `CAN${formattedNumber}`;
    } catch (error) {
        console.error('Erreur:', error);
        // Numéro par défaut en cas d'erreur
        document.getElementById('numero').value = 'CAN0001';
    }
}

// Sauvegarder dans Google Sheets
async function saveToGoogleSheets(data) {
    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    
    return await response.json();
}

// Page admin
function checkAdminLogin() {
    const adminContent = document.getElementById('adminContent');
    const loginForm = document.getElementById('loginForm');
    
    // Vérifier si l'admin est déjà connecté
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        if (adminContent) adminContent.style.display = 'block';
        if (loginForm) loginForm.style.display = 'none';
        loadAdminData();
    } else {
        if (adminContent) adminContent.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
        
        // Gérer la connexion
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const password = document.getElementById('adminPassword').value;
                
                if (password === 'Golden1Agency') {
                    localStorage.setItem('adminLoggedIn', 'true');
                    if (adminContent) adminContent.style.display = 'block';
                    if (loginForm) loginForm.style.display = 'none';
                    loadAdminData();
                } else {
                    showAlert('Mot de passe incorrect.', 'danger');
                }
            });
        }
    }
    
    // Gérer la déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('adminLoggedIn');
            window.location.reload();
        });
    }
    
    // Gérer l'export PDF
    const exportBtn = document.getElementById('exportPdf');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToPDF);
    }
}

// Charger les données admin
async function loadAdminData() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getAll`);
        const data = await response.json();
        
        if (data.inscriptions) {
            inscriptions = data.inscriptions;
            displayInscriptions(inscriptions);
        }
    } catch (error) {
        console.error('Erreur:', error);
        showAlert('Erreur de chargement des inscriptions.', 'danger');
    }
}

// Afficher les inscriptions dans le tableau
function displayInscriptions(data) {
    const tbody = document.getElementById('inscriptionsTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    data.forEach((inscription, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${inscription.numero || 'N/A'}</td>
            <td>${inscription.nom || ''}</td>
            <td>${inscription.postnom || ''}</td>
            <td>${inscription.genre || ''}</td>
            <td>${inscription.eglise || ''}</td>
            <td>${inscription.telephone || ''}</td>
            <td>${inscription.email || ''}</td>
            <td><span class="status-${inscription.status || 'pending'}">${getStatusText(inscription.status)}</span></td>
            <td>${inscription.date || ''}</td>
            <td>
                <div class="actions">
                    ${inscription.status !== 'approved' ? `<button class="action-btn btn-success" onclick="updateStatus(${index}, 'approved')">Valider</button>` : ''}
                    ${inscription.status !== 'rejected' ? `<button class="action-btn btn-danger" onclick="updateStatus(${index}, 'rejected')">Rejeter</button>` : ''}
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Obtenir le texte du statut
function getStatusText(status) {
    switch(status) {
        case 'approved': return 'Validé';
        case 'rejected': return 'Rejeté';
        default: return 'En attente';
    }
}

// Mettre à jour le statut d'une inscription
async function updateStatus(index, newStatus) {
    const inscription = inscriptions[index];
    
    if (!inscription || !inscription.id) {
        showAlert('Impossible de mettre à jour cette inscription.', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${SCRIPT_URL}?action=updateStatus`, {
            method: 'POST',
            body: JSON.stringify({
                id: inscription.id,
                status: newStatus
            })
        });
        
        const result = await response.json();
        
        if (result.result === 'success') {
            // Mettre à jour localement
            inscriptions[index].status = newStatus;
            displayInscriptions(inscriptions);
            showAlert(`Inscription ${newStatus === 'approved' ? 'validée' : 'rejetée'} avec succès.`, 'success');
        } else {
            showAlert('Erreur lors de la mise à jour.', 'danger');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showAlert('Erreur de connexion.', 'danger');
    }
}

// Exporter en PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    
    // Titre
    doc.setFontSize(20);
    doc.text('Liste des inscriptions - Gospel Awards', 40, 40);
    doc.setFontSize(12);
    doc.text(`Export du ${new Date().toLocaleDateString('fr-FR')}`, 40, 65);
    
    // En-tête du tableau
    const headers = [['N°', 'Nom', 'Post-nom', 'Genre', 'Église', 'Téléphone', 'Email', 'Statut', 'Date']];
    
    // Données
    const data = inscriptions.map(ins => [
        ins.numero || '',
        ins.nom || '',
        ins.postnom || '',
        ins.genre || '',
        ins.eglise || '',
        ins.telephone || '',
        ins.email || '',
        getStatusText(ins.status),
        ins.date || ''
    ]);
    
    // Créer le tableau
    doc.autoTable({
        head: headers,
        body: data,
        startY: 80,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [138, 43, 226] }
    });
    
    // Sauvegarder le PDF
    doc.save(`inscriptions_gospel_awards_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Afficher une alerte
function showAlert(message, type) {
    // Supprimer les alertes existantes
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) existingAlert.remove();
    
    // Créer la nouvelle alerte
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i> ${message}`;
    
    // Ajouter au début du conteneur principal
    const container = document.querySelector('.container') || document.querySelector('.form-container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Gérer la recherche dans le tableau admin
function searchInscriptions() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        const filtered = inscriptions.filter(ins => 
            (ins.nom && ins.nom.toLowerCase().includes(searchTerm)) ||
            (ins.postnom && ins.postnom.toLowerCase().includes(searchTerm)) ||
            (ins.numero && ins.numero.toLowerCase().includes(searchTerm)) ||
            (ins.eglise && ins.eglise.toLowerCase().includes(searchTerm)) ||
            (ins.email && ins.email.toLowerCase().includes(searchTerm)) ||
            (ins.telephone && ins.telephone.includes(searchTerm))
        );
        
        displayInscriptions(filtered);
    });
}

// Initialiser la recherche si sur la page admin
if (window.location.pathname.includes('admin.html')) {
    document.addEventListener('DOMContentLoaded', searchInscriptions);
}

