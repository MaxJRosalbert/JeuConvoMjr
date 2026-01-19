const URL_DONNEES = 'assets/data/questions.json';

const ui = {
    ecrans: document.querySelectorAll('.ecran'),
    naviguerVers: function(id) {
        this.ecrans.forEach(e => { e.classList.remove('ecran--actif'); e.scrollTop = 0; });
        document.getElementById(id).classList.add('ecran--actif');
    },
    afficherCarte: function(q, index, total) {
        const carte = document.getElementById('carte-jeu');
        carte.style.transform = 'translate(0,0) rotate(0deg)';
        carte.style.opacity = '1';
        
        document.getElementById('texte-carte').innerText = q.contenu;
        document.getElementById('tag-carte').innerText = q.packs[0].toUpperCase();
        document.getElementById('icone-favori').innerText = jeu.favoris.includes(q.id) ? 'favorite' : 'favorite_border';
        
        document.getElementById('compteur-questions').innerText = `${index + 1} / ${total}`;
    }
};

const jeu = {
    data: [],
    jouables: [],
    favoris: JSON.parse(localStorage.getItem('favoris')) || [],
    actuelle: null,
    totalPartie: 0,
    indexPartie: 0,
    chronoDuree: 0, // Durée choisie
    chronoInterval: null,
    
    init: async function() {
        try {
            const req = await fetch(URL_DONNEES);
            const base = await req.json();
            const perso = JSON.parse(localStorage.getItem('questions_perso')) || [];
            this.data = [...base, ...perso];
            this.majModesUI(); 
            this.chargerFavoris();
        } catch(e) { console.error("Erreur JSON", e); }
    },

    majModesUI: function() {
        const age = document.querySelector('input[name="age-select"]:checked').value;
        const btnHot = document.getElementById('btn-hot');
        if (age === 'enfant' || age === 'ado') btnHot.classList.add('disabled');
        else btnHot.classList.remove('disabled');
    },

    lancerPreset: function(mode) {
        this.configurerPartie();
        
        let packs = [];
        if (mode === 'couple') packs = ['couple', 'verite', 'romantique'];
        else if (mode === 'hot') packs = ['hot', 'intimacy'];
        else if (mode === 'famille') packs = ['famille', 'souvenirs', 'imagination'];
        else if (mode === 'connaissance') packs = ['connaissance', 'quiz'];
        else if (mode === 'profond') packs = ['profond', 'philo', 'valeurs'];
        else if (mode === 'date') packs = ['date', 'brise-glace'];
        else if (mode === 'potes') packs = ['amis', 'fun', 'anecdote'];
        else if (mode === 'tu_preferes') packs = ['tu_preferes', 'dilemme'];
        else if (mode === 'miroir') packs = ['miroir', 'psycho'];
        else if (mode === 'fun') packs = ['fun', 'blague', 'imagination', 'insolite'];

        this.demarrer(this.getAges(), packs);
    },

    lancerAleatoire: function() {
        this.configurerPartie();
        this.demarrer(this.getAges(), null);
    },

    configurerPartie: function() {
        // Récupérer la valeur du select chrono
        const val = parseInt(document.getElementById('select-chrono').value);
        this.chronoDuree = val;
    },

    getAges: function() {
        const sel = document.querySelector('input[name="age-select"]:checked').value;
        if (sel === '18+') return ['enfant', 'ado', 'adulte', '18+'];
        if (sel === 'adulte') return ['enfant', 'ado', 'adulte'];
        if (sel === 'ado') return ['enfant', 'ado'];
        return ['enfant'];
    },

    demarrer: function(ages, packs) {
        this.jouables = this.data.filter(q => {
            const bonAge = ages.includes(q.age);
            const bonPack = packs ? q.packs.some(p => packs.includes(p)) : (q.age !== '18+');
            return bonAge && bonPack;
        });

        if (this.jouables.length === 0) return alert("Aucune question trouvée !");
        
        this.jouables.sort(() => Math.random() - 0.5);
        this.totalPartie = this.jouables.length;
        this.indexPartie = 0;
        
        // UI Chrono
        const container = document.getElementById('barre-chrono-container');
        container.className = this.chronoDuree > 0 ? 'barre-chrono-container actif' : 'barre-chrono-container';

        ui.naviguerVers('ecran-jeu');
        this.carteSuivante(null);
    },

    carteSuivante: function(dir) {
        this.stopChrono();
        
        const c = document.getElementById('carte-jeu');
        if (dir) {
            c.style.transition = 'transform 0.3s, opacity 0.3s';
            c.style.transform = `translate(${dir==='droite'?300:-300}px, 0) rotate(${dir==='droite'?20:-20}deg)`;
            c.style.opacity = '0';
        }
        
        setTimeout(() => {
            if (this.jouables.length === 0) { 
                alert('Partie terminée !'); ui.naviguerVers('ecran-selection'); return; 
            }
            this.actuelle = this.jouables.pop();
            ui.afficherCarte(this.actuelle, this.indexPartie, this.totalPartie);
            this.indexPartie++;
            
            if(this.chronoDuree > 0) this.lancerChrono();
            
        }, dir ? 300 : 0);
    },

    lancerChrono: function() {
        const barre = document.getElementById('barre-chrono');
        barre.style.transition = 'none';
        barre.style.width = '100%';
        void barre.offsetWidth; // Force reflow
        
        barre.style.transition = `width ${this.chronoDuree}s linear`;
        barre.style.width = '0%';
        
        this.chronoInterval = setTimeout(() => {
            document.getElementById('texte-carte').innerText = "TEMPS ÉCOULÉ ! ⏰";
            if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }, this.chronoDuree * 1000);
    },

    stopChrono: function() {
        clearTimeout(this.chronoInterval);
        const barre = document.getElementById('barre-chrono');
        barre.style.transition = 'none';
        barre.style.width = '100%';
    },

    quitter: function() { this.stopChrono(); ui.naviguerVers('ecran-selection'); },

    toggleFavori: function() {
        if (!this.actuelle) return;
        const id = this.actuelle.id;
        const idx = this.favoris.indexOf(id);
        if (idx === -1) this.favoris.push(id); else this.favoris.splice(idx, 1);
        localStorage.setItem('favoris', JSON.stringify(this.favoris));
        document.getElementById('icone-favori').innerText = idx === -1 ? 'favorite' : 'favorite_border';
        this.chargerFavoris();
    },

    chargerFavoris: function() {
        const div = document.getElementById('liste-favoris');
        div.innerHTML = '';
        const favs = this.data.filter(q => this.favoris.includes(q.id));
        if (favs.length === 0) div.innerHTML = '<p style="text-align:center; grid-column:1/-1; color:#aaa">Aucun favori</p>';
        favs.forEach(q => {
            div.innerHTML += `
            <div class="carte-favori">
                <strong>${q.packs[0]}</strong>
                <p>${q.contenu}</p>
                <button class="btn-suppr" onclick="jeu.supprimerFavori(${q.id})">✖</button>
            </div>`;
        });
    },

    supprimerFavori: function(id) {
        this.favoris = this.favoris.filter(fid => fid !== id);
        localStorage.setItem('favoris', JSON.stringify(this.favoris));
        this.chargerFavoris();
        if (this.actuelle && this.actuelle.id === id) document.getElementById('icone-favori').innerText = 'favorite_border';
    }
};

const admin = {
    ajouterQuestion: function() {
        const txt = document.getElementById('admin-contenu').value;
        const age = document.getElementById('admin-age').value;
        const packs = Array.from(document.querySelectorAll('#admin-categories input:checked')).map(c => c.value);
        if (!txt || packs.length === 0) return alert("Remplis le texte et au moins une catégorie !");
        
        const q = { id: Date.now(), contenu: txt, age: age, packs: packs };
        const perso = JSON.parse(localStorage.getItem('questions_perso')) || [];
        perso.push(q);
        localStorage.setItem('questions_perso', JSON.stringify(perso));
        alert("Question ajoutée !");
        jeu.init();
        document.querySelector('.formulaire-admin').reset();
    },
    exporterJSON: function() {
        const perso = JSON.parse(localStorage.getItem('questions_perso')) || [];
        navigator.clipboard.writeText(JSON.stringify(perso));
        alert("JSON copié !");
    }
};

const swipe = {
    el: null, x: 0, startX: 0, isDown: false,
    init: function() {
        this.el = document.getElementById('carte-jeu');
        this.el.addEventListener('touchstart', e => this.start(e.touches[0].clientX));
        this.el.addEventListener('touchmove', e => this.move(e.touches[0].clientX));
        this.el.addEventListener('touchend', () => this.end());
        this.el.addEventListener('mousedown', e => { this.isDown = true; this.start(e.clientX); });
        window.addEventListener('mousemove', e => { if(this.isDown) this.move(e.clientX); });
        window.addEventListener('mouseup', () => { if(this.isDown) { this.isDown = false; this.end(); } });
    },
    start: function(x) { this.startX = x; this.el.style.transition = 'none'; },
    move: function(x) {
        this.x = x - this.startX;
        this.el.style.transform = `translate(${this.x}px, 0) rotate(${this.x * 0.05}deg)`;
        const op = Math.abs(this.x) / 150;
        document.querySelector('.indicateur-swipe--like').style.opacity = this.x > 0 ? op : 0;
        document.querySelector('.indicateur-swipe--pass').style.opacity = this.x < 0 ? op : 0;
    },
    end: function() {
        document.querySelectorAll('.indicateur-swipe').forEach(i => i.style.opacity = 0);
        if (Math.abs(this.x) > 100) jeu.carteSuivante(this.x > 0 ? 'droite' : 'gauche');
        else { this.el.style.transition = 'transform 0.3s'; this.el.style.transform = 'translate(0,0)'; }
        this.x = 0;
    }
};

document.addEventListener('DOMContentLoaded', () => { jeu.init(); swipe.init(); });