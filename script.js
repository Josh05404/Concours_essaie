const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbws8kbjoTp42eCQgmRHbFqP1iijqNceZSuWeaiMW4agZe-0cUlqvkAxR2eCcPf1-fnXKg/exec';
let inscriptions = [];

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('inscriptionForm')) initInscription();
  if (document.getElementById('loginForm')) initAdmin();
});

// ================= INSCRIPTION =================
function initInscription() {
  loadNextCandidateNumber();

  document.getElementById('inscriptionForm').addEventListener('submit', async e => {
    e.preventDefault();

    const data = {
      numero: numero.value,
      nom: nom.value,
      postnom: postnom.value,
      genre: genre.value,
      eglise: eglise.value,
      telephone: telephone.value,
      email: email.value
    };

    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const json = await res.json();

      if (json.result === 'success') {
        document.getElementById('formContainer').innerHTML = `
          <div class="alert alert-success">
            <h3>Inscription réussie</h3>
            <p>Numéro : <strong>${data.numero}</strong></p>
          </div>`;
      } else {
        showAlert('Erreur lors de l’inscription', 'danger');
      }
    } catch {
      showAlert('Erreur de connexion', 'danger');
    }
  });
}

// ================= NUMBER =================
async function loadNextCandidateNumber() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getLastNumber`);
    const json = await res.json();
    const n = (json.lastNumber || 0) + 1;
    numero.value = `CAN${n.toString().padStart(4, '0')}`;
  } catch {
    numero.value = 'CAN0001';
  }
}

// ================= ADMIN =================
function initAdmin() {
  if (localStorage.admin === 'true') loadAdmin();

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    if (adminPassword.value === 'Golden1Agency') {
      localStorage.admin = 'true';
      loadAdmin();
    } else showAlert('Mot de passe incorrect', 'danger');
  });
}

async function loadAdmin() {
  loginForm.style.display = 'none';
  adminContent.style.display = 'block';

  const res = await fetch(`${SCRIPT_URL}?action=getAll`);
  const json = await res.json();
  inscriptions = json.inscriptions || [];
  renderAdmin();
}

function renderAdmin() {
  inscriptionsTable.innerHTML = '';
  inscriptions.forEach((i, index) => {
    inscriptionsTable.innerHTML += `
      <tr>
        <td>${i.numero}</td>
        <td>${i.nom}</td>
        <td>${i.postnom}</td>
        <td>${i.genre}</td>
        <td>${i.eglise}</td>
        <td>${i.telephone}</td>
        <td>${i.email}</td>
        <td>${i.status}</td>
        <td>
          <button onclick="updateStatus(${index},'approved')">Valider</button>
          <button onclick="updateStatus(${index},'rejected')">Rejeter</button>
        </td>
      </tr>`;
  });
}

async function updateStatus(index, status) {
  await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updateStatus', id: inscriptions[index].id, status })
  });
  inscriptions[index].status = status;
  renderAdmin();
}

// ================= ALERT =================
function showAlert(msg, type) {
  alert(msg);
}
