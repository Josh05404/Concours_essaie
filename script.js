const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzWG7KN3BJ0z76_bLyF37lYaOGU2uyI-sm-q3rb0YALeu0Nbo_eolnPZQ8Be0CC56m5Hg/exec';
let inscriptions = [];

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('inscriptionForm')) initInscription();
  if (document.getElementById('loginForm')) initAdmin();
});

// ================= INSCRIPTION =================
function initInscription() {
  loadNextCandidateNumber();

  inscriptionForm.addEventListener('submit', async e => {
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
      // IMPORTANT : PAS de JSON, PAS de headers → pas de preflight
      const params = new URLSearchParams(data);

      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: params
      });

      const json = await res.json();

      if (json.result === 'success') {
        formContainer.innerHTML = `
          <div class="alert alert-success">
            <h3>Inscription réussie</h3>
            <p>Votre numéro est <strong>${data.numero}</strong></p>
          </div>`;
      } else {
        alert('Erreur lors de l’inscription');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur de connexion');
    }
  });
}

// ================= NUMÉRO =================
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
    } else {
      alert('Mot de passe incorrect');
    }
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
  inscriptions.forEach((i, idx) => {
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
          <button onclick="updateStatus(${idx}, 'approved')">Valider</button>
          <button onclick="updateStatus(${idx}, 'rejected')">Rejeter</button>
        </td>
      </tr>`;
  });
}

async function updateStatus(index, status) {
  const params = new URLSearchParams({
    action: 'updateStatus',
    id: inscriptions[index].id,
    status
  });

  await fetch(SCRIPT_URL, {
    method: 'POST',
    body: params
  });

  inscriptions[index].status = status;
  renderAdmin();
}
