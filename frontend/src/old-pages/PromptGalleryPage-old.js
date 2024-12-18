import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PromptGalleryPage() {
  const [prompts, setPrompts] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredPrompts, setFilteredPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Data ophalen van de backend
  useEffect(() => {
    axios.get('http://localhost:5000/api/prompts')
      .then(response => {
        setPrompts(response.data);
        setFilteredPrompts(response.data);
      })
      .catch(error => console.error('Error fetching prompts:', error));
  }, []);

  // Filter prompts
  useEffect(() => {
    const filtered = prompts.filter(prompt => {
      const matchesSearch = prompt.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter ? prompt.category === categoryFilter : true;
      return matchesSearch && matchesCategory;
    });
    setFilteredPrompts(filtered);
  }, [search, categoryFilter, prompts]);

  const openPopup = (prompt) => {
    setSelectedPrompt(prompt);
    setShowPopup(true);
  };

  const closePopup = () => {
    setSelectedPrompt(null);
    setShowPopup(false);
  };

  return (
    <div>
      <h1>Prompt Gallery Page</h1>
      <div className="filters">
        <input
          type="text"
          placeholder="Zoeken..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-bar"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="filter-dropdown"
        >
          <option value="">Alle categorieën</option>
          <option value="Writing">Writing</option>
          <option value="Programming">Programming</option>
          <option value="Data Analysis">Data Analysis</option>
          <option value="Marketing">Marketing</option>
        </select>
      </div>
      <main className="prompt-grid">
        {filteredPrompts.map((prompt) => (
          <div key={prompt.id} className="prompt-card">
            <h2>{prompt.title}</h2>
            <p>{prompt.description.slice(0, 50)}...</p>
            <button className="preview-button" onClick={() => openPopup(prompt)}>Bekijk</button>
          </div>
        ))}
      </main>

      {showPopup && selectedPrompt && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedPrompt.title}</h2>
            <p>{selectedPrompt.description}</p>
            <p><strong>Categorie:</strong> {selectedPrompt.category}</p>
            <button className="close-button" onClick={closePopup}>Sluiten</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PromptGalleryPage;
