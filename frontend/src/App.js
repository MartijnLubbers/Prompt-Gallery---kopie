import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Handleidingen from './handleidingen';

// Homepagina Component
function Home() {
  const [prompts, setPrompts] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredPrompts, setFilteredPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  // Data ophalen van de backend
  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await axios.get('http://test-hartingstraat.duckdns.org:5000/api/prompts');
      setPrompts(response.data);
      setFilteredPrompts(response.data);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  };

  const filterPrompts = () => {
    const filtered = prompts.filter((prompt) =>
      prompt.titel.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredPrompts(filtered);
  };

  useEffect(() => {
    filterPrompts();
  }, [search, prompts]);

  const openPopup = (prompt) => {
    setSelectedPrompt(prompt);
    setShowPopup(true);
  };

  const closePopup = () => {
    setSelectedPrompt(null);
    setShowPopup(false);
  };

  return (
    <div className="App">
      <NavBar search={search} setSearch={setSearch} />
      <Content prompts={filteredPrompts} openPopup={openPopup} />
      {showPopup && selectedPrompt && (
        <Popup prompt={selectedPrompt} closePopup={closePopup} />
      )}
    </div>
  );
}

// App Component met Routing
function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/handleidingen" element={<Handleidingen />} />
      </Routes>
    </div>
  );
}

// Navigatiebalk Component
function NavBar({ search, setSearch }) {
  return (
    <nav className="menu-bar">
      <div className="menu-header">
        <img src="/images/logo-nl-nowhitespace.svg" alt="Logo" class="logo" />
        {/* <span className="menu-title">Rijksdienst voor Ondernemend Nederland</span> */}
      </div>
      <div className="menu-bottom">
        <ul className="menu-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/handleidingen">Handleidingen</Link></li>
        </ul>
        {setSearch && (
          <div className="menu-search">
            <input
              type="text"
              placeholder="Zoeken..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-bar"
            />
          </div>
        )}
      </div>
    </nav>
  );
}

// Content Component
function Content({ prompts, openPopup }) {
  return (
    <main className="content">
      <header className="App-header">
        <h1>Prompt Gallery</h1>
      </header>
      <div className="prompt-grid">
        {prompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} openPopup={openPopup} />
        ))}
      </div>
    </main>
  );
}

// Prompt Card Component
function PromptCard({ prompt, openPopup }) {
  return (
    <div className="prompt-card">
      <h2>{prompt.titel}</h2>
      <p>{prompt.body.slice(0, 50)}...</p>
      <p><strong>Afdeling:</strong> {prompt.afdelingen || 'Geen'}</p>
      <p><strong>Functie:</strong> {prompt.functies || 'Geen'}</p>
      <p><strong>Applicatie:</strong> {prompt.applicaties || 'Geen'}</p>
      <p><strong>Werkzaamheden:</strong> {prompt.werkzaamheden || 'Geen'}</p>
      <button className="preview-button" onClick={() => openPopup(prompt)}>
        Bekijk
      </button>
    </div>
  );
}

// Popup Component
function Popup({ prompt, closePopup }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prompt.body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset na 2 seconden
    });
  };

  return (
    <div className="popup-overlay" onClick={closePopup}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <h2>{prompt.titel}</h2>
        <p>{prompt.body}</p>
        <button className="copy-button" onClick={copyToClipboard}>
          {copied ? 'Gekopieërd!' : 'Kopiëren '}
        </button>
        <p><strong>Rating:</strong> {prompt.rating}</p>
        <p><strong>Hoeveelheid-Rating:</strong> {prompt.hoeveelheid_rating}</p>
        <p><strong>Afdeling:</strong> {prompt.afdelingen || 'Geen'}</p>
        <p><strong>Functie:</strong> {prompt.functies || 'Geen'}</p>
        <p><strong>Applicatie:</strong> {prompt.applicaties || 'Geen'}</p>
        <p><strong>Werkzaamheden:</strong> {prompt.werkzaamheden || 'Geen'}</p>
        <button className="close-button" onClick={closePopup}>Sluiten</button>
      </div>
    </div>
  );
}

export default App;
